const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const path = require('path');
const moment = require('moment-timezone');


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
  
//Satisfaction survey
app.post('/api/survey', async (req, res) => {
  const { clientele, college, course, responses, message } = req.body;

  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    request.input('clientele', sql.NVarChar, clientele);
    request.input('college', sql.NVarChar, college);
    request.input('course', sql.NVarChar, course);
    request.input('message', sql.NVarChar, message);

    // Loop through 10 questions
    for (let i = 0; i < 10; i++) {
      request.input(`q${i + 1}`, sql.NVarChar, responses[i] ?? null);
    }

    await request.query(`
      INSERT INTO SatisfactionSurveys (
        Clientele, College, Course, Message,
        Question1, Question2, Question3, Question4, Question5,
        Question6, Question7, Question8, Question9, Question10
      )
      VALUES (
        @clientele, @college, @course, @message,
        @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10
      )
    `);

    res.send('Survey submitted');
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

    // Step 1: Lookup student
    const studentResult = await pool.request()
      .input('idNumber', sql.VarChar, idNumber)
      .query(`
        SELECT 
          si.studID,
          si.studIDnumber,
          si.studLname,
          si.studFname,
          si.studCourse,
          si.studYear,
          si.studCollege,
          si.studGender
        FROM studInfo AS si
        WHERE si.studIDnumber = @idNumber;
      `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = studentResult.recordset[0];

    // Step 2: Count today's logs
    const todayLogs = await pool.request()
      .input('idNumber', sql.VarChar, idNumber)
      .query(`
        SELECT COUNT(*) AS logCount
        FROM LibLogins
        WHERE studIDnumber = @idNumber
          AND CAST(TimeLogged AS DATE) = CAST(GETDATE() AS DATE);
      `);

    const logCount = todayLogs.recordset[0].logCount;

    // Even count → next is "Time In", Odd count → next is "Time Out"
    const logType = logCount % 2 === 0 ? 'Time In' : 'Time Out';
    const nowPH = moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

    // Step 3: Insert log
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
          studIDnumber, studLname, studFname, studCourse, studYear, studCollege, studGender,  Section, studLogType, TimeLogged
        )
        OUTPUT INSERTED.LogID, INSERTED.studLogType, INSERTED.TimeLogged
        VALUES (
          @studIDnumber, @studLname, @studFname, @studCourse, @studYear, @studCollege, @studGender, @section, @studLogType, @timeLogged
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

// Catch-all route (fix for path-to-regexp in Node 22)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// =================== START SERVER =================== //
app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Server running on http://0.0.0.0:5000');
});