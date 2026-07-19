const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: "Driver={ODBC Driver 18 for SQL Server};Server=JUSTER\\SQLEXPRESS;Database=hllSystem;Trusted_Connection=Yes;Encrypt=no;"
};

async function run() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TOP 5 * FROM OfficeSupplies");
    console.log("Current data:", result.recordset);
    sql.close();
  } catch (err) {
    console.error(err);
  }
}

run();
