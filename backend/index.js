const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');
const natural = require('natural');
const vader = require('vader-sentiment');
const afinn = require('afinn-165');
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

// =================== SENTIMENT ANALYSIS =================== //

// Map emoji ratings to numeric scores
const ratingScores = {
  very_satisfied: 1.0,
  satisfied: 0.5,
  neutral: 0.0,
  dissatisfied: -0.5,
  very_dissatisfied: -1.0,
  na: 0.0,
};

// Naïve Bayes classifier (trained with labeled examples)
const classifier = new natural.BayesClassifier();

// Positive training samples
classifier.addDocument('excellent service very helpful staff amazing experience', 'Positive');
classifier.addDocument('great resources comfortable environment wonderful visit', 'Positive');
classifier.addDocument('very satisfied with the library services highly recommend', 'Positive');
classifier.addDocument('staff are friendly and professional books are well organized', 'Positive');
classifier.addDocument('love the library always clean and quiet perfect for studying', 'Positive');
classifier.addDocument('fantastic collection helpful librarians outstanding service', 'Positive');
classifier.addDocument('very pleased with the resources available exceeded expectations', 'Positive');
classifier.addDocument('best library experience staff went above and beyond', 'Positive');

// Neutral training samples
classifier.addDocument('library is okay nothing special average experience', 'Neutral');
classifier.addDocument('services are acceptable could be better but not bad', 'Neutral');
classifier.addDocument('used the library for research it was fine', 'Neutral');
classifier.addDocument('decent collection average staff response time', 'Neutral');
classifier.addDocument('neither good nor bad just a regular visit', 'Neutral');
classifier.addDocument('some things were good some were not satisfactory', 'Neutral');
classifier.addDocument('average overall not impressed but not disappointed', 'Neutral');

// Negative training samples
classifier.addDocument('poor service staff were unhelpful very disappointing', 'Negative');
classifier.addDocument('terrible experience resources outdated disorganized', 'Negative');
classifier.addDocument('very dissatisfied long wait times rude staff', 'Negative');
classifier.addDocument('bad environment noisy dirty not comfortable at all', 'Negative');
classifier.addDocument('worst library experience hard to find books no assistance', 'Negative');
classifier.addDocument('frustrated with the service slow and unresponsive staff', 'Negative');
classifier.addDocument('highly disappointed lacks resources and poor management', 'Negative');

classifier.train();

/**
 * Converts a numeric score to a sentiment label
 */
function scoreToLabel(score) {
  if (score > 0.15) return 'Positive';
  if (score < -0.15) return 'Negative';
  return 'Neutral';
}

/**
 * Analyzes emoji ratings separately from text message.
 * Returns: { emojiSentiment, textSentiment, overallSentiment }
 */
function analyzeSentiment(responses, message) {

  // ── MEASURE 1: Emoji Ratings ──────────────────────────────────────
  const validResponses = responses.filter(r => r !== null && r !== 'na');
  const ratingAvg = validResponses.length > 0
    ? validResponses.reduce((sum, r) => sum + (ratingScores[r] ?? 0), 0) / validResponses.length
    : 0;
  const emojiSentiment = scoreToLabel(ratingAvg);

  // ── MEASURE 2: Text Analysis (VADER + Naïve Bayes + AFINN) ────────
  let textSentiment = 'Neutral';
  let textScore = 0;

  if (message && message.trim().length > 0) {

    // VADER score
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(message);
    const vaderScore = intensity.compound;

    // Naïve Bayes classification
    const nbClassification = classifier.classify(message.toLowerCase());
    const nbScore = nbClassification === 'Positive' ? 1 : nbClassification === 'Negative' ? -1 : 0;

    // AFINN word-level score
    const words = message.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const scoredWords = words.filter(w => afinn[w] !== undefined);
    const afinnScore = scoredWords.length > 0
      ? scoredWords.reduce((sum, w) => sum + afinn[w], 0) / scoredWords.length / 5
      : 0;

    // Combine text signals: VADER (40%) + Naïve Bayes (35%) + AFINN (25%)
    textScore = vaderScore * 0.40 + nbScore * 0.35 + afinnScore * 0.25;
    textSentiment = scoreToLabel(textScore);
  }

  // ── OVERALL: Equal weight between emoji and text ──────────────────
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

// =================== ROUTES =================== //

// Satisfaction Survey Submission
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

// HLL Login (toggle login/logout)
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
      .query(`
        SELECT COUNT(*) AS logCount
        FROM LibLogins
        WHERE studIDnumber = @idNumber
          AND CAST(TimeLogged AS DATE) = CAST(GETDATE() AS DATE);
      `);

    const logCount = todayLogs.recordset[0].logCount;
    const logType = logCount % 2 === 0 ? 'Time In' : 'Time Out';
    const nowPH = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

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
        OUTPUT INSERTED.LogID, INSERTED.studLogType, INSERTED.TimeLogged
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
      timeLogged: newLog.TimeLogged,
      message: `${newLog.studLogType} recorded`
    });

  } catch (err) {
    console.error('DB Error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch LibLogins with optional date range filter
app.get('/api/logins', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const pool = await sql.connect(config);

    let query = `
      SELECT LogID, studIDnumber, studLname, studFname, studCourse, studYear,
             studCollege, Section, 
             FORMAT(TimeLogged AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time', 'yyyy-MM-dd HH:mm:ss') AS TimeLogged,
             studLogType, studGender
      FROM LibLogins
    `;

    if (startDate && endDate) {
      query += `
        WHERE (TimeLogged AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time')
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
    console.error('Error fetching logins:', err);
    res.status(500).json({ message: 'Failed to fetch logins' });
  }
});

// Get all satisfaction surveys (with optional date range)
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

// Serve static React files
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// =================== START SERVER =================== //
app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Server running on http://0.0.0.0:5000');
});