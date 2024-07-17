const admin = require('firebase-admin');
const serviceAccount = require('../javascript/oilie-butt-skater-app-firebase-adminsdk-sh1tk-cf7df9277f.json'); // แทนที่ด้วย path ที่ถูกต้องไปยัง service account key ของคุณ

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://oilie-butt-skater-app-default-rtdb.asia-southeast1.firebasedatabase.app/' // แทนที่ <DATABASE_NAME> ด้วยชื่อ database ของคุณ
});

const db = admin.database();

module.exports = db;
