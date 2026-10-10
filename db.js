require('dotenv').config();
const mysql = require('mysql2/promise');

// Cloud databases (TiDB Cloud, etc.) need SSL. Set DB_SSL=true to turn it on.
const ssl = process.env.DB_SSL === 'true'
  ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  : undefined;

module.exports = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_campus',
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // DATE columns come back as 'YYYY-MM-DD' text
});
