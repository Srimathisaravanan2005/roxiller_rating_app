const mysql = require('mysql2/promise')

const database = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'roxillar_ratings',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

module.exports = database