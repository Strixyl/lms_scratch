const sql = require("mssql/msnodesqlv8");

const config = {
  server: "localhost",          // or "localhost\\MSSQLSERVER" if named instance
  database: "hllSystem",        // replace with your DB name
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
  },
};

async function testConnection() {
  try {
    const pool = await sql.connect(config);
    console.log("✅ Connected to SQL Server!");

    const result = await pool.request().query("SELECT GETDATE() AS CurrentTime");
    console.log("🕒 SQL Server Time:", result.recordset[0].CurrentTime);

    await pool.close();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();
