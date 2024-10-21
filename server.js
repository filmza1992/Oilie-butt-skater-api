require('dotenv').config();
const http = require('http');
const os = require('os'); // import โมดูล os
const app = require('./app');
const { startRoomUpdater } = require('./api/util/interval');
const DATABASE_IP = process.env.DATABASE_IP
const DATABASE_LOCAL_IP = process.env.DATABASE_LOCAL_IP
const DATABASE_PORT = process.env.DATABASE_PORT;


const SERVER_IP = process.env.SERVER_IP || "localhost";
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  // const containerIP = getContainerIP();
  // console.log(`Server is started at IP: ${containerIP}, PORT: ${PORT}`);
  
  console.log('======================')
  console.log("Server is started "+SERVER_IP+": " + PORT);

  //LOCAL CONFIG
  // console.log("Server is started "+LOCAL_IP+": " + PORT);
  console.log(`DATABASE Connection to ${DATABASE_IP}:${DATABASE_PORT}`);
  console.log('======================')
  startRoomUpdater();
});
