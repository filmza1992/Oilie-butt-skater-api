const mariadb = require("mariadb");


async function createConnection() {
  let conn;
  if (!conn) {
    try {
      conn = await mariadb.createConnection({
        host: "127.0.0.1",
        port: "3306",
        user: "root",
        password: "",
        database: "skateboard",
      });
      console.log('Database connection established.');
      return conn;
    } catch (err) {
      console.error('Failed to establish database connection:', err);
      throw err;
    }
  }
  return conn;
}


module.exports = createConnection;
