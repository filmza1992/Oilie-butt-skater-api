const {getConnection} = require('../../javascript/connect/connection');

const updateRoom = async () => {
    const conn = await getConnection();
    try {

        // SQL query สำหรับอัปเดตห้องที่วันที่ผ่านมาแล้ว
        let query = `
            UPDATE rooms 
            SET status = 0
            WHERE date_time < NOW()
        `;

        await conn.query(query); // รัน query เพื่ออัปเดตข้อมูล
        console.log('Updating rooms at midnight successfully');
    } catch (err) {
        console.error('Error updating rooms:', err);
    } finally {
        if (conn) {
            conn.release(); // ปล่อยการเชื่อมต่อหลังการใช้งาน
        }
    }
};
  
const startRoomUpdater = () => {
    const now = new Date();

    const millisUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;

    const hours = Math.floor(millisUntilMidnight / (1000 * 60 * 60));
    const minutes = Math.floor((millisUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((millisUntilMidnight % (1000 * 60)) / 1000);

    console.log(`Start updater, next update in: ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
    console.log('======================')
    setTimeout(() => {
        updateRoom();

        setInterval(updateRoom, 86400000); // ทำงานทุก 24 ชั่วโมง
    }, millisUntilMidnight);
};


module.exports = {updateRoom , startRoomUpdater};