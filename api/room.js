const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');


router.post('/', async (req, res) => {
    const {  user_id,name,detail,latitude,longitude, status, create_at, image_url, date_time } = req.body; // รับข้อมูลจาก body
    console.log(req.body);

   
    try {
        const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
        if (conn) {
            console.log('Database connection established.');

            try {
                // เพิ่มข้อมูลลงในตาราง posts
                let query = 'INSERT INTO rooms (user_id,name,detail,image_url,latitude,longitude,date_time,status,create_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const roomResult = await conn.query(query, [user_id, name, detail, image_url, latitude, longitude, date_time, status, create_at]);
                const roomId = roomResult.insertId; // ดึง postId ของโพสต์ที่เพิ่งถูกเพิ่ม

                console.log('Inserted ROOM with ID:', roomId);
                query = 'insert into join_room (room_id, user_id, status) values (?, ?, ?)'
                const joinResult = await conn.query(query, [roomId,user_id,1]);
                query = 'SELECT * from rooms where room_id = ?';
                const result = await conn.query(query, [roomId]);
                

                res.status(200).json({ message: 'Room added successfully' + roomId , data: result})
              
            } catch (err) {
                console.error('Database query failed:', err);
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }

    } catch (err) {
        console.error('Error establishing database connection:', err);
        res.status(400).json({ message: 'Error connecting to the database', error: err });
    }
});

router.post('/join', async (req, res) => {
    const {  user_id, room_id } = req.body; // รับข้อมูลจาก body
    console.log(req.body);

   
    try {
        const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
        if (conn) {
            console.log('Database connection established.');

            try {

                console.log('Inserted Join ROOM with ID:', room_id);
                query = 'insert into join_room (room_id, user_id, status) values (?, ?, ?)'
                const joinResult = await conn.query(query, [room_id,user_id,1]);
                

                res.status(200).json({ message: 'Room added join successfully' + room_id })
              
            } catch (err) {
                console.error('Database query failed:', err);
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }

    } catch (err) {
        console.error('Error establishing database connection:', err);
        res.status(400).json({ message: 'Error connecting to the database', error: err });
    }
});

router.delete('/:id', async (req, res) => {
    const roomId = req.params.id; // รับ room_id จาก params
    console.log(`Deleting room with ID: ${roomId}`);

    try {
        const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
        if (conn) {
            console.log('Database connection established.');

            try {
                // ลบข้อมูลในตาราง rooms ตาม room_id
                let query = `UPDATE rooms 
                       SET status = ?
                       WHERE room_id = ?`;
                const result = await conn.query(query, [0,roomId]);

                if (result.affectedRows > 0) {
                    res.status(200).json({ message: `Room with ID: ${roomId} deleted successfully.` });
                } else {
                    res.status(404).json({ message: `Room with ID: ${roomId} not found.` });
                }
            } catch (err) {
                console.error('Database query failed:', err);
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }

    } catch (err) {
        console.error('Error establishing database connection:', err);
        res.status(400).json({ message: 'Error connecting to the database', error: err });
    }
});

router.get('/:roomId/users', async (req, res) => {
    const roomId = req.params.roomId; // รับ room_id จาก params
    console.log(`Fetching users in room with ID: ${roomId}`);

    try {
        const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
        if (conn) {
            console.log('Database connection established.');

            try {
                // SQL query เพื่อดึงข้อมูลผู้ใช้จาก join_room และ users
                let query = `
                    SELECT u.user_id, u.username, u.image_url
                    FROM join_room jr
                    JOIN users u ON jr.user_id = u.user_id
                    WHERE jr.room_id = ?
                    and jr.status = 1
                `;
                const users = await conn.query(query, [roomId]);

                if (users.length > 0) {
                    res.status(200).json({ message: 'Users fetched successfully', data: users });
                } else {
                    res.status(404).json({ message: `No users found in room with ID: ${roomId}` });
                }
            } catch (err) {
                console.error('Database query failed:', err);
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }

    } catch (err) {
        console.error('Error establishing database connection:', err);
        res.status(400).json({ message: 'Error connecting to the database', error: err });
    }
});

router.get('/public', async (req, res) => {
    try {
        const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
        if (conn) {
            console.log('Database connection established.');

            try {
                // SQL query เพื่อดึงข้อมูลห้องสาธารณะ
                const query = `
                    SELECT *
                    FROM rooms
                    WHERE status = 1  
                `;
                const rooms = await conn.query(query);

                if (rooms.length > 0) {
                    res.status(200).json({ message: 'Public rooms fetched successfully', data: rooms });
                } else {
                    res.status(404).json({ message: 'No public rooms found' });
                }
            } catch (err) {
                console.error('Database query failed:', err);
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }

    } catch (err) {
        console.error('Error establishing database connection:', err);
        res.status(400).json({ message: 'Error connecting to the database', error: err });
    }
});

module.exports = router;