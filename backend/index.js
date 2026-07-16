const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');
const natural = require('natural');
const vader = require('vader-sentiment');
const afinn = require('afinn-165');
const fs = require('fs');
const multer = require('multer');
const app = express();
app.use(express.json());
app.use(cors());

const config = {
  connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=JUSTER\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
};


sql.connect(config)
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ Connection Error:', err);
  });

const ratingScores = {
  very_satisfied: 1.0,
  satisfied: 0.5,
  neutral: 0.0,
  dissatisfied: -0.5,
  very_dissatisfied: -1.0,
  na: 0.0,
};

const classifier = new natural.BayesClassifier();

classifier.addDocument('excellent service very helpful staff amazing experience', 'Positive');
classifier.addDocument('great resources comfortable environment wonderful visit', 'Positive');
classifier.addDocument('very satisfied with the library services highly recommend', 'Positive');
classifier.addDocument('staff are friendly and professional books are well organized', 'Positive');
classifier.addDocument('love the library always clean and quiet perfect for studying', 'Positive');
classifier.addDocument('fantastic collection helpful librarians outstanding service', 'Positive');
classifier.addDocument('very pleased with the resources available exceeded expectations', 'Positive');
classifier.addDocument('best library experience staff went above and beyond', 'Positive');
classifier.addDocument('books are well maintained and easy to find', 'Positive');
classifier.addDocument('librarians are very accommodating and knowledgeable', 'Positive');


classifier.addDocument('library is okay nothing special average experience', 'Neutral');
classifier.addDocument('services are acceptable could be better but not bad', 'Neutral');
classifier.addDocument('used the library for research it was fine', 'Neutral');
classifier.addDocument('decent collection average staff response time', 'Neutral');
classifier.addDocument('neither good nor bad just a regular visit', 'Neutral');
classifier.addDocument('some things were good some were not satisfactory', 'Neutral');
classifier.addDocument('average overall not impressed but not disappointed', 'Neutral');
classifier.addDocument('the library is okay but could use more computers', 'Neutral');


classifier.addDocument('poor service staff were unhelpful very disappointing', 'Negative');
classifier.addDocument('terrible experience resources outdated disorganized', 'Negative');
classifier.addDocument('very dissatisfied long wait times rude staff', 'Negative');
classifier.addDocument('bad environment noisy dirty not comfortable at all', 'Negative');
classifier.addDocument('worst library experience hard to find books no assistance', 'Negative');
classifier.addDocument('frustrated with the service slow and unresponsive staff', 'Negative');
classifier.addDocument('highly disappointed lacks resources and poor management', 'Negative');
classifier.addDocument('books are outdated and hard to find', 'Negative');
classifier.addDocument('no available computers and slow internet', 'Negative');
classifier.addDocument('librarians were not helpful and ignored my questions', 'Negative');


classifier.train();

function scoreToLabel(score) {
  if (score > 0.15) return 'Positive';
  if (score < -0.15) return 'Negative';
  return 'Neutral';
}

function analyzeSentiment(responses, message) {
  const validResponses = responses.filter(r => r !== null && r !== 'na');
  const ratingAvg = validResponses.length > 0
    ? validResponses.reduce((sum, r) => sum + (ratingScores[r] ?? 0), 0) / validResponses.length
    : 0;
  const emojiSentiment = scoreToLabel(ratingAvg);

  let textSentiment = 'Neutral';
  let textScore = 0;

  if (message && message.trim().length > 0) {
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(message);
    const vaderScore = intensity.compound;

    const nbClassification = classifier.classify(message.toLowerCase());
    const nbScore = nbClassification === 'Positive' ? 1 : nbClassification === 'Negative' ? -1 : 0;

    const words = message.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const scoredWords = words.filter(w => afinn[w] !== undefined);
    const afinnScore = scoredWords.length > 0
      ? scoredWords.reduce((sum, w) => sum + afinn[w], 0) / scoredWords.length / 5
      : 0;

    textScore = vaderScore * 0.40 + nbScore * 0.35 + afinnScore * 0.25;
    textSentiment = scoreToLabel(textScore);
  }

  let overallSentiment;
  if (!message || message.trim().length === 0) {
    overallSentiment = emojiSentiment;
  } else {
    const combinedScore = ratingAvg * 0.50 + textScore * 0.50;
    overallSentiment = scoreToLabel(combinedScore);
  }

  console.log(`📊 Emoji: ${emojiSentiment} | Text: ${textSentiment} | Overall: ${overallSentiment}`);
  return { emojiSentiment, textSentiment, overallSentiment };
}

// =================== MULTER SETUP =================== //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'photos'));
  },
  filename: (req, file, cb) => {
    const idNumber = req.params.idNumber;
    cb(null, `${idNumber}.png`);
  }
});
const upload = multer({ storage });

// =================== EQUIPMENT INVENTORY HELPERS =================== //
const LOW_STOCK_THRESHOLD = 5;

// Status is derived from quantity so it can never drift out of sync with
// the actual count (0 = Out of Stock, 1-5 = Low Stock, else In Stock).
function deriveStatus(quantity) {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
}

// Ensures a brand name exists in the Brands master list. Safe to call
// repeatedly with the same name (no duplicates, no error).
async function upsertBrand(pool, brandName) {
  const name = (brandName || '').trim();
  if (!name) return;
  const existing = await pool.request()
    .input('BrandName', sql.NVarChar, name)
    .query('SELECT BrandId FROM Brands WHERE BrandName = @BrandName');
  if (existing.recordset.length === 0) {
    await pool.request()
      .input('BrandName', sql.NVarChar, name)
      .query('INSERT INTO Brands (BrandName) VALUES (@BrandName)');
  }
}

async function logAssetTransaction(request, {
  assetId, actionType, quantityChanged, previousQuantity, newQuantity,
  destinationSection = null, remarks = null, createdBy = null,
}) {
  await request
    .input('TxAssetId', sql.Int, assetId)
    .input('ActionType', sql.NVarChar, actionType)
    .input('QuantityChanged', sql.Int, quantityChanged)
    .input('PreviousQuantity', sql.Int, previousQuantity)
    .input('NewQuantity', sql.Int, newQuantity)
    .input('DestinationSection', sql.NVarChar, destinationSection)
    .input('Remarks', sql.NVarChar, remarks)
    .input('CreatedBy', sql.NVarChar, createdBy)
    .query(`
      INSERT INTO AssetTransactions
        (AssetId, ActionType, QuantityChanged, PreviousQuantity, NewQuantity, DestinationSection, Remarks, CreatedBy)
      VALUES
        (@TxAssetId, @ActionType, @QuantityChanged, @PreviousQuantity, @NewQuantity, @DestinationSection, @Remarks, @CreatedBy)
    `);
}

// SupplyId is a soft reference (nullable, no FK) — see create_supply_transactions.sql —
// so deleting a supply item never fails just because it has transaction history.
async function logSupplyTransaction(request, {
  supplyId, actionType, quantityChanged, previousQuantity, newQuantity,
  destinationSection = null, remarks = null, createdBy = null,
}) {
  await request
    .input('TxSupplyId', sql.Int, supplyId)
    .input('ActionType', sql.NVarChar, actionType)
    .input('QuantityChanged', sql.Int, quantityChanged)
    .input('PreviousQuantity', sql.Int, previousQuantity)
    .input('NewQuantity', sql.Int, newQuantity)
    .input('DestinationSection', sql.NVarChar, destinationSection)
    .input('Remarks', sql.NVarChar, remarks)
    .input('CreatedBy', sql.NVarChar, createdBy)
    .query(`
      INSERT INTO SupplyTransactions
        (SupplyId, ActionType, QuantityChanged, PreviousQuantity, NewQuantity, DestinationSection, Remarks, CreatedBy)
      VALUES
        (@TxSupplyId, @ActionType, @QuantityChanged, @PreviousQuantity, @NewQuantity, @DestinationSection, @Remarks, @CreatedBy)
    `);
}

// =================== ROUTES =================== //


app.post('/api/survey', async (req, res) => {
  const { clientele, college, course, responses, message } = req.body;

  try {
    const { emojiSentiment, textSentiment, overallSentiment } = analyzeSentiment(responses, message);
    const sentimentResult = overallSentiment;

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input('clientele', sql.NVarChar, clientele);
    request.input('college', sql.NVarChar, college);
    request.input('course', sql.NVarChar, course);
    request.input('message', sql.NVarChar, message);
    request.input('sentimentResult', sql.NVarChar, sentimentResult);

    for (let i = 0; i < 10; i++) {
      request.input(`q${i + 1}`, sql.NVarChar, responses[i] ?? null);
    }

    await request.query(`
      INSERT INTO SatisfactionSurveys (
        Clientele, College, Course, Message,
        Question1, Question2, Question3, Question4, Question5,
        Question6, Question7, Question8, Question9, Question10,
        SentimentResult
      )
      VALUES (
        @clientele, @college, @course, @message,
        @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,
        @sentimentResult
      )
    `);

    res.json({ message: 'Survey submitted', sentimentResult, emojiSentiment, textSentiment });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Failed to save survey');
  }
});

app.post('/api/student-lookup', async (req, res) => {
  const { idNumber, section } = req.body;

  try {
    const pool = await sql.connect(config);

    const studentResult = await pool.request()
      .input('idNumber', sql.VarChar, idNumber)
      .query(`
        SELECT 
          si.studID, si.studIDnumber, si.studLname, si.studFname,
          si.studCourse, si.studYear, si.studCollege, si.studGender
        FROM studInfo AS si
        WHERE si.studIDnumber = @idNumber;
      `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = studentResult.recordset[0];

    const todayLogs = await pool.request()
      .input('idNumber', sql.VarChar, idNumber)
      .input('section', sql.VarChar, section)
      .query(`
        SELECT COUNT(*) AS logCount
        FROM LibLogins
        WHERE studIDnumber = @idNumber
          AND Section = @section
          AND CAST(TimeLogged AS DATE) = CAST(GETDATE() AS DATE);
      `);

    const logCount = todayLogs.recordset[0].logCount;
    const logType = logCount % 2 === 0 ? 'Time In' : 'Time Out';
    const nowPH = moment().utcOffset('+08:00').format("YYYY-MM-DD HH:mm:ss");

    const insertLog = await pool.request()
      .input('studIDnumber', sql.VarChar, student.studIDnumber)
      .input('studLname', sql.NVarChar, student.studLname)
      .input('studFname', sql.NVarChar, student.studFname)
      .input('studCourse', sql.VarChar, student.studCourse || '')
      .input('studYear', sql.VarChar, student.studYear || '')
      .input('studCollege', sql.VarChar, student.studCollege || '')
      .input('studGender', sql.VarChar, student.studGender || '')
      .input('section', sql.VarChar, section)
      .input('studLogType', sql.NVarChar, logType)
      .input('timeLogged', sql.VarChar, nowPH)
      .query(`
        INSERT INTO LibLogins (
          studIDnumber, studLname, studFname, studCourse, studYear,
          studCollege, studGender, Section, studLogType, TimeLogged
        )
        OUTPUT INSERTED.LogID, INSERTED.studLogType
        VALUES (
          @studIDnumber, @studLname, @studFname, @studCourse, @studYear,
          @studCollege, @studGender, @section, @studLogType, @timeLogged
        );
      `);

    const newLog = insertLog.recordset[0];

    res.json({
      ...student,
      logId: newLog.LogID,
      studLogType: newLog.studLogType,
      timeLogged: nowPH,
      message: `${newLog.studLogType} recorded`
    });

  } catch (err) {
    console.error('DB Error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/logins', async (req, res) => {
  const { startDate, endDate, section } = req.query;

  try {
    const pool = await sql.connect(config);

    const conditions = [];
    if (startDate && endDate) conditions.push(`CAST(TimeLogged AS DATE) BETWEEN @startDate AND @endDate`);
    if (section) conditions.push(`Section = @section`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        LogID, studIDnumber, studLname, studFname,
        studCourse, studYear, studCollege, Section,
        CONVERT(VARCHAR, TimeLogged, 120) AS TimeLogged,
        studLogType, studGender
      FROM LibLogins
      ${whereClause}
      ORDER BY TimeLogged DESC
    `;

    const request = pool.request();
    if (startDate && endDate) {
      request.input('startDate', sql.Date, new Date(startDate));
      request.input('endDate', sql.Date, new Date(endDate));
    }
    if (section) request.input('section', sql.VarChar, section);

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error fetching logins:', err);
    res.status(500).json({ message: 'Failed to fetch logins' });
  }
});

app.get('/api/surveys', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const pool = await sql.connect(config);

    let query = `
      SELECT Id, Clientele, College, Course, Message,
             Question1, Question2, Question3, Question4, Question5,
             Question6, Question7, Question8, Question9, Question10,
             SentimentResult,
             FORMAT(DateSubmitted AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time', 'yyyy-MM-dd HH:mm:ss') AS DateSubmitted
      FROM SatisfactionSurveys
    `;

    if (startDate && endDate) {
      query += `
        WHERE (DateSubmitted AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time')
        BETWEEN @startDate AND @endDate
      `;
      const result = await pool.request()
        .input('startDate', sql.DateTime, new Date(startDate))
        .input('endDate', sql.DateTime, new Date(endDate))
        .query(query);
      return res.json(result.recordset);
    }

    const result = await pool.request().query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ message: 'Failed to fetch surveys' });
  }
});
// ==========================================
//  DELETE A SURVEY RESPONSE BY ID
// ==========================================
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing review ID' });
    }

    // Connect using your specific configuration variable name (e.g., config)
    const pool = await sql.connect(config);

    // Explicitly target your database and table as shown in image_eab6a1.png
    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('DELETE FROM [hllSystem].[dbo].[SatisfactionSurveys] WHERE Id = @Id');

    res.json({ success: true, message: 'Review successfully deleted.' });

  } catch (err) {
    console.error('SQL Server Error during deletion:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =================== DELETE ENTRY FROM CARD AND PACKETS =================== //
app.delete('/api/card-and-packet/:id/book/:bookNum', async (req, res) => {
  const { id, bookNum } = req.params;
  const n = parseInt(bookNum);

  if (![1, 2, 3, 4].includes(n)) {
    return res.status(400).json({ message: 'Invalid book number.' });
  }

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE CardAndPacket SET
          selectedLibrary${n} = '', section${n} = '',
          authorLastName${n} = '', authorFirstName${n} = '', authorMiddleInitial${n} = '', publisherAuthor${n} = '',
          bookTitle${n} = '', accessionNumber${n} = '', callNumber${n} = '',
          copyNumber${n} = '', barcodeValue${n} = '', isoCodeValue${n} = '',
          updatedAt = GETDATE()
        WHERE CardID = @id
      `);
    res.json({ message: 'Book entry cleared successfully.' });
  } catch (err) {
    console.error('Error clearing book entry:', err);
    res.status(500).json({ message: 'Failed to delete book entry.' });
  }
});




// =================== CARD AND PACKET TABLE FETCH =================== //

app.get('/api/card-and-packet', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT * FROM CardAndPacket ORDER BY CardID DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching card and packet records:', err);
    res.status(500).json({ error: 'Failed to fetch card and packet records' });
  }
});



// =================== CARD AND PACKET =================== //



app.post('/api/card-and-packet', async (req, res) => {
  const {
    selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
    authorLastName1, authorFirstName1, authorMiddleInitial1, publisherAuthor1,
    authorLastName2, authorFirstName2, authorMiddleInitial2, publisherAuthor2,
    authorLastName3, authorFirstName3, authorMiddleInitial3, publisherAuthor3,
    authorLastName4, authorFirstName4, authorMiddleInitial4, publisherAuthor4,
    bookTitle1, bookTitle2, bookTitle3, bookTitle4,
    accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
    callNumber1, callNumber2, callNumber3, callNumber4,
    copyNumber1, copyNumber2, copyNumber3, copyNumber4,
    barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
    isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
  } = req.body;

  try {
    const pool = await sql.connect(config);

    const checkDuplicate = await pool.request()
      .input('accessionNumber1', sql.NVarChar, accessionNumber1 || '')
      .query(`SELECT COUNT(*) AS count FROM CardAndPacket WHERE accessionNumber1 = @accessionNumber1 AND accessionNumber1 != ''`);

    if (checkDuplicate.recordset[0].count > 0) {
      return res.status(400).json({ message: `Accession number "${accessionNumber1}" already exists!` });
    }

    await pool.request()
      .input('selectedLibrary1', sql.NVarChar, selectedLibrary1 || '')
      .input('section1', sql.NVarChar, section1 || '')
      .input('selectedLibrary2', sql.NVarChar, selectedLibrary2 || '')
      .input('section2', sql.NVarChar, section2 || '')
      .input('selectedLibrary3', sql.NVarChar, selectedLibrary3 || '')
      .input('section3', sql.NVarChar, section3 || '')
      .input('selectedLibrary4', sql.NVarChar, selectedLibrary4 || '')
      .input('section4', sql.NVarChar, section4 || '')
      .input('authorLastName1', sql.NVarChar, authorLastName1 || '')
      .input('authorFirstName1', sql.NVarChar, authorFirstName1 || '')
      .input('authorMiddleInitial1', sql.NVarChar, authorMiddleInitial1 || '')
      .input('publisherAuthor1', sql.NVarChar, publisherAuthor1 || '')
      .input('authorLastName2', sql.NVarChar, authorLastName2 || '')
      .input('authorFirstName2', sql.NVarChar, authorFirstName2 || '')
      .input('authorMiddleInitial2', sql.NVarChar, authorMiddleInitial2 || '')
      .input('publisherAuthor2', sql.NVarChar, publisherAuthor2 || '')
      .input('authorLastName3', sql.NVarChar, authorLastName3 || '')
      .input('authorFirstName3', sql.NVarChar, authorFirstName3 || '')
      .input('authorMiddleInitial3', sql.NVarChar, authorMiddleInitial3 || '')
      .input('publisherAuthor3', sql.NVarChar, publisherAuthor3 || '')
      .input('authorLastName4', sql.NVarChar, authorLastName4 || '')
      .input('authorFirstName4', sql.NVarChar, authorFirstName4 || '')
      .input('authorMiddleInitial4', sql.NVarChar, authorMiddleInitial4 || '')
      .input('publisherAuthor4', sql.NVarChar, publisherAuthor4 || '')
      .input('bookTitle1', sql.NVarChar, bookTitle1 || '')
      .input('bookTitle2', sql.NVarChar, bookTitle2 || '')
      .input('bookTitle3', sql.NVarChar, bookTitle3 || '')
      .input('bookTitle4', sql.NVarChar, bookTitle4 || '')
      .input('accessionNumber1', sql.NVarChar, accessionNumber1 || '')
      .input('accessionNumber2', sql.NVarChar, accessionNumber2 || '')
      .input('accessionNumber3', sql.NVarChar, accessionNumber3 || '')
      .input('accessionNumber4', sql.NVarChar, accessionNumber4 || '')
      .input('callNumber1', sql.NVarChar, callNumber1 || '')
      .input('callNumber2', sql.NVarChar, callNumber2 || '')
      .input('callNumber3', sql.NVarChar, callNumber3 || '')
      .input('callNumber4', sql.NVarChar, callNumber4 || '')
      .input('copyNumber1', sql.NVarChar, copyNumber1 || '')
      .input('copyNumber2', sql.NVarChar, copyNumber2 || '')
      .input('copyNumber3', sql.NVarChar, copyNumber3 || '')
      .input('copyNumber4', sql.NVarChar, copyNumber4 || '')
      .input('barcodeValue1', sql.NVarChar, barcodeValue1 || '')
      .input('barcodeValue2', sql.NVarChar, barcodeValue2 || '')
      .input('barcodeValue3', sql.NVarChar, barcodeValue3 || '')
      .input('barcodeValue4', sql.NVarChar, barcodeValue4 || '')
      .input('isoCodeValue1', sql.NVarChar, isoCodeValue1 || '')
      .input('isoCodeValue2', sql.NVarChar, isoCodeValue2 || '')
      .input('isoCodeValue3', sql.NVarChar, isoCodeValue3 || '')
      .input('isoCodeValue4', sql.NVarChar, isoCodeValue4 || '')
      .query(`
        INSERT INTO CardAndPacket (
          selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
          authorLastName1, authorFirstName1, authorMiddleInitial1, publisherAuthor1,
          authorLastName2, authorFirstName2, authorMiddleInitial2, publisherAuthor2,
          authorLastName3, authorFirstName3, authorMiddleInitial3, publisherAuthor3,
          authorLastName4, authorFirstName4, authorMiddleInitial4, publisherAuthor4,
          bookTitle1, bookTitle2, bookTitle3, bookTitle4,
          accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
          callNumber1, callNumber2, callNumber3, callNumber4,
          copyNumber1, copyNumber2, copyNumber3, copyNumber4,
          barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
          isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4
        ) VALUES (
          @selectedLibrary1, @section1, @selectedLibrary2, @section2, @selectedLibrary3, @section3, @selectedLibrary4, @section4,
          @authorLastName1, @authorFirstName1, @authorMiddleInitial1, @publisherAuthor1,
          @authorLastName2, @authorFirstName2, @authorMiddleInitial2, @publisherAuthor2,
          @authorLastName3, @authorFirstName3, @authorMiddleInitial3, @publisherAuthor3,
          @authorLastName4, @authorFirstName4, @authorMiddleInitial4, @publisherAuthor4,
          @bookTitle1, @bookTitle2, @bookTitle3, @bookTitle4,
          @accessionNumber1, @accessionNumber2, @accessionNumber3, @accessionNumber4,
          @callNumber1, @callNumber2, @callNumber3, @callNumber4,
          @copyNumber1, @copyNumber2, @copyNumber3, @copyNumber4,
          @barcodeValue1, @barcodeValue2, @barcodeValue3, @barcodeValue4,
          @isoCodeValue1, @isoCodeValue2, @isoCodeValue3, @isoCodeValue4
        )
      `);

    res.json({ message: 'Card and Packet saved successfully!' });
  } catch (err) {
    console.error('Error saving card and packet:', err);
    res.status(500).json({ message: 'Failed to save.' });
  }
});

app.get('/api/card-and-packet/search', async (req, res) => {
  const { accessionNumber } = req.query;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('accessionNumber', sql.NVarChar, accessionNumber)
      .query(`
        SELECT * FROM CardAndPacket
        WHERE accessionNumber1 = @accessionNumber
           OR accessionNumber2 = @accessionNumber
           OR accessionNumber3 = @accessionNumber
           OR accessionNumber4 = @accessionNumber
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({ message: 'Search failed.' });
  }
});

app.put('/api/card-and-packet/:id', async (req, res) => {
  const { id } = req.params;
  const {
    selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
    authorLastName1, authorFirstName1, authorMiddleInitial1, publisherAuthor1,
    authorLastName2, authorFirstName2, authorMiddleInitial2, publisherAuthor2,
    authorLastName3, authorFirstName3, authorMiddleInitial3, publisherAuthor3,
    authorLastName4, authorFirstName4, authorMiddleInitial4, publisherAuthor4,
    bookTitle1, bookTitle2, bookTitle3, bookTitle4,
    accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
    callNumber1, callNumber2, callNumber3, callNumber4,
    copyNumber1, copyNumber2, copyNumber3, copyNumber4,
    barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
    isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
  } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('id', sql.Int, id)
      .input('selectedLibrary1', sql.NVarChar, selectedLibrary1 || '')
      .input('section1', sql.NVarChar, section1 || '')
      .input('selectedLibrary2', sql.NVarChar, selectedLibrary2 || '')
      .input('section2', sql.NVarChar, section2 || '')
      .input('selectedLibrary3', sql.NVarChar, selectedLibrary3 || '')
      .input('section3', sql.NVarChar, section3 || '')
      .input('selectedLibrary4', sql.NVarChar, selectedLibrary4 || '')
      .input('section4', sql.NVarChar, section4 || '')
      .input('authorLastName1', sql.NVarChar, authorLastName1 || '')
      .input('authorFirstName1', sql.NVarChar, authorFirstName1 || '')
      .input('authorMiddleInitial1', sql.NVarChar, authorMiddleInitial1 || '')
      .input('publisherAuthor1', sql.NVarChar, publisherAuthor1 || '')
      .input('authorLastName2', sql.NVarChar, authorLastName2 || '')
      .input('authorFirstName2', sql.NVarChar, authorFirstName2 || '')
      .input('authorMiddleInitial2', sql.NVarChar, authorMiddleInitial2 || '')
      .input('publisherAuthor2', sql.NVarChar, publisherAuthor2 || '')
      .input('authorLastName3', sql.NVarChar, authorLastName3 || '')
      .input('authorFirstName3', sql.NVarChar, authorFirstName3 || '')
      .input('authorMiddleInitial3', sql.NVarChar, authorMiddleInitial3 || '')
      .input('publisherAuthor3', sql.NVarChar, publisherAuthor3 || '')
      .input('authorLastName4', sql.NVarChar, authorLastName4 || '')
      .input('authorFirstName4', sql.NVarChar, authorFirstName4 || '')
      .input('authorMiddleInitial4', sql.NVarChar, authorMiddleInitial4 || '')
      .input('publisherAuthor4', sql.NVarChar, publisherAuthor4 || '')
      .input('bookTitle1', sql.NVarChar, bookTitle1 || '')
      .input('bookTitle2', sql.NVarChar, bookTitle2 || '')
      .input('bookTitle3', sql.NVarChar, bookTitle3 || '')
      .input('bookTitle4', sql.NVarChar, bookTitle4 || '')
      .input('accessionNumber1', sql.NVarChar, accessionNumber1 || '')
      .input('accessionNumber2', sql.NVarChar, accessionNumber2 || '')
      .input('accessionNumber3', sql.NVarChar, accessionNumber3 || '')
      .input('accessionNumber4', sql.NVarChar, accessionNumber4 || '')
      .input('callNumber1', sql.NVarChar, callNumber1 || '')
      .input('callNumber2', sql.NVarChar, callNumber2 || '')
      .input('callNumber3', sql.NVarChar, callNumber3 || '')
      .input('callNumber4', sql.NVarChar, callNumber4 || '')
      .input('copyNumber1', sql.NVarChar, copyNumber1 || '')
      .input('copyNumber2', sql.NVarChar, copyNumber2 || '')
      .input('copyNumber3', sql.NVarChar, copyNumber3 || '')
      .input('copyNumber4', sql.NVarChar, copyNumber4 || '')
      .input('barcodeValue1', sql.NVarChar, barcodeValue1 || '')
      .input('barcodeValue2', sql.NVarChar, barcodeValue2 || '')
      .input('barcodeValue3', sql.NVarChar, barcodeValue3 || '')
      .input('barcodeValue4', sql.NVarChar, barcodeValue4 || '')
      .input('isoCodeValue1', sql.NVarChar, isoCodeValue1 || '')
      .input('isoCodeValue2', sql.NVarChar, isoCodeValue2 || '')
      .input('isoCodeValue3', sql.NVarChar, isoCodeValue3 || '')
      .input('isoCodeValue4', sql.NVarChar, isoCodeValue4 || '')
      .query(`
        UPDATE CardAndPacket SET
          selectedLibrary1=@selectedLibrary1, section1=@section1,
          selectedLibrary2=@selectedLibrary2, section2=@section2,
          selectedLibrary3=@selectedLibrary3, section3=@section3,
          selectedLibrary4=@selectedLibrary4, section4=@section4,
          authorLastName1=@authorLastName1, authorFirstName1=@authorFirstName1, authorMiddleInitial1=@authorMiddleInitial1, publisherAuthor1=@publisherAuthor1,
          authorLastName2=@authorLastName2, authorFirstName2=@authorFirstName2, authorMiddleInitial2=@authorMiddleInitial2, publisherAuthor2=@publisherAuthor2,
          authorLastName3=@authorLastName3, authorFirstName3=@authorFirstName3, authorMiddleInitial3=@authorMiddleInitial3, publisherAuthor3=@publisherAuthor3,
          authorLastName4=@authorLastName4, authorFirstName4=@authorFirstName4, authorMiddleInitial4=@authorMiddleInitial4, publisherAuthor4=@publisherAuthor4,
          bookTitle1=@bookTitle1, bookTitle2=@bookTitle2, bookTitle3=@bookTitle3, bookTitle4=@bookTitle4,
          accessionNumber1=@accessionNumber1, accessionNumber2=@accessionNumber2, accessionNumber3=@accessionNumber3, accessionNumber4=@accessionNumber4,
          callNumber1=@callNumber1, callNumber2=@callNumber2, callNumber3=@callNumber3, callNumber4=@callNumber4,
          copyNumber1=@copyNumber1, copyNumber2=@copyNumber2, copyNumber3=@copyNumber3, copyNumber4=@copyNumber4,
          barcodeValue1=@barcodeValue1, barcodeValue2=@barcodeValue2, barcodeValue3=@barcodeValue3, barcodeValue4=@barcodeValue4,
          isoCodeValue1=@isoCodeValue1, isoCodeValue2=@isoCodeValue2, isoCodeValue3=@isoCodeValue3, isoCodeValue4=@isoCodeValue4,
          updatedAt=GETDATE()
        WHERE CardID=@id
      `);

    res.json({ message: 'Updated successfully!' });
  } catch (err) {
    console.error('Error updating:', err);
    res.status(500).json({ message: 'Update failed.' });
  }
});


// =================== OFFICE SUPPLIES =================== //

app.get('/api/supplies', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT * FROM OfficeSupplies ORDER BY DateAdded DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplies' });
  }
});

app.post('/api/supplies', async (req, res) => {
  const { itemName, description, brand, quantity, location, specifications, user } = req.body;

  const qty = parseInt(quantity);
  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ message: 'Item name is required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  try {
    const pool = await sql.connect(config);
    const status = deriveStatus(qty); // status is always derived server-side, never trusted from the client

    if (brand && brand.trim()) {
      await upsertBrand(pool, brand);
    }

    const insertResult = await pool.request()
      .input('ItemName', sql.NVarChar, itemName.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('Brand', sql.NVarChar, (brand || '').trim())
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .query(`INSERT INTO OfficeSupplies
        (ItemName, Description, Brand, Quantity, Status, Condition, Location, Specifications)
        OUTPUT INSERTED.Id
        VALUES (@ItemName, @Description, @Brand, @Quantity, @Status, @Condition, @Location, @Specifications)`);

    const newId = insertResult.recordset[0].Id;

    await logSupplyTransaction(pool.request(), {
      supplyId: newId,
      actionType: 'Added',
      quantityChanged: qty,
      previousQuantity: 0,
      newQuantity: qty,
      createdBy: user,
    });

    res.json({ success: true, id: newId });
  } catch (err) {
    console.error('Failed to add supply:', err);
    res.status(500).json({ error: 'Failed to add supply' });
  }
});

app.put('/api/supplies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, description, brand, quantity, location, specifications, user } = req.body;

    const qty = parseInt(quantity);
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required.' });
    }
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative.' });
    }

    const pool = await sql.connect(config);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }
    const previousQuantity = existing.recordset[0].Quantity;

    if (brand && brand.trim()) {
      await upsertBrand(pool, brand);
    }

    const status = deriveStatus(qty);
    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .input('ItemName', sql.NVarChar, itemName.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('Brand', sql.NVarChar, (brand || '').trim())
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`UPDATE OfficeSupplies SET
        ItemName=@ItemName, Description=@Description, Brand=@Brand,
        Quantity=@Quantity, Status=@Status,
        Condition=@Condition, Location=@Location, Specifications=@Specifications,
        UpdatedAt=@UpdatedAt WHERE Id=@Id`);

    if (qty !== previousQuantity) {
      await logSupplyTransaction(pool.request(), {
        supplyId: id,
        actionType: 'Updated',
        quantityChanged: qty - previousQuantity,
        previousQuantity,
        newQuantity: qty,
        createdBy: user,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update supply:', err);
    res.status(500).json({ error: 'Failed to update supply' });
  }
});

app.delete('/api/supplies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }
    const quantity = existing.recordset[0].Quantity;

    await logSupplyTransaction(pool.request(), {
      supplyId: id,
      actionType: 'Deleted',
      quantityChanged: -quantity,
      previousQuantity: quantity,
      newQuantity: 0,
      createdBy: req.body?.user,
    });

    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('DELETE FROM OfficeSupplies WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete supply' });
  }
});

// ---- Add Stock: never creates a duplicate row, just increases quantity ----
app.post('/api/supplies/:id/add-stock', async (req, res) => {
  const { id } = req.params;
  const { additionalQuantity, user } = req.body;
  const addQty = parseInt(additionalQuantity);

  if (Number.isNaN(addQty) || addQty < 1) {
    return res.status(400).json({ message: 'Additional quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const existing = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Supply item not found.' });
    }

    const previousQuantity = existing.recordset[0].Quantity;
    const newQuantity = previousQuantity + addQty;
    const status = deriveStatus(newQuantity);

    await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .input('Quantity', sql.Int, newQuantity)
      .input('Status', sql.NVarChar, status)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    await logSupplyTransaction(new sql.Request(transaction), {
      supplyId: id,
      actionType: 'Added Stock',
      quantityChanged: addQty,
      previousQuantity,
      newQuantity,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

// ---- Send/Transfer Supply: deducts stock, prevents negative inventory ----
app.post('/api/supplies/:id/send', async (req, res) => {
  const { id } = req.params;
  const { quantity, destination, remarks, user } = req.body;
  const sendQty = parseInt(quantity);

  if (!destination) {
    return res.status(400).json({ message: 'Destination section is required.' });
  }
  if (Number.isNaN(sendQty) || sendQty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const existing = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT ItemName, Quantity FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Supply item not found.' });
    }

    const previousQuantity = existing.recordset[0].Quantity;
    if (sendQty > previousQuantity) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Insufficient stock available. Available Quantity: ${previousQuantity}. Requested Quantity: ${sendQty}.`,
      });
    }

    const newQuantity = previousQuantity - sendQty;
    const status = deriveStatus(newQuantity);

    await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .input('Quantity', sql.Int, newQuantity)
      .input('Status', sql.NVarChar, status)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    await logSupplyTransaction(new sql.Request(transaction), {
      supplyId: id,
      actionType: 'Transferred',
      quantityChanged: -sendQty,
      previousQuantity,
      newQuantity,
      destinationSection: destination,
      remarks: remarks || null,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to send supply.' });
  }
});

// =================== SUPPLY TRANSACTION HISTORY =================== //

app.get('/api/supply-transactions', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT
        t.TransactionId AS transaction_id,
        t.ActionType AS action_type,
        t.QuantityChanged AS quantity_changed,
        t.PreviousQuantity AS previous_quantity,
        t.NewQuantity AS new_quantity,
        t.DestinationSection AS destination_section,
        t.Remarks AS remarks,
        t.CreatedBy AS created_by,
        CONVERT(VARCHAR, t.CreatedAt, 120) AS created_at,
        ISNULL(s.ItemName, '(deleted item)') AS supply_name
      FROM SupplyTransactions t
      LEFT JOIN OfficeSupplies s ON t.SupplyId = s.Id
      ORDER BY t.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supply transaction history' });
  }
});

// =================== SUPPLIES DASHBOARD SUMMARY =================== //

app.get('/api/supplies/dashboard/summary', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const stats = await pool.request().query(`
      SELECT
        COUNT(*) AS totalItems,
        ISNULL(SUM(Quantity), 0) AS totalInventory,
        SUM(CASE WHEN Quantity <= 0 THEN 1 ELSE 0 END) AS outOfStock
      FROM OfficeSupplies
    `);

    const transferredToday = await pool.request().query(`
      SELECT ISNULL(SUM(-QuantityChanged), 0) AS transferredToday
      FROM SupplyTransactions
      WHERE ActionType = 'Transferred' AND CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
    `);

    res.json({
      totalItems: stats.recordset[0].totalItems,
      totalInventory: stats.recordset[0].totalInventory,
      outOfStock: stats.recordset[0].outOfStock,
      transferredToday: transferredToday.recordset[0].transferredToday,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplies dashboard summary' });
  }
});

// =================== LIBRARY EQUIPMENT =================== //

app.get('/api/equipment', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT * FROM LibraryEquipment ORDER BY DateAdded DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

app.post('/api/equipment', async (req, res) => {
  const { itemName, description, brand, quantity, serialNumber, location, specifications, user } = req.body;

  const qty = parseInt(quantity);
  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ message: 'Item name is required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  try {
    const pool = await sql.connect(config);
    const status = deriveStatus(qty);

    if (brand && brand.trim()) {
      await upsertBrand(pool, brand);
    }

    const insertResult = await pool.request()
      .input('ItemName', sql.NVarChar, itemName.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('Brand', sql.NVarChar, (brand || '').trim())
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('SerialNumber', sql.NVarChar, serialNumber || '')
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .query(`INSERT INTO LibraryEquipment 
        (ItemName, Description, Brand, Quantity, Status, SerialNumber, Condition, Location, Specifications)
        OUTPUT INSERTED.Id
        VALUES 
        (@ItemName, @Description, @Brand, @Quantity, @Status, @SerialNumber, @Condition, @Location, @Specifications)`);

    const newId = insertResult.recordset[0].Id;

    await logAssetTransaction(pool.request(), {
      assetId: newId,
      actionType: 'Added Asset',
      quantityChanged: qty,
      previousQuantity: 0,
      newQuantity: qty,
      createdBy: user,
    });

    res.json({ success: true, id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add equipment' });
  }
});

app.put('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, description, brand, quantity, serialNumber, location, specifications, user } = req.body;

    const qty = parseInt(quantity);
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required.' });
    }
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative.' });
    }

    const pool = await sql.connect(config);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }
    const previousQuantity = existing.recordset[0].Quantity;

    if (brand && brand.trim()) {
      await upsertBrand(pool, brand);
    }

    const status = deriveStatus(qty);
    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .input('ItemName', sql.NVarChar, itemName.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('Brand', sql.NVarChar, (brand || '').trim())
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('SerialNumber', sql.NVarChar, serialNumber || '')
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`UPDATE LibraryEquipment SET
        ItemName=@ItemName, Description=@Description, Brand=@Brand,
        Quantity=@Quantity, Status=@Status, SerialNumber=@SerialNumber,
        Condition=@Condition, Location=@Location, Specifications=@Specifications,
        UpdatedAt=@UpdatedAt WHERE Id=@Id`);

    if (qty !== previousQuantity) {
      await logAssetTransaction(pool.request(), {
        assetId: id,
        actionType: 'Updated Asset',
        quantityChanged: qty - previousQuantity,
        previousQuantity,
        newQuantity: qty,
        createdBy: user,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }
    const quantity = existing.recordset[0].Quantity;

    await logAssetTransaction(pool.request(), {
      assetId: id,
      actionType: 'Deleted Asset',
      quantityChanged: -quantity,
      previousQuantity: quantity,
      newQuantity: 0,
      createdBy: req.body?.user,
    });

    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('DELETE FROM LibraryEquipment WHERE Id=@Id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

// ---- Add Stock: never creates a duplicate row, just increases quantity ----
app.post('/api/equipment/:id/add-stock', async (req, res) => {
  const { id } = req.params;
  const { additionalQuantity, user } = req.body;
  const addQty = parseInt(additionalQuantity);

  if (Number.isNaN(addQty) || addQty < 1) {
    return res.status(400).json({ message: 'Additional quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const existing = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    const previousQuantity = existing.recordset[0].Quantity;
    const newQuantity = previousQuantity + addQty;
    const status = deriveStatus(newQuantity);

    await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .input('Quantity', sql.Int, newQuantity)
      .input('Status', sql.NVarChar, status)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    await logAssetTransaction(new sql.Request(transaction), {
      assetId: id,
      actionType: 'Added Stock',
      quantityChanged: addQty,
      previousQuantity,
      newQuantity,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

// ---- Send Asset: deducts stock, prevents negative inventory ----
app.post('/api/equipment/:id/send', async (req, res) => {
  const { id } = req.params;
  const { quantity, destination, remarks, user } = req.body;
  const sendQty = parseInt(quantity);

  if (!destination) {
    return res.status(400).json({ message: 'Destination section is required.' });
  }
  if (Number.isNaN(sendQty) || sendQty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const existing = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT ItemName, Quantity FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    const previousQuantity = existing.recordset[0].Quantity;
    if (sendQty > previousQuantity) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Insufficient stock available. Available Quantity: ${previousQuantity}. Requested Quantity: ${sendQty}.`,
      });
    }

    const newQuantity = previousQuantity - sendQty;
    const status = deriveStatus(newQuantity);

    await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .input('Quantity', sql.Int, newQuantity)
      .input('Status', sql.NVarChar, status)
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    await logAssetTransaction(new sql.Request(transaction), {
      assetId: id,
      actionType: 'Sent Asset',
      quantityChanged: -sendQty,
      previousQuantity,
      newQuantity,
      destinationSection: destination,
      remarks: remarks || null,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to send asset.' });
  }
});

// =================== BRANDS =================== //

app.get('/api/brands', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT BrandId AS brand_id, BrandName AS brand_name FROM Brands ORDER BY BrandName');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

app.post('/api/brands', async (req, res) => {
  try {
    const { brandName } = req.body;
    if (!brandName || !brandName.trim()) {
      return res.status(400).json({ message: 'Brand name is required.' });
    }
    const pool = await sql.connect(config);
    await upsertBrand(pool, brandName);
    const result = await pool.request()
      .input('BrandName', sql.NVarChar, brandName.trim())
      .query('SELECT BrandId AS brand_id, BrandName AS brand_name FROM Brands WHERE BrandName = @BrandName');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save brand.' });
  }
});

// =================== SECTIONS =================== //

app.get('/api/sections', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT SectionId AS section_id, SectionName AS section_name FROM Sections ORDER BY SectionName');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// =================== TRANSACTION HISTORY =================== //

app.get('/api/transactions', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT
        t.TransactionId AS transaction_id,
        t.ActionType AS action_type,
        t.QuantityChanged AS quantity_changed,
        t.PreviousQuantity AS previous_quantity,
        t.NewQuantity AS new_quantity,
        t.DestinationSection AS destination_section,
        t.Remarks AS remarks,
        t.CreatedBy AS created_by,
        CONVERT(VARCHAR, t.CreatedAt, 120) AS created_at,
        ISNULL(e.ItemName, '(deleted item)') AS asset_name
      FROM AssetTransactions t
      LEFT JOIN LibraryEquipment e ON t.AssetId = e.Id
      ORDER BY t.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// =================== DASHBOARD SUMMARY =================== //

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const assetStats = await pool.request().query(`
      SELECT
        COUNT(*) AS totalAssets,
        ISNULL(SUM(Quantity), 0) AS totalInventory,
        SUM(CASE WHEN Quantity > 0 AND Quantity <= ${LOW_STOCK_THRESHOLD} THEN 1 ELSE 0 END) AS lowStock
      FROM LibraryEquipment
    `);

    const sentToday = await pool.request().query(`
      SELECT ISNULL(SUM(-QuantityChanged), 0) AS sentToday
      FROM AssetTransactions
      WHERE ActionType = 'Sent Asset' AND CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
    `);

    res.json({
      totalAssets: assetStats.recordset[0].totalAssets,
      totalInventory: assetStats.recordset[0].totalInventory,
      lowStock: assetStats.recordset[0].lowStock,
      sentToday: sentToday.recordset[0].sentToday,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// =================== PHOTOS =================== //

// Upload photo
app.post('/api/photos/:idNumber', upload.single('photo'), (req, res) => {
  res.json({ message: 'Photo uploaded successfully!' });
});

// Get photo
app.get('/api/photos/:idNumber', (req, res) => {
  const { idNumber } = req.params;
  const filePath = path.join(__dirname, 'photos', `${idNumber}.png`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Photo not found' });
  }
});

// =================== STATIC FILES =================== //

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// =================== START SERVER =================== //
app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Server running on http://0.0.0.0:5000');
});