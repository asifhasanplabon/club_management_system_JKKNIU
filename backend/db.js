const mysql = require("mysql2/promise");
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",  
  database: process.env.DB_NAME || "cms3",
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected...");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Error:", err);
  }
})();

module.exports = db;
