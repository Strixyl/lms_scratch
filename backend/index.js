const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');
const axios = require('axios');
const fs = require('fs');
const multer = require('multer');
const app = express();
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  if (req.url.startsWith('/performance') || req.url === '/favicon.ico') {
    return res.status(200).end();
  }
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

async function analyzeSentiment(responses, message) {
  const ratingScores = {
    very_satisfied: 1.0, satisfied: 0.5, neutral: 0.0,
    dissatisfied: -0.5, very_dissatisfied: -1.0, na: 0.0,
  };

  // ── Emoji ratings score ──
  const validResponses = responses.filter(r => r !== null && r !== 'na');
  const ratingAvg = validResponses.length > 0
    ? validResponses.reduce((sum, r) => sum + (ratingScores[r] ?? 0), 0) / validResponses.length
    : 0;

  const emojiSentiment = ratingAvg > 0.15 ? 'Positive' : ratingAvg < -0.15 ? 'Negative' : 'Neutral';

  // ── BERT text sentiment + Naive Bayes category (run in parallel, same input) ──
  let textSentiment = 'Neutral';
  let category = 'Other/Uncategorized';
  if (message && message.trim().length > 0) {
    const [sentimentResult, categoryResult] = await Promise.all([
      axios.post('http://localhost:5001/analyze', { text: message }).catch(err => {
        console.error('BERT service error:', err.message);
        return null; // fallback if Python is down
      }),
      axios.post('http://localhost:5001/categorize', { text: message }).catch(err => {
        console.error('Category service error:', err.message);
        return null; // fallback if Python is down
      }),
    ]);

    textSentiment = sentimentResult?.data?.sentiment ?? 'Neutral';
    category = categoryResult?.data?.category ?? 'Other/Uncategorized';
  }

  // ── Combined result (Option A: Comment-First) ──
  let overallSentiment;
  let sentimentScore;
  if (!message || message.trim().length === 0) {
    // No comment submitted -> fallback to 10-question emoji satisfaction rating
    overallSentiment = emojiSentiment;
    sentimentScore = ratingAvg;
  } else {
    // Open-ended comment submitted -> sentiment is strictly based on the patron's written feedback (BERT)
    overallSentiment = textSentiment;
    sentimentScore = textSentiment === 'Positive' ? 1.0 : textSentiment === 'Negative' ? -1.0 : 0.0;
  }

  console.log(`📊 Emoji: ${emojiSentiment} | BERT: ${textSentiment} | Category: ${category} | Overall: ${overallSentiment}`);
  return { emojiSentiment, textSentiment, overallSentiment, category, sentimentScore };
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
const LOW_STOCK_THRESHOLD = 4;

function cleanTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Status is derived from quantity based on simplified rules:
// Qty > 0 = 'In Stock'; Qty <= 0 = 'Out of Stock'
function deriveStatus(quantity) {
  if (quantity <= 0) return 'Out of Stock';
  return 'In Stock';
}

// Ensures a brand name exists in the Brands master list. Safe to call
// repeatedly with the same name (no duplicates, no error).
async function upsertBrand(pool, brandName) {
  const name = cleanTitleCase(brandName);
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

// A "profile" = one physical asset type, identified by name+brand (grouped per requirement)
function profileKey(row) {
  return [row.ItemName?.trim().toLowerCase(), (row.Brand || '').trim().toLowerCase()].join('||');
}

async function findEquipmentRowAtLocation(request, { itemName, brand, serialNumber, location }) {
  const result = await request
    .input('ItemName', sql.NVarChar, itemName.trim())
    .input('Brand', sql.NVarChar, (brand || '').trim())
    .input('SerialNumber', sql.NVarChar, (serialNumber || '').trim())
    .input('Location', sql.NVarChar, location.trim())
    .query(`SELECT * FROM LibraryEquipment
            WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
              AND ISNULL(SerialNumber,'') = @SerialNumber AND ISNULL(Location,'') = @Location`);
  return result.recordset[0] || null;
}

function supplyProfileKey(row) {
  return [row.ItemName?.trim().toLowerCase(), (row.Brand || '').trim().toLowerCase()].join('||');
}

async function findSupplyRowAtLocation(request, { itemName, brand, location }) {
  const result = await request
    .input('ItemName', sql.NVarChar, itemName.trim())
    .input('Brand', sql.NVarChar, (brand || '').trim())
    .input('Location', sql.NVarChar, location.trim())
    .query(`SELECT * FROM OfficeSupplies
            WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
              AND ISNULL(Location,'') = @Location`);
  return result.recordset[0] || null;
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
    const { emojiSentiment, textSentiment, overallSentiment, category, sentimentScore } = await analyzeSentiment(responses, message);
    const sentimentResult = overallSentiment;

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input('clientele', sql.NVarChar, clientele);
    request.input('college', sql.NVarChar, college);
    request.input('course', sql.NVarChar, course);
    request.input('message', sql.NVarChar, message);
    request.input('sentimentResult', sql.NVarChar, sentimentResult);
    request.input('category', sql.NVarChar, category);
    request.input('sentimentScore', sql.Float, sentimentScore);

    for (let i = 0; i < 10; i++) {
      request.input(`q${i + 1}`, sql.NVarChar, responses[i] ?? null);
    }

    await request.query(`
      INSERT INTO SatisfactionSurveys (
        Clientele, College, Course, Message,
        Question1, Question2, Question3, Question4, Question5,
        Question6, Question7, Question8, Question9, Question10,
        SentimentResult, Category, SentimentScore
      )
      VALUES (
        @clientele, @college, @course, @message,
        @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,
        @sentimentResult, @category, @sentimentScore
      )
    `);

    res.json({ message: 'Survey submitted', sentimentResult, emojiSentiment, textSentiment, category, sentimentScore });
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

const COLLEGE_MAP = {
  CARES: ['CARES', 'Agriculture', 'Environmental', 'BSA', 'BSABE', 'BSEM'],
  CAS: ['CAS', 'Arts', 'Sciences', 'BAComm', 'BAELS', 'BAPolSci', 'BSBio', 'BSChem', 'BSPsyc', 'BSSW', 'ABPSPA'],
  CBA: ['CBA', 'Business', 'Accountancy', 'BSActy', 'BSAd', 'BSBABM', 'BSBAFM', 'BSBAMM', 'BSEnt', 'BSBAMA'],
  CCS: ['CCS', 'Computer Studies', 'Computer', 'BSCS', 'BSDMIA', 'BSIT', 'BLIS'],
  COED: ['COED', 'Education', 'BECEd', 'BEEd', 'BPEd', 'BSBMic', 'BSEd', 'BSMath'],
  COE: ['COE', 'Engineering', 'BSCE', 'BSChE', 'BSEE', 'BSECE', 'BSME', 'BSPkgE', 'BSSE'],
  CHM: ['CHM', 'Hospitality', 'BSHM', 'BSTM', 'BSHRM'],
  CMLS: ['CMLS', 'Medical Laboratory', 'BSMLS'],
  CON: ['CON', 'Nursing', 'BSN'],
  COP: ['COP', 'Pharmacy', 'BSPhar'],
  COL: ['COL', 'Law', 'Juris Doctor', 'J.D.', 'LL.B', 'EdD'],
  COM: ['COM', 'Medicine', 'Respiratory', 'MD', 'BSRT'],
  COT: ['COT', 'Theology', 'BTh', 'DipT-S'],
  SGS: ['SGS', 'Graduate Studies', 'DM', 'DMin', 'DM-THM', 'MAEd', 'MAELL', 'MAEng', 'MAN', 'MBA', 'MBATHM', 'MDiv', 'MEngr', 'MLIS', 'MPA', 'MSAgri', 'MSCS', 'MSGC', 'MSSW'],
  KINDER: ['KINDER', 'Kindergarten', 'Kinder'],
  ELEM: ['ELEM', 'Elementary', 'Elem'],
  JHS: ['JHS', 'Junior High School'],
  SHS: ['SHS', 'Senior High School', 'SHSTEM', 'SHGAS', 'SHHUMSS', 'SHABM']
};

app.get('/api/logins', async (req, res) => {
  const { startDate, endDate, section, college, logType } = req.query;

  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    const conditions = [];

    // Filter by logType or default to entry logins (excluding Time Out records)
    if (logType === 'All') {
      // include all
    } else if (logType) {
      conditions.push(`studLogType = @logType`);
      request.input('logType', sql.VarChar, logType);
    } else {
      conditions.push(`(studLogType LIKE '%In%' OR studLogType LIKE '%IN%' OR studLogType IS NULL OR studLogType = '')`);
    }

    if (startDate && endDate) {
      conditions.push(`CAST(TimeLogged AS DATE) BETWEEN @startDate AND @endDate`);
      request.input('startDate', sql.Date, new Date(startDate));
      request.input('endDate', sql.Date, new Date(endDate));
    }

    if (section && section !== 'All') {
      conditions.push(`Section = @section`);
      request.input('section', sql.VarChar, section);
    }

    if (college && college !== 'All') {
      const terms = COLLEGE_MAP[college.toUpperCase()] || [college];
      const colOrs = terms.map((_, idx) => `(studCollege LIKE @colTerm${idx} OR studCourse LIKE @colTerm${idx})`);
      conditions.push(`(${colOrs.join(' OR ')})`);
      terms.forEach((term, idx) => {
        request.input(`colTerm${idx}`, sql.VarChar, `%${term}%`);
      });
    }

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

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error fetching logins:', err);
    res.status(500).json({ message: 'Failed to fetch logins' });
  }
});

app.delete('/api/logins/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('id', sql.Int, id);
    await request.query(`DELETE FROM LibLogins WHERE LogID = @id`);
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting login record:', err);
    res.status(500).json({ message: 'Failed to delete record' });
  }
});

app.post('/api/logins/delete-batch', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'No record IDs provided' });
  }
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    const idList = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (idList.length === 0) {
      return res.status(400).json({ message: 'Invalid record IDs' });
    }
    await request.query(`DELETE FROM LibLogins WHERE LogID IN (${idList.join(',')})`);
    res.json({ message: `${idList.length} records deleted successfully` });
  } catch (err) {
    console.error('Error batch deleting login records:', err);
    res.status(500).json({ message: 'Failed to delete records' });
  }
});

app.get('/api/surveys', async (req, res) => {
  const { startDate, endDate, clientele, college, course } = req.query;

  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    let query = `
      SELECT Id, Clientele, College, Course, Message,
             Question1, Question2, Question3, Question4, Question5,
             Question6, Question7, Question8, Question9, Question10,
             SentimentResult, Category, SentimentScore,
             FORMAT(DateSubmitted AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time', 'yyyy-MM-dd HH:mm:ss') AS DateSubmitted
      FROM SatisfactionSurveys
    `;

    const conditions = [];

    if (startDate && endDate) {
      conditions.push(`(DateSubmitted AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time') BETWEEN @startDate AND @endDate`);
      request.input('startDate', sql.DateTime, new Date(startDate));
      request.input('endDate', sql.DateTime, new Date(endDate));
    }
    if (clientele && clientele.trim() !== '') {
      conditions.push(`Clientele = @clientele`);
      request.input('clientele', sql.NVarChar, clientele.trim());
    }
    if (college && college.trim() !== '') {
      conditions.push(`College = @college`);
      request.input('college', sql.NVarChar, college.trim());
    }
    if (course && course.trim() !== '') {
      conditions.push(`Course = @course`);
      request.input('course', sql.NVarChar, course.trim());
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY DateSubmitted DESC`;

    const result = await request.query(query);
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
          authorName${n} = '', publisherAuthor${n} = '',
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
    authorName1, authorLastName1, publisherAuthor1,
    authorName2, authorLastName2, publisherAuthor2,
    authorName3, authorLastName3, publisherAuthor3,
    authorName4, authorLastName4, publisherAuthor4,
    bookTitle1, bookTitle2, bookTitle3, bookTitle4,
    accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
    callNumber1, callNumber2, callNumber3, callNumber4,
    copyNumber1, copyNumber2, copyNumber3, copyNumber4,
    barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
    isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4,
  } = req.body;

  const acc1 = (accessionNumber1 || '').trim();
  const acc2 = (accessionNumber2 || '').trim();
  const acc3 = (accessionNumber3 || '').trim();
  const acc4 = (accessionNumber4 || '').trim();

  try {
    const pool = await sql.connect(config);

    if (acc1) {
      const checkDuplicate = await pool.request()
        .input('acc1', sql.NVarChar, acc1)
        .query(`
          SELECT COUNT(*) AS count FROM CardAndPacket 
          WHERE LTRIM(RTRIM(accessionNumber1)) = @acc1
             OR LTRIM(RTRIM(accessionNumber2)) = @acc1
             OR LTRIM(RTRIM(accessionNumber3)) = @acc1
             OR LTRIM(RTRIM(accessionNumber4)) = @acc1
        `);

      if (checkDuplicate.recordset[0].count > 0) {
        return res.status(400).json({ message: `Accession number "${acc1}" already exists!` });
      }
    }

    await pool.request()
      .input('selectedLibrary1', sql.NVarChar, (selectedLibrary1 || '').trim())
      .input('section1', sql.NVarChar, (section1 || '').trim())
      .input('selectedLibrary2', sql.NVarChar, (selectedLibrary2 || '').trim())
      .input('section2', sql.NVarChar, (section2 || '').trim())
      .input('selectedLibrary3', sql.NVarChar, (selectedLibrary3 || '').trim())
      .input('section3', sql.NVarChar, (section3 || '').trim())
      .input('selectedLibrary4', sql.NVarChar, (selectedLibrary4 || '').trim())
      .input('section4', sql.NVarChar, (section4 || '').trim())
      .input('authorName1', sql.NVarChar, (authorName1 || authorLastName1 || '').trim())
      .input('publisherAuthor1', sql.NVarChar, (publisherAuthor1 || '').trim())
      .input('authorName2', sql.NVarChar, (authorName2 || authorLastName2 || '').trim())
      .input('publisherAuthor2', sql.NVarChar, (publisherAuthor2 || '').trim())
      .input('authorName3', sql.NVarChar, (authorName3 || authorLastName3 || '').trim())
      .input('publisherAuthor3', sql.NVarChar, (publisherAuthor3 || '').trim())
      .input('authorName4', sql.NVarChar, (authorName4 || authorLastName4 || '').trim())
      .input('publisherAuthor4', sql.NVarChar, (publisherAuthor4 || '').trim())
      .input('bookTitle1', sql.NVarChar, (bookTitle1 || '').trim())
      .input('bookTitle2', sql.NVarChar, (bookTitle2 || '').trim())
      .input('bookTitle3', sql.NVarChar, (bookTitle3 || '').trim())
      .input('bookTitle4', sql.NVarChar, (bookTitle4 || '').trim())
      .input('accessionNumber1', sql.NVarChar, acc1)
      .input('accessionNumber2', sql.NVarChar, acc2)
      .input('accessionNumber3', sql.NVarChar, acc3)
      .input('accessionNumber4', sql.NVarChar, acc4)
      .input('callNumber1', sql.NVarChar, (callNumber1 || '').trim())
      .input('callNumber2', sql.NVarChar, (callNumber2 || '').trim())
      .input('callNumber3', sql.NVarChar, (callNumber3 || '').trim())
      .input('callNumber4', sql.NVarChar, (callNumber4 || '').trim())
      .input('copyNumber1', sql.NVarChar, (copyNumber1 || '').trim())
      .input('copyNumber2', sql.NVarChar, (copyNumber2 || '').trim())
      .input('copyNumber3', sql.NVarChar, (copyNumber3 || '').trim())
      .input('copyNumber4', sql.NVarChar, (copyNumber4 || '').trim())
      .input('barcodeValue1', sql.NVarChar, (barcodeValue1 || '').trim())
      .input('barcodeValue2', sql.NVarChar, (barcodeValue2 || '').trim())
      .input('barcodeValue3', sql.NVarChar, (barcodeValue3 || '').trim())
      .input('barcodeValue4', sql.NVarChar, (barcodeValue4 || '').trim())
      .input('isoCodeValue1', sql.NVarChar, (isoCodeValue1 || '').trim())
      .input('isoCodeValue2', sql.NVarChar, (isoCodeValue2 || '').trim())
      .input('isoCodeValue3', sql.NVarChar, (isoCodeValue3 || '').trim())
      .input('isoCodeValue4', sql.NVarChar, (isoCodeValue4 || '').trim())
      .query(`
        INSERT INTO CardAndPacket (
          selectedLibrary1, section1, selectedLibrary2, section2, selectedLibrary3, section3, selectedLibrary4, section4,
          authorName1, publisherAuthor1,
          authorName2, publisherAuthor2,
          authorName3, publisherAuthor3,
          authorName4, publisherAuthor4,
          bookTitle1, bookTitle2, bookTitle3, bookTitle4,
          accessionNumber1, accessionNumber2, accessionNumber3, accessionNumber4,
          callNumber1, callNumber2, callNumber3, callNumber4,
          copyNumber1, copyNumber2, copyNumber3, copyNumber4,
          barcodeValue1, barcodeValue2, barcodeValue3, barcodeValue4,
          isoCodeValue1, isoCodeValue2, isoCodeValue3, isoCodeValue4
        ) VALUES (
          @selectedLibrary1, @section1, @selectedLibrary2, @section2, @selectedLibrary3, @section3, @selectedLibrary4, @section4,
          @authorName1, @publisherAuthor1,
          @authorName2, @publisherAuthor2,
          @authorName3, @publisherAuthor3,
          @authorName4, @publisherAuthor4,
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
    const searchVal = (accessionNumber || '').trim();
    const result = await pool.request()
      .input('accessionNumber', sql.NVarChar, searchVal)
      .query(`
        SELECT * FROM CardAndPacket
        WHERE LTRIM(RTRIM(accessionNumber1)) = @accessionNumber
           OR LTRIM(RTRIM(accessionNumber2)) = @accessionNumber
           OR LTRIM(RTRIM(accessionNumber3)) = @accessionNumber
           OR LTRIM(RTRIM(accessionNumber4)) = @accessionNumber
           OR LTRIM(RTRIM(barcodeValue1)) = @accessionNumber
           OR LTRIM(RTRIM(barcodeValue2)) = @accessionNumber
           OR LTRIM(RTRIM(barcodeValue3)) = @accessionNumber
           OR LTRIM(RTRIM(barcodeValue4)) = @accessionNumber
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
    authorName1, authorLastName1, publisherAuthor1,
    authorName2, authorLastName2, publisherAuthor2,
    authorName3, authorLastName3, publisherAuthor3,
    authorName4, authorLastName4, publisherAuthor4,
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
      .input('authorName1', sql.NVarChar, authorName1 || authorLastName1 || '')
      .input('publisherAuthor1', sql.NVarChar, publisherAuthor1 || '')
      .input('authorName2', sql.NVarChar, authorName2 || authorLastName2 || '')
      .input('publisherAuthor2', sql.NVarChar, publisherAuthor2 || '')
      .input('authorName3', sql.NVarChar, authorName3 || authorLastName3 || '')
      .input('publisherAuthor3', sql.NVarChar, publisherAuthor3 || '')
      .input('authorName4', sql.NVarChar, authorName4 || authorLastName4 || '')
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
          authorName1=@authorName1, publisherAuthor1=@publisherAuthor1,
          authorName2=@authorName2, publisherAuthor2=@publisherAuthor2,
          authorName3=@authorName3, publisherAuthor3=@publisherAuthor3,
          authorName4=@authorName4, publisherAuthor4=@publisherAuthor4,
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
      .query('SELECT * FROM OfficeSupplies ORDER BY ItemName, Brand');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplies' });
  }
});

app.get('/api/supplies/grouped', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT * FROM OfficeSupplies ORDER BY ItemName, Brand');

    const grouped = {};
    for (const row of result.recordset) {
      const itemName = cleanTitleCase(row.ItemName);
      const brand = cleanTitleCase(row.Brand || '');
      const specs = cleanTitleCase(row.Specifications) || 'N/A';
      const unit = (row.Unit || 'Pieces').trim();
      const key = `${itemName.toLowerCase()}||${brand.toLowerCase()}||${specs.toLowerCase()}||${unit.toLowerCase()}`;
      if (!grouped[key]) {
        grouped[key] = {
          ProfileKey: key,
          ItemName: itemName,
          Brand: brand || 'N/A',
          Unit: unit || 'Pieces',
          TotalQuantity: 0,
          location_balances: [],
          Locations: []
        };
      }
      grouped[key].TotalQuantity += row.Quantity;

      const locData = {
        Id: row.Id,
        LocationName: row.Location || 'N/A',
        Quantity: row.Quantity,
        Status: deriveStatus(row.Quantity),
        Specifications: specs,
        Unit: row.Unit || 'Pieces'
      };
      grouped[key].location_balances.push(locData);
      grouped[key].Locations.push(locData);
    }
    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch grouped supplies' });
  }
});

app.post('/api/supplies', async (req, res) => {
  const { itemName, brand, quantity, location, specifications, user, unit } = req.body;

  const qty = parseInt(quantity);
  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ message: 'Item name is required.' });
  }
  if (!specifications || !specifications.trim() || specifications.trim().toUpperCase() === 'N/A') {
    return res.status(400).json({ message: 'Specifications are required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  try {
    const pool = await sql.connect(config);
    const normItemName = cleanTitleCase(itemName);
    const normBrand = cleanTitleCase(brand);
    const normSpecs = cleanTitleCase(specifications) || 'N/A';
    const normUnit = (unit || 'Pieces').trim();
    const status = deriveStatus(qty);

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const existing = await pool.request()
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, (location || '').trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .input('Unit', sql.NVarChar, normUnit)
      .query(`SELECT * FROM OfficeSupplies
              WHERE ItemName = @ItemName
                AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location
                AND ISNULL(Specifications,'') = @Specifications
                AND ISNULL(Unit,'') = @Unit`);

    if (existing.recordset.length > 0) {
      const match = existing.recordset[0];
      const newQty = match.Quantity + qty;
      const newStatus = deriveStatus(newQty);

      await pool.request()
        .input('Id', sql.Int, match.Id)
        .input('Quantity', sql.Int, newQty)
        .input('Status', sql.NVarChar, newStatus)
        .input('Specifications', sql.NVarChar, normSpecs || match.Specifications || 'N/A')
        .input('Unit', sql.NVarChar, unit || match.Unit || 'Pieces')
        .input('UpdatedAt', sql.DateTime, new Date())
        .query(`UPDATE OfficeSupplies SET
          Quantity=@Quantity, Status=@Status,
          Specifications=@Specifications, Unit=@Unit, UpdatedAt=@UpdatedAt
          WHERE Id=@Id`);

      await logSupplyTransaction(pool.request(), {
        supplyId: match.Id,
        actionType: 'Added Stock',
        quantityChanged: qty,
        previousQuantity: match.Quantity,
        newQuantity: newQty,
        createdBy: user,
      });

      return res.json({ message: 'Stock updated on existing supply record.', id: match.Id });
    }

    const insertResult = await pool.request()
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, normSpecs || 'N/A')
      .input('Unit', sql.NVarChar, unit || 'Pieces')
      .query(`INSERT INTO OfficeSupplies
        (ItemName, Brand, Quantity, Status, Location, Specifications, Unit)
        OUTPUT INSERTED.Id
        VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, @Unit)`);

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
    const { itemName, brand, quantity, location, specifications, user, unit } = req.body;

    const qty = parseInt(quantity);
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required.' });
    }
    if (!specifications || !specifications.trim() || specifications.trim().toUpperCase() === 'N/A') {
      return res.status(400).json({ message: 'Specifications are required.' });
    }
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative.' });
    }

    const pool = await sql.connect(config);
    const normItemName = cleanTitleCase(itemName);
    const normBrand = cleanTitleCase(brand);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }
    const previousQuantity = existing.recordset[0].Quantity;

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const status = deriveStatus(qty);
    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .input('Unit', sql.NVarChar, unit || 'Pieces')
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`UPDATE OfficeSupplies SET
        ItemName=@ItemName, Brand=@Brand,
        Quantity=@Quantity, Status=@Status,
        Location=@Location, Specifications=@Specifications,
        Unit=@Unit, UpdatedAt=@UpdatedAt WHERE Id=@Id`);

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

// ---- Add Stock: safely append stock levels directly at a location ----
app.post('/api/supplies/add-stock', async (req, res) => {
  const { supplyId, itemName, brand, location, quantity, user } = req.body;
  const qty = parseInt(quantity);

  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }
  if (!location?.trim()) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    let targetItemName = itemName;
    let targetBrand = brand;
    let targetSpecifications = req.body.specifications || '';
    let targetUnit = req.body.unit || 'Pieces';

    if (supplyId) {
      const supplyResult = await new sql.Request(transaction)
        .input('SupplyId', sql.Int, parseInt(supplyId))
        .query('SELECT * FROM OfficeSupplies WHERE Id = @SupplyId');
      const supply = supplyResult.recordset[0];
      if (!supply) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Supply item not found.' });
      }
      targetItemName = supply.ItemName;
      targetBrand = supply.Brand;
      targetSpecifications = supply.Specifications || '';
      targetUnit = supply.Unit || 'Pieces';
    }

    if (!targetItemName?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Item name is required.' });
    }

    const normItemName = cleanTitleCase(targetItemName);
    const normBrand = cleanTitleCase(targetBrand);

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const normSpecs = cleanTitleCase(targetSpecifications) || 'N/A';
    const normUnit = (targetUnit || 'Pieces').trim();
    const existing = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, location.trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .input('Unit', sql.NVarChar, normUnit)
      .query(`SELECT * FROM OfficeSupplies
              WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location 
                AND ISNULL(Specifications,'') = @Specifications
                AND ISNULL(Unit,'') = @Unit`);

    let rowId, previousQuantity, newQuantity;

    if (existing.recordset.length > 0) {
      const existingRow = existing.recordset[0];
      rowId = existingRow.Id;
      previousQuantity = existingRow.Quantity;
      newQuantity = previousQuantity + qty;

      await new sql.Request(transaction)
        .input('Id', sql.Int, rowId)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      previousQuantity = 0;
      newQuantity = qty;

      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('Location', sql.NVarChar, location.trim())
        .input('Specifications', sql.NVarChar, targetSpecifications)
        .input('Unit', sql.NVarChar, targetUnit)
        .query(`INSERT INTO OfficeSupplies
                (ItemName, Brand, Quantity, Status, Location, Specifications, Unit)
                OUTPUT INSERTED.Id
                VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, @Unit)`);
      rowId = insertResult.recordset[0].Id;
    }

    await logSupplyTransaction(new sql.Request(transaction), {
      supplyId: rowId,
      actionType: 'Added Stock',
      quantityChanged: qty,
      previousQuantity,
      newQuantity,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ success: true, id: rowId, previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

// Backward compatibility helper
app.post('/api/supplies/:id/add-stock', async (req, res) => {
  const { id } = req.params;
  const { additionalQuantity, location, user } = req.body;
  const qty = parseInt(additionalQuantity);

  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Additional quantity must be at least 1.' });
  }

  let resolvedLocation = location;
  if (!resolvedLocation) {
    try {
      const pool = await sql.connect(config);
      const row = await pool.request().input('Id', sql.Int, parseInt(id)).query('SELECT Location FROM OfficeSupplies WHERE Id = @Id');
      if (row.recordset.length > 0) {
        resolvedLocation = row.recordset[0].Location;
      }
    } catch (e) { }
  }

  req.body.supplyId = id;
  req.body.location = resolvedLocation;
  req.body.quantity = qty;

  // Forward to our unified add-stock handler
  const tempRes = {
    status: (code) => ({ json: (data) => res.status(code).json(data), send: (data) => res.status(code).send(data) }),
    json: (data) => res.json(data)
  };

  try {
    const pool = await sql.connect(config);
    const existing = await pool.request().input('Id', sql.Int, parseInt(id)).query('SELECT ItemName FROM OfficeSupplies WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Supply item not found.' });
    }
    // Perform standard add-stock
    req.body.itemName = existing.recordset[0].ItemName;

    // We can call add-stock logic directly or mock a request. Since we want it to be direct:
    const mockReq = { body: req.body };
    // Let's call the logic
    const mockRes = {
      status: (code) => ({ json: (data) => res.status(code).json(data) }),
      json: (data) => res.json(data)
    };
    // Direct code execution is cleaner. Let's just execute the same code:
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const supplyResult = await new sql.Request(transaction)
      .input('SupplyId', sql.Int, parseInt(id))
      .query('SELECT * FROM OfficeSupplies WHERE Id = @SupplyId');
    const supply = supplyResult.recordset[0];
    const normItemName = cleanTitleCase(supply.ItemName);
    const normBrand = cleanTitleCase(supply.Brand);
    if (normBrand) await upsertBrand(pool, normBrand);

    const normSpecs = cleanTitleCase(supply.Specifications) || 'N/A';
    const normUnit = (supply.Unit || 'Pieces').trim();
    const existTarget = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, resolvedLocation.trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .input('Unit', sql.NVarChar, normUnit)
      .query(`SELECT * FROM OfficeSupplies WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand AND ISNULL(Location,'') = @Location AND ISNULL(Specifications,'') = @Specifications AND ISNULL(Unit,'') = @Unit`);

    let rowId, previousQuantity, newQuantity;
    if (existTarget.recordset.length > 0) {
      const r = existTarget.recordset[0];
      rowId = r.Id;
      previousQuantity = r.Quantity;
      newQuantity = previousQuantity + qty;
      await new sql.Request(transaction)
        .input('Id', sql.Int, rowId)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      previousQuantity = 0;
      newQuantity = qty;
      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('Location', sql.NVarChar, resolvedLocation.trim())
        .input('Specifications', sql.NVarChar, supply.Specifications)
        .input('Unit', sql.NVarChar, supply.Unit || 'Pieces')
        .query(`INSERT INTO OfficeSupplies (ItemName, Brand, Quantity, Status, Location, Specifications, Unit)
                OUTPUT INSERTED.Id VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, @Unit)`);
      rowId = insertResult.recordset[0].Id;
    }

    await logSupplyTransaction(new sql.Request(transaction), {
      supplyId: rowId,
      actionType: 'Added Stock',
      quantityChanged: qty,
      previousQuantity,
      newQuantity,
      createdBy: user,
    });
    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

// ---- Transfer Supply Location: manages cross-location stock movements ----
app.post('/api/supplies/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { destinationLocation, quantity, user } = req.body;
  const qty = parseInt(quantity);

  if (!destinationLocation?.trim()) {
    return res.status(400).json({ message: 'Destination location is required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const sourceResult = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT * FROM OfficeSupplies WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id');

    const source = sourceResult.recordset[0];
    if (!source) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Source supply item not found.' });
    }
    if (source.Location?.trim().toLowerCase() === destinationLocation.trim().toLowerCase()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Source and destination locations must differ.' });
    }
    if (qty > source.Quantity) {
      await transaction.rollback();
      return res.status(400).json({ message: `Insufficient stock at ${source.Location}. Available: ${source.Quantity}.` });
    }

    // Deduct from source
    const newSourceQty = source.Quantity - qty;
    await new sql.Request(transaction)
      .input('Id', sql.Int, source.Id)
      .input('Quantity', sql.Int, newSourceQty)
      .input('Status', sql.NVarChar, deriveStatus(newSourceQty))
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    // Find or create destination row
    const normItemName = cleanTitleCase(source.ItemName);
    const normBrand = cleanTitleCase(source.Brand);

    const normSpecs = cleanTitleCase(source.Specifications) || 'N/A';
    const normUnit = (source.Unit || 'Pieces').trim();
    const destResult = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, destinationLocation.trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .input('Unit', sql.NVarChar, normUnit)
      .query(`SELECT * FROM OfficeSupplies
              WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location 
                AND ISNULL(Specifications,'') = @Specifications
                AND ISNULL(Unit,'') = @Unit`);

    let destId, destPrev, destNew;
    const destExisting = destResult.recordset[0];
    if (destExisting) {
      destId = destExisting.Id;
      destPrev = destExisting.Quantity;
      destNew = destPrev + qty;
      await new sql.Request(transaction)
        .input('Id', sql.Int, destId)
        .input('Quantity', sql.Int, destNew)
        .input('Status', sql.NVarChar, deriveStatus(destNew))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE OfficeSupplies SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      destPrev = 0;
      destNew = qty;
      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, destNew)
        .input('Status', sql.NVarChar, deriveStatus(destNew))
        .input('Location', sql.NVarChar, destinationLocation.trim())
        .input('Specifications', sql.NVarChar, source.Specifications || '')
        .input('Unit', sql.NVarChar, source.Unit || 'Pieces')
        .query(`INSERT INTO OfficeSupplies
                (ItemName, Brand, Quantity, Status, Location, Specifications, Unit)
                OUTPUT INSERTED.Id
                VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, @Unit)`);
      destId = insertResult.recordset[0].Id;
    }

    // Log transaction with LOCATION_TRANSFER ActionType
    await logSupplyTransaction(new sql.Request(transaction), {
      supplyId: source.Id,
      actionType: 'LOCATION_TRANSFER',
      quantityChanged: -qty,
      previousQuantity: source.Quantity,
      newQuantity: newSourceQty,
      destinationSection: destinationLocation,
      remarks: `Transferred to ${destinationLocation} (row #${destId})`,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ sourceId: source.Id, newSourceQty, destinationId: destId, newDestinationQty: destNew });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to transfer supply.' });
  }
});

// Make /api/supplies/:id/send route backward compatible with location transfer logic
app.post('/api/supplies/:id/send', async (req, res) => {
  req.body.destinationLocation = req.body.destination;
  return app._router.handle({ method: 'POST', url: `/api/supplies/${req.params.id}/transfer`, body: req.body }, res);
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
      .query('SELECT * FROM LibraryEquipment ORDER BY ItemName, Location');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

app.get('/api/equipment/grouped', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT * FROM LibraryEquipment ORDER BY ItemName, Location');

    const grouped = {};
    for (const row of result.recordset) {
      const itemName = cleanTitleCase(row.ItemName);
      const brand = cleanTitleCase(row.Brand || '');
      const specs = cleanTitleCase(row.Specifications) || 'N/A';
      const key = `${itemName.toLowerCase()}||${brand.toLowerCase()}||${specs.toLowerCase()}`;
      if (!grouped[key]) {
        grouped[key] = {
          ProfileKey: key,
          ItemName: itemName,
          Brand: brand || 'N/A',
          TotalQuantity: 0,
          location_balances: [],
          Locations: []
        };
      }
      grouped[key].TotalQuantity += row.Quantity;

      const locData = {
        Id: row.Id,
        LocationName: row.Location || 'N/A',
        Quantity: row.Quantity,
        Status: deriveStatus(row.Quantity),
        Specifications: specs
      };
      grouped[key].location_balances.push(locData);
      grouped[key].Locations.push(locData);
    }
    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch grouped equipment' });
  }
});

// ---- Add Stock: safely append stock levels directly at a location ----
app.post('/api/equipment/add-stock', async (req, res) => {
  const { assetId, itemName, brand, location, quantity, user } = req.body;
  const qty = parseInt(quantity);

  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }
  if (!location?.trim()) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    let targetItemName = itemName;
    let targetBrand = brand;
    let targetSpecifications = req.body.specifications || '';

    if (assetId) {
      const assetResult = await new sql.Request(transaction)
        .input('AssetId', sql.Int, parseInt(assetId))
        .query('SELECT * FROM LibraryEquipment WHERE Id = @AssetId');
      const asset = assetResult.recordset[0];
      if (!asset) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Asset not found.' });
      }
      targetItemName = asset.ItemName;
      targetBrand = asset.Brand;
      targetSpecifications = asset.Specifications || '';
    }

    if (!targetItemName?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Item name is required.' });
    }

    const normItemName = cleanTitleCase(targetItemName);
    const normBrand = cleanTitleCase(targetBrand);

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const normSpecs = cleanTitleCase(targetSpecifications) || 'N/A';
    const existing = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, location.trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .query(`SELECT * FROM LibraryEquipment
              WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location AND ISNULL(Specifications,'') = @Specifications`);

    let rowId, previousQuantity, newQuantity;

    if (existing.recordset.length > 0) {
      const existingRow = existing.recordset[0];
      rowId = existingRow.Id;
      previousQuantity = existingRow.Quantity;
      newQuantity = previousQuantity + qty;

      await new sql.Request(transaction)
        .input('Id', sql.Int, rowId)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      previousQuantity = 0;
      newQuantity = qty;

      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('Location', sql.NVarChar, location.trim())
        .input('Specifications', sql.NVarChar, normSpecs)
        .query(`INSERT INTO LibraryEquipment
                (ItemName, Brand, Quantity, Status, Location, Specifications, Condition)
                OUTPUT INSERTED.Id
                VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, '')`);
      rowId = insertResult.recordset[0].Id;
    }

    await logAssetTransaction(new sql.Request(transaction), {
      assetId: rowId,
      actionType: 'Added Stock',
      quantityChanged: qty,
      previousQuantity,
      newQuantity,
      destinationSection: location,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ success: true, id: rowId, previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

// Replaces the old stock-to-location endpoint
app.post('/api/equipment/stock-to-location', async (req, res) => {
  return app._router.handle({ method: 'POST', url: '/api/equipment/add-stock', body: req.body }, res);
});

// ---- Transfer Equipment Location: manages cross-location stock movements ----
app.post('/api/equipment/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { destinationLocation, quantity, user } = req.body;
  const qty = parseInt(quantity);

  if (!destinationLocation?.trim()) {
    return res.status(400).json({ message: 'Destination location is required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  let transaction;
  try {
    const pool = await sql.connect(config);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const sourceResult = await new sql.Request(transaction)
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT * FROM LibraryEquipment WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id');

    const source = sourceResult.recordset[0];
    if (!source) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Source equipment row not found.' });
    }
    if (source.Location?.trim().toLowerCase() === destinationLocation.trim().toLowerCase()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Source and destination locations must differ.' });
    }
    if (qty > source.Quantity) {
      await transaction.rollback();
      return res.status(400).json({ message: `Insufficient stock at ${source.Location}. Available: ${source.Quantity}.` });
    }

    // Deduct from source
    const newSourceQty = source.Quantity - qty;
    await new sql.Request(transaction)
      .input('Id', sql.Int, source.Id)
      .input('Quantity', sql.Int, newSourceQty)
      .input('Status', sql.NVarChar, deriveStatus(newSourceQty))
      .input('UpdatedAt', sql.DateTime, new Date())
      .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');

    // Find or create destination row
    const normItemName = cleanTitleCase(source.ItemName);
    const normBrand = cleanTitleCase(source.Brand);
    const normSpecs = cleanTitleCase(source.Specifications) || 'N/A';

    const destResult = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, destinationLocation.trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .query(`SELECT * FROM LibraryEquipment
              WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location AND ISNULL(Specifications,'') = @Specifications`);

    let destId, destPrev, destNew;
    const destExisting = destResult.recordset[0];
    if (destExisting) {
      destId = destExisting.Id;
      destPrev = destExisting.Quantity;
      destNew = destPrev + qty;
      await new sql.Request(transaction)
        .input('Id', sql.Int, destId)
        .input('Quantity', sql.Int, destNew)
        .input('Status', sql.NVarChar, deriveStatus(destNew))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      destPrev = 0;
      destNew = qty;
      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, destNew)
        .input('Status', sql.NVarChar, deriveStatus(destNew))
        .input('Location', sql.NVarChar, destinationLocation.trim())
        .input('Specifications', sql.NVarChar, normSpecs)
        .query(`INSERT INTO LibraryEquipment
                (ItemName, Brand, Quantity, Status, Location, Specifications, Condition)
                OUTPUT INSERTED.Id
                VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, '')`);
      destId = insertResult.recordset[0].Id;
    }

    // Log transaction with LOCATION_TRANSFER ActionType
    await logAssetTransaction(new sql.Request(transaction), {
      assetId: source.Id,
      actionType: 'LOCATION_TRANSFER',
      quantityChanged: -qty,
      previousQuantity: source.Quantity,
      newQuantity: newSourceQty,
      destinationSection: destinationLocation,
      remarks: `Transferred to ${destinationLocation} (row #${destId})`,
      createdBy: user,
    });

    await transaction.commit();
    res.json({ sourceId: source.Id, newSourceQty, destinationId: destId, newDestinationQty: destNew });
  } catch (err) {
    console.error(err);
    if (transaction) await transaction.rollback().catch(() => { });
    res.status(500).json({ message: 'Failed to transfer asset.' });
  }
});

app.post('/api/equipment', async (req, res) => {
  const { itemName, brand, quantity, location, specifications, user } = req.body;

  const qty = parseInt(quantity);
  if (!itemName || !itemName.trim()) {
    return res.status(400).json({ message: 'Item name is required.' });
  }
  if (!specifications || !specifications.trim() || specifications.trim().toUpperCase() === 'N/A') {
    return res.status(400).json({ message: 'Specifications are required.' });
  }
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  try {
    const pool = await sql.connect(config);
    const normItemName = cleanTitleCase(itemName);
    const normBrand = cleanTitleCase(brand);
    const normSpecs = cleanTitleCase(specifications) || 'N/A';
    const status = deriveStatus(qty);

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const existing = await pool.request()
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, (location || '').trim())
      .input('Specifications', sql.NVarChar, normSpecs)
      .query(`SELECT * FROM LibraryEquipment
              WHERE ItemName = @ItemName
                AND ISNULL(Brand,'') = @Brand
                AND ISNULL(Location,'') = @Location
                AND ISNULL(Specifications,'') = @Specifications`);

    if (existing.recordset.length > 0) {
      const match = existing.recordset[0];
      const newQty = match.Quantity + qty;
      const newStatus = deriveStatus(newQty);

      await pool.request()
        .input('Id', sql.Int, match.Id)
        .input('Quantity', sql.Int, newQty)
        .input('Status', sql.NVarChar, newStatus)
        .input('Specifications', sql.NVarChar, normSpecs)
        .input('UpdatedAt', sql.DateTime, new Date())
        .query(`UPDATE LibraryEquipment SET
          Quantity=@Quantity, Status=@Status,
          Specifications=@Specifications, UpdatedAt=@UpdatedAt
          WHERE Id=@Id`);

      await logAssetTransaction(pool.request(), {
        assetId: match.Id,
        actionType: 'Added Stock',
        quantityChanged: qty,
        previousQuantity: match.Quantity,
        newQuantity: newQty,
        createdBy: user,
      });

      return res.json({ success: true, id: match.Id, message: 'Stock updated on existing asset.' });
    }

    const insertResult = await pool.request()
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, normSpecs)
      .query(`INSERT INTO LibraryEquipment 
        (ItemName, Brand, Quantity, Status, Condition, Location, Specifications)
        OUTPUT INSERTED.Id
        VALUES 
        (@ItemName, @Brand, @Quantity, @Status, @Condition, @Location, @Specifications)`);

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
    const { itemName, brand, quantity, location, specifications, user } = req.body;

    const qty = parseInt(quantity);
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required.' });
    }
    if (!specifications || !specifications.trim() || specifications.trim().toUpperCase() === 'N/A') {
      return res.status(400).json({ message: 'Specifications are required.' });
    }
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative.' });
    }

    const pool = await sql.connect(config);
    const normItemName = cleanTitleCase(itemName);
    const normBrand = cleanTitleCase(brand);

    const existing = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query('SELECT Quantity FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }
    const previousQuantity = existing.recordset[0].Quantity;

    if (normBrand) {
      await upsertBrand(pool, normBrand);
    }

    const status = deriveStatus(qty);
    await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Quantity', sql.Int, qty)
      .input('Status', sql.NVarChar, status)
      .input('Condition', sql.NVarChar, '')
      .input('Location', sql.NVarChar, location || '')
      .input('Specifications', sql.NVarChar, specifications || '')
      .input('UpdatedAt', sql.DateTime, new Date())
      .query(`UPDATE LibraryEquipment SET
        ItemName=@ItemName, Brand=@Brand,
        Quantity=@Quantity, Status=@Status,
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

// Backward compatible add-stock for equipment
app.post('/api/equipment/:id/add-stock', async (req, res) => {
  const { id } = req.params;
  const { additionalQuantity, location, user } = req.body;
  const qty = parseInt(additionalQuantity);

  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: 'Additional quantity must be at least 1.' });
  }

  let resolvedLocation = location;
  if (!resolvedLocation) {
    try {
      const pool = await sql.connect(config);
      const row = await pool.request().input('Id', sql.Int, parseInt(id)).query('SELECT Location FROM LibraryEquipment WHERE Id = @Id');
      if (row.recordset.length > 0) {
        resolvedLocation = row.recordset[0].Location;
      }
    } catch (e) { }
  }

  req.body.assetId = id;
  req.body.location = resolvedLocation;
  req.body.quantity = qty;

  try {
    const pool = await sql.connect(config);
    const existing = await pool.request().input('Id', sql.Int, parseInt(id)).query('SELECT ItemName FROM LibraryEquipment WHERE Id = @Id');
    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const assetResult = await new sql.Request(transaction)
      .input('AssetId', sql.Int, parseInt(id))
      .query('SELECT * FROM LibraryEquipment WHERE Id = @AssetId');
    const asset = assetResult.recordset[0];
    const normItemName = cleanTitleCase(asset.ItemName);
    const normBrand = cleanTitleCase(asset.Brand);
    if (normBrand) await upsertBrand(pool, normBrand);

    const existTarget = await new sql.Request(transaction)
      .input('ItemName', sql.NVarChar, normItemName)
      .input('Brand', sql.NVarChar, normBrand)
      .input('Location', sql.NVarChar, resolvedLocation.trim())
      .query(`SELECT * FROM LibraryEquipment WHERE ItemName = @ItemName AND ISNULL(Brand,'') = @Brand AND ISNULL(Location,'') = @Location`);

    let rowId, previousQuantity, newQuantity;
    if (existTarget.recordset.length > 0) {
      const r = existTarget.recordset[0];
      rowId = r.Id;
      previousQuantity = r.Quantity;
      newQuantity = previousQuantity + qty;
      await new sql.Request(transaction)
        .input('Id', sql.Int, rowId)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('UpdatedAt', sql.DateTime, new Date())
        .query('UPDATE LibraryEquipment SET Quantity=@Quantity, Status=@Status, UpdatedAt=@UpdatedAt WHERE Id=@Id');
    } else {
      previousQuantity = 0;
      newQuantity = qty;
      const insertResult = await new sql.Request(transaction)
        .input('ItemName', sql.NVarChar, normItemName)
        .input('Brand', sql.NVarChar, normBrand)
        .input('Quantity', sql.Int, newQuantity)
        .input('Status', sql.NVarChar, deriveStatus(newQuantity))
        .input('Location', sql.NVarChar, resolvedLocation.trim())
        .input('Specifications', sql.NVarChar, asset.Specifications)
        .input('SerialNumber', sql.NVarChar, asset.SerialNumber)
        .query(`INSERT INTO LibraryEquipment (ItemName, Brand, Quantity, Status, Location, Specifications, SerialNumber, Condition)
                OUTPUT INSERTED.Id VALUES (@ItemName, @Brand, @Quantity, @Status, @Location, @Specifications, @SerialNumber, '')`);
      rowId = insertResult.recordset[0].Id;
    }

    await logAssetTransaction(new sql.Request(transaction), {
      assetId: rowId,
      actionType: 'Added Stock',
      quantityChanged: qty,
      previousQuantity,
      newQuantity,
      destinationSection: resolvedLocation,
      createdBy: user,
    });
    await transaction.commit();
    res.json({ previousQuantity, newQuantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add stock.' });
  }
});

app.post('/api/equipment/:id/send', async (req, res) => {
  req.body.destinationLocation = req.body.destination;
  return app._router.handle({ method: 'POST', url: `/api/equipment/${req.params.id}/transfer`, body: req.body }, res);
});

// =================== DYNAMIC CATEGORY-SPECIFIC ITEMS AND BRANDS =================== //

app.get('/api/equipment/item-names', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT DISTINCT ItemName FROM LibraryEquipment WHERE ItemName IS NOT NULL AND ItemName <> '' ORDER BY ItemName");
    const list = result.recordset.map(r => cleanTitleCase(r.ItemName));
    const unique = Array.from(new Set(list)).filter(Boolean);
    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch equipment item names' });
  }
});

app.get('/api/equipment/brands', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT DISTINCT Brand FROM LibraryEquipment WHERE Brand IS NOT NULL AND Brand <> '' AND Brand <> 'N/A' ORDER BY Brand");
    const list = result.recordset.map(r => cleanTitleCase(r.Brand));
    const unique = Array.from(new Set(list)).filter(Boolean);
    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch equipment brands' });
  }
});

app.get('/api/supplies/item-names', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT DISTINCT ItemName FROM OfficeSupplies WHERE ItemName IS NOT NULL AND ItemName <> '' ORDER BY ItemName");
    const list = result.recordset.map(r => cleanTitleCase(r.ItemName));
    const unique = Array.from(new Set(list)).filter(Boolean);
    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplies item names' });
  }
});

app.get('/api/supplies/brands', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT DISTINCT Brand FROM OfficeSupplies WHERE Brand IS NOT NULL AND Brand <> '' AND Brand <> 'N/A' ORDER BY Brand");
    const list = result.recordset.map(r => cleanTitleCase(r.Brand));
    const unique = Array.from(new Set(list)).filter(Boolean);
    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch supplies brands' });
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
        SUM(CASE WHEN Quantity <= 0 THEN 1 ELSE 0 END) AS outOfStock
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
      outOfStock: assetStats.recordset[0].outOfStock,
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