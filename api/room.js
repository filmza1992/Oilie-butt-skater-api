const express = require('express');
const router = express.Router();
const { getConnection } = require('../javascript/connect/connection');
const { interfaceShowId } = require('./interface/operation');
const { exceptionError, exceptionEstablish, exceptionDBQuery } = require('./interface/exception');
const { responseMessageAndData } = require('./interface/response');
const interfaceConnectDB = require('./interface/connect');
const { sortRoomsByDistance, addDistanceToRooms } = require('./util/distance');


router.post('/', async (req, res) => {
    const { user_id, name, detail, latitude, longitude, status, create_at, image_url, date_time } = req.body; // รับข้อมูลจาก body
    console.log(req.body);


    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            console.log('Database connection established.');

            try {
                // เพิ่มข้อมูลลงในตาราง posts
                let query = 'INSERT INTO rooms (user_id,name,detail,image_url,latitude,longitude,date_time,status,create_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const roomResult = await conn.query(query, [user_id, name, detail, image_url, latitude, longitude, date_time, status, create_at]);
                const roomId = roomResult.insertId; // ดึง postId ของโพสต์ที่เพิ่งถูกเพิ่ม

                console.log('Inserted ROOM with ID:', roomId);
                query = 'insert into join_room (room_id, user_id, status) values (?, ?, ?)'
                const joinResult = await conn.query(query, [roomId, user_id, 1]);
                query = 'SELECT * from rooms where room_id = ?';
                const result = await conn.query(query, [roomId]);


                res.status(200).json({ message: 'Room added successfully' + roomId, data: result })

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
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.post('/join', async (req, res) => {
    const { user_id, room_id } = req.body; // รับข้อมูลจาก body
    console.log(req.body);


    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            console.log('Database connection established.');

            try {

                const checkQuery = 'SELECT * FROM join_room WHERE room_id = ? AND user_id = ? AND status = 0';
                const checkResult = await conn.query(checkQuery, [room_id, user_id]);

                if (checkResult.length > 0) {
                    // ถ้ามีแถวที่ status เป็น 0 อัปเดต status เป็น 1
                    const updateQuery = 'UPDATE join_room SET status = 1 WHERE room_id = ? AND user_id = ?';
                    await conn.query(updateQuery, [room_id, user_id]);
                    res.status(200).json({ message: `Room rejoined successfully: ${room_id}` });
                } else {
                    // ถ้าไม่มีแถวที่ status เป็น 0 ให้ insert ข้อมูลใหม่
                    const insertQuery = 'INSERT INTO join_room (room_id, user_id, status) VALUES (?, ?, ?)';
                    await conn.query(insertQuery, [room_id, user_id, 1]);
                    res.status(200).json({ message: `Room added join successfully: ${room_id}` });
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
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.post('/quit', async (req, res) => {
    const { user_id, room_id } = req.body; // รับข้อมูลจาก body
    console.log(req.body);

    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            console.log('Database connection established.');

            try {
                console.log('Updating status in Join ROOM with ID:', room_id);

                // Update status เป็น 0 ใน join_room ตาม user_id และ room_id ที่กำหนด
                const query = 'UPDATE join_room SET status = ? WHERE room_id = ? AND user_id = ?';
                const updateResult = await conn.query(query, [0, room_id, user_id]);

                if (updateResult.affectedRows > 0) {
                    res.status(200).json({ message: `Room with ID ${room_id} updated successfully for user ${user_id}` });
                } else {
                    res.status(404).json({ message: `No room found with ID ${room_id} for user ${user_id}` });
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
    } finally {
        if (conn) {
            conn.release();
        }
    }
});



router.delete('/:id', async (req, res) => {
    const roomId = req.params.id; // รับ room_id จาก params
    console.log(`Deleting room with ID: ${roomId}`);

    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            console.log('Database connection established.');

            try {
                // ลบข้อมูลในตาราง rooms ตาม room_id
                let query = `UPDATE rooms 
                       SET status = ?
                       WHERE room_id = ?`;
                const result = await conn.query(query, [0, roomId]);

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
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.get('/:roomId/users', async (req, res) => {
    const roomId = req.params.roomId; // รับ room_id จาก params
    console.log(`Fetching users in room with ID: ${roomId}`);

    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
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
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.post('/public/:user_id', async (req, res) => {
    const userId = req.params.user_id;
    const { latitude, longitude } = req.body; // รับข้อมูล latitude และ longitude จาก body

    interfaceShowId("GET", "PUBLIC ROOM", userId);
    console.log(latitude + " " + longitude);

    const conn = await getConnection();
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                const query = `
                  SELECT r.*
                    FROM rooms r
                    LEFT JOIN join_room j ON r.room_id = j.room_id AND j.user_id = ?
                    WHERE r.status = 1  
                    AND r.user_id != ?
                    AND (j.room_id IS NULL OR j.status = 0)
                `;

                const rooms = await conn.query(query, [userId, userId]);
                let newRoom;
                if (latitude != 0 && longitude != 0) {
                    newRoom = sortRoomsByDistance(rooms, latitude, longitude);
                } else {
                    newRoom = rooms;
                }
                newRoom = addDistanceToRooms(newRoom, latitude, longitude);
                console.log(rooms);
                if (rooms.length > 0) {
                    responseMessageAndData(res, 'Public rooms fetched successfully', newRoom);
                } else {
                    res.status(404).json({ message: 'No public rooms found' });
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }

        } else {
            exceptionEstablish(err, res);
        }

    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});


router.post('/join/:user_id/', async (req, res) => {
    const userId = req.params.user_id;
    const { latitude, longitude } = req.body; // รับข้อมูล latitude และ longitude จาก body

    interfaceShowId("POST", "JOINING ROOM AND CREATED ROOM BY THIS USER", userId);
    console.log(latitude + " " + longitude);
    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                // ดึงห้องที่ผู้ใช้กำลังเข้าร่วมอยู่และยังไม่หมดเวลา
                const queryJoinedRooms = `
                    SELECT r.*
                    FROM rooms r
                    JOIN join_room j ON r.room_id = j.room_id
                    WHERE r.status = 1
                    and r.user_id != ?
                    and j.user_id = ?
                    and j.status = 1
                `;

                // ดึงห้องที่ผู้ใช้เป็นคนสร้างและยังไม่หมดเวลา
                const queryCreatedRooms = `
                    SELECT *
                    FROM rooms
                    WHERE user_id = ? 
                    and status = 1
                `;

                // Query ห้องที่ผู้ใช้เข้าร่วม
                const joinedRooms = await conn.query(queryJoinedRooms, [userId, userId]);
                console.log(joinedRooms);
                // Query ห้องที่ผู้ใช้สร้าง
                const createdRooms = await conn.query(queryCreatedRooms, [userId]);
                console.log(createdRooms);

                let newJoin, newCreate;
                if (latitude != 0 && longitude != 0) {
                    newJoin = sortRoomsByDistance(joinedRooms, latitude, longitude);
                    newCreate = sortRoomsByDistance(createdRooms, latitude, longitude);
                } else {
                    newJoin = joinedRooms;
                    newCreate = createdRooms;
                }
                // รวมข้อมูลห้องทั้งหมด

                newJoin = addDistanceToRooms(newJoin, latitude, longitude);
                newCreate = addDistanceToRooms(newCreate, latitude, longitude);
                const allRooms = {
                    joinedRooms: newJoin,
                    createdRooms: newCreate
                };
                console.log(allRooms);
                if (joinedRooms.length > 0 || createdRooms.length > 0) {
                    responseMessageAndData(res, 'Rooms fetched successfully', allRooms);
                } else {
                    res.status(404).json({ message: 'No rooms found for this user' });
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.post('/follow/:user_id/', async (req, res) => {
    const userId = req.params.user_id;
    const { latitude, longitude } = req.body; // รับข้อมูล latitude และ longitude จาก body

    interfaceShowId("GET", "FRIEND ROOM BY FOLLOW USER", userId);
    console.log(latitude + " " + longitude);

    const conn = await getConnection(); // เรียก connection ไปยังฐานข้อมูล
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                // ดึงห้องที่ผู้ใช้ติดตามอยู่ แต่ไม่ได้เข้าร่วม และยังไม่หมดเวลา
                const queryFollowedRooms = `
                    SELECT r.*
                    FROM rooms r
                    JOIN follows f ON r.user_id = f.followed_user_id
                    LEFT JOIN join_room j ON r.room_id = j.room_id AND j.user_id = ?
                    WHERE f.following_user_id = ?
                    AND r.status = 1
                    AND (j.room_id IS NULL OR j.status = 0)
                `;

                // Query ห้องที่ผู้ใช้ติดตามอยู่แต่ไม่ได้เข้าร่วม
                const followedRooms = await conn.query(queryFollowedRooms, [userId, userId]);
                let newFollowRoom;
                if (latitude != 0 && longitude != 0) {
                    newFollowRoom = sortRoomsByDistance(followedRooms, latitude, longitude);
                } else {
                    newFollowRoom = followedRooms;
                }
                newFollowRoom = addDistanceToRooms(newFollowRoom, latitude, longitude);
                
                if (followedRooms.length > 0) {
                    responseMessageAndData(res, 'Followed rooms fetched successfully', newFollowRoom);
                } else {
                    res.status(404).json({ message: 'No followed rooms found for this user' });
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.get('/history/:user_id', async (req, res) => {
    const userId = req.params.user_id;

    interfaceShowId("GET", "HISTORY ROOM", userId);

    const conn = await getConnection();
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                const queryJoinedRooms = `
                SELECT r.*, u.username, u.image_url as user_image_url
                FROM rooms r
                JOIN join_room j ON r.room_id = j.room_id
                JOIN users u ON r.user_id = u.user_id
                WHERE r.status = 0
                AND j.status = 1
                AND r.user_id != ?
                AND j.user_id = ?
                ORDER BY r.date_time DESC
            `;
           
                const queryExitRooms = `
                SELECT r.*, u.username, u.image_url as user_image_url
                FROM rooms r
                JOIN join_room j ON r.room_id = j.room_id
                JOIN users u ON r.user_id = u.user_id
                AND j.status = 0
                AND r.user_id != ?
                AND j.user_id = ?
                ORDER BY r.date_time DESC
            `;
            // Query ห้องที่ผู้ใช้สร้าง เรียงลำดับจาก date_time ล่าสุดไปหาอดีต
            const queryCreatedRooms = `
                SELECT r.*, u.username, u.image_url as user_image_url
                FROM rooms r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.user_id = ? 
                AND r.status = 0
                ORDER BY r.date_time DESC
            `;
                // Query ห้องที่ผู้ใช้เข้าร่วม
                const joinedRooms = await conn.query(queryJoinedRooms, [userId, userId]);
                const exitedRooms = await conn.query(queryExitRooms, [userId, userId]);
              
                // Query ห้องที่ผู้ใช้สร้าง
                const createdRooms = await conn.query(queryCreatedRooms, [userId]);
               

                const allRooms = {
                    joinedRooms: joinedRooms,
                    createdRooms: createdRooms,
                    exitedRooms:  exitedRooms
                };
                console.log(allRooms);
                if (joinedRooms.length > 0 || createdRooms.length > 0) {
                    responseMessageAndData(res, 'Public rooms fetched successfully', allRooms);
                } else {
                    res.status(404).json({ message: 'No public rooms found' });
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});




module.exports = router;