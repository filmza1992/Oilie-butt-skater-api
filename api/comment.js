const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');


router.get('/:post_id', async (req, res) => {
    const { post_id } = req.params;  // รับค่า post_id จาก URL parameters
    console.log('======================');
    console.log('API ROUTE GET COMMENT BY POST_ID:', post_id);
    console.log('======================');

    const conn = await getConnection();

    if (conn) {
        try {
            // Query ดึง comments ตาม post_id

            const query = `
            SELECT comments.*, users.username, users.image_url AS user_image
            FROM comments
            LEFT JOIN users ON comments.user_id = users.user_id
            WHERE comments.post_id = ?
            ORDER BY comments.create_at DESC
        `;
            const rows = await conn.query(query,[post_id]);

            if (rows.length > 0) {
                // ส่งผลลัพธ์ของ comment กลับไปให้ client
                res.status(200).json({ message: 'Comments found for this post.',data: rows });
            } else {
                // ถ้าไม่มี comment ใดๆ
                res.status(200).json({ message: 'No comments found for this post.',data: [] });
            }

        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) await conn.close(); // ปิดการเชื่อมต่อฐานข้อมูล
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

router.post('/:post_id', async (req, res) => {
    const { post_id } = req.params;  // รับค่า post_id จาก URL parameters
    const { user_id, comment_text } = req.body;  // รับค่า user_id และ comment_text จาก request body
    console.log('======================');
    console.log('API ROUTE POST ADD COMMENT BY POST_ID:', post_id);
    console.log('======================');

    const conn = await getConnection();

    if (conn) {
        try {
            // Query เพิ่มคอมเมนต์ใหม่ลงในฐานข้อมูล
            const insertQuery = `
            INSERT INTO comments (post_id, user_id, comment_text, create_at)
            VALUES (?, ?, ?, NOW())
        `;

            const result = await conn.query(insertQuery, [post_id, user_id, comment_text]);

            if (result.affectedRows > 0) {
                // Query ดึงคอมเมนต์ล่าสุดที่เพิ่มเข้าไป (รวมข้อมูล user)
                const selectQuery = `
                SELECT comments.*, users.username, users.image_url AS user_image
                FROM comments
                LEFT JOIN users ON comments.user_id = users.user_id
                WHERE comments.comment_id = ?
            `;

                const [newComment] = await conn.query(selectQuery, [result.insertId]);

                // ส่งคอมเมนต์ที่เพิ่มกลับไปให้ client
                res.status(201).json({
                    message: 'Comment added successfully',
                    data: newComment,
                });
            } else {
                res.status(500).json({ message: 'Failed to add comment' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) await conn.close(); // ปิดการเชื่อมต่อฐานข้อมูล
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

module.exports = router;