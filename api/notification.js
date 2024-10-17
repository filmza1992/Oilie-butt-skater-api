const express = require('express');
const moment = require('moment-timezone');

const { getConnection } = require('../javascript/connect/connection');
const router = express.Router();

router.get('/:user_id', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET NOTIFICATION');
    console.log('======================');

    const { user_id } = req.params;
    console.log('Received user_id:', user_id);

    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // Query ข้อมูลการแจ้งเตือนจาก post_interaction ที่ notify = 1
            const postInteractionQuery = `
            SELECT 
              p.post_id,
              p.title,
              CAST(COUNT(pi.post_interaction_id) AS INT) AS interaction_count, 
              MAX(pi.create_at) AS last_interaction_time
            FROM 
              post_interaction pi
            JOIN 
              posts p ON pi.post_id = p.post_id
            WHERE 
              p.user_id = ? 
              AND pi.user_id != ? 
              AND pi.notify = 1
            GROUP BY 
              p.post_id
          `;
          
          const followsQuery = `
            SELECT 
              f.follow_id, 
              u.user_id, 
              u.username, 
              f.notify, 
              f.create_at 
            FROM 
              follows f
            JOIN 
              users u ON f.following_user_id = u.user_id
            WHERE 
              f.followed_user_id = ? 
              AND f.notify = 1
          `;

            // เรียกใช้ query ทั้งสองอัน
            const [postInteractionRows, followsRows] = await Promise.all([
                conn.query(postInteractionQuery, [user_id, user_id]),
                conn.query(followsQuery, [user_id])
            ]);

            // รวมผลลัพธ์จากทั้งสอง query เข้าด้วยกัน
            const allNotifications = [...postInteractionRows, ...followsRows];
            
            // แปลง interaction_count เป็น int
            allNotifications.forEach(notification => {
                if (notification.interaction_count) {
                    notification.interaction_count = parseInt(notification.interaction_count, 10); // แปลงเป็น int
                }
            });
            allNotifications.sort((a, b) => {
                const aTime = a.last_interaction_time || a.create_at;
                const bTime = b.last_interaction_time || b.create_at;
                return new Date(bTime) - new Date(aTime); // เรียงจากใหม่ไปเก่า
            });
            allNotifications.forEach(notification => {
                if (notification.create_at) {
                    notification.create_at = moment.utc(notification.create_at).tz('Asia/Bangkok').format();
                }
                if (notification.last_interaction_time) {
                    notification.last_interaction_time = moment.utc(notification.last_interaction_time).tz('Asia/Bangkok').format();
                }
            });
            if (allNotifications.length > 0) {
                console.log('GET NOTIFICATIONS SUCCESSFULLY:', allNotifications);
                res.status(200).json({ message: 'Successfully retrieved notifications', data: allNotifications });
            } else {
                console.log('Status: 400, No notifications found');
                res.status(200).json({ message: 'No notifications found',data :[] });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) {
                conn.release();
            }
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

router.put('/:postId', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE UPDATE POST INTERACTION');
    console.log('======================');

    const { postId } = req.params;
    console.log('Received postId:', postId);
    
    // ควรจะมีข้อมูลที่ส่งมาใน body ด้วย
    const { action } = req.body; // หรือข้อมูลอื่นๆ ที่จำเป็น
    console.log('Received action:', action);

    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // อัปเดตการทำงานของโพสต์ในฐานข้อมูล
            const updateQuery = `
                UPDATE post_interaction
                SET notify = 0
                WHERE post_id = ?
            `;

            const result = await conn.query(updateQuery, [parseInt(postId)]);

            if (result.affectedRows > 0) {
                console.log('POST INTERACTION UPDATED SUCCESSFULLY');
                res.status(200).json({ message: 'Successfully updated post interaction' });
            } else {
                console.log('Status: 404, Post interaction not found');
                res.status(404).json({ message: 'Post interaction not found' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) {
                conn.release();
            }
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});



router.put('/follow/:followId', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE UPDATE FOLLOW');
    console.log('======================');

    const { followId } = req.params;
    console.log('Received followId:', followId);
    
    // ควรจะมีข้อมูลที่ส่งมาใน body ด้วย
    const { action } = req.body; // หรือข้อมูลอื่นๆ ที่จำเป็น
    console.log('Received action:', action);

    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // อัปเดตการทำงานของโพสต์ในฐานข้อมูล
            const updateQuery = `
                UPDATE follows
                SET notify = 0
                WHERE follow_id = ?
            `;

            const result = await conn.query(updateQuery, [parseInt(followId)]);

            if (result.affectedRows > 0) {
                console.log('FOLLOW INTERACTION UPDATED SUCCESSFULLY');
                res.status(200).json({ message: 'Successfully updated post interaction' });
            } else {
                console.log('Status: 404, follow not found');
                res.status(404).json({ message: 'follow not found' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) {
                conn.release();
            }
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});
module.exports = router;
