const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');


router.post('/getUsers/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST USER');
    console.log('======================');

    const { username } = req.body;
    console.log(req.body);
    console.log(username);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // ใช้ LIKE สำหรับการค้นหาแบบ case-insensitive
            let query = `SELECT * FROM users WHERE username LIKE ?`;
            const searchPattern = `%${username}%`; // ค้นหาทั้งหมดที่มีชื่อผู้ใช้รวมถึงชื่อที่ป้อน
            const rows = await conn.query(query, [searchPattern]);
          
            if (rows.length > 0) {
                const data = {
                    users: rows, // ใช้ข้อมูลผู้ใช้ที่ได้จากการค้นหา
                };
                console.log(data);
                console.log('GET USERS SUCCESSFULY:');
                res.status(200).json({ message: 'Successfully retrieved users', data: data });
            } else {
                console.log('Status: 400 , NOT Found user:');
                res.status(400).json({ message: 'NOT Found user' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

module.exports = router;