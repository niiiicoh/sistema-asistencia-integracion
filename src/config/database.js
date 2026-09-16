require('dotenv').config();
const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'asistencia_empresa',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4'
});
