require('dotenv').config(); 
const mariadb = require("mariadb");

// ONLINE POOL
const pool = mariadb.createPool({
  host: process.env.DATABASE_IP,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5 
});
//LOCAL POOL
// const pool = mariadb.createPool({
//   host: process.env.DATABASE_LOCAL_IP,
//   port: process.env.DATABASE_PORT,
//   user: process.env.DATABASE_USER_LOCAL,
//   password: process.env.DATABASE_PASSWORD_LOCAL,
//   database: process.env.DATABASE_NAME_LOCAL,
//   connectionLimit: 5 
// });
// ฟังก์ชันเพื่อดึง connection จาก pool
async function getConnection() {
  let conn;
  try {
    conn = await pool.getConnection(); // ดึง connection จาก pool
    return conn;
  } catch (err) {
    console.error('Failed to get connection from pool:', err);
    throw err;
  }
}

// อย่าลืมคืน connection เมื่อทำงานเสร็จ
async function releaseConnection(conn) {
  if (conn) {
    try {
      conn.release(); // คืน connection กลับไปที่ pool
    } catch (err) {
      console.error('Failed to release connection:', err);
    }
  }
}

module.exports = {
  getConnection,
  releaseConnection
};
