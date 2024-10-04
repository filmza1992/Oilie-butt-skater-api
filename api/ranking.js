const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');
const getMonthNameInThai = require('./util/date');


router.post('/month/', async (req, res) => {
    const { user_id } = req.body;

    const conn = await getConnection();
    if (conn) {
        try {
            // คำนวณวันเริ่มต้นและสิ้นสุดของเดือนที่แล้ว
            const lastMonthStart = new Date();
            lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
            lastMonthStart.setDate(1);

            const lastMonthEnd = new Date(lastMonthStart);
            lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
            lastMonthEnd.setDate(0);

            // กำหนดวันที่ให้เป็น string format 'YYYY-MM-DD'
            const startDate = lastMonthStart.toISOString().slice(0, 10) + ' 00:00:00';
            const endDate = lastMonthEnd.toISOString().slice(0, 10) + ' 23:59:59';

            // Query สำหรับดึง 5 อันดับแรก
            const topRankingQuery = `
                SELECT posts.user_id, users.username, users.image_url,COUNT(post_interaction.post_id) AS total_likes
                FROM posts
                JOIN post_interaction ON posts.post_id = post_interaction.post_id
                JOIN users ON posts.user_id = users.user_id
                WHERE posts.create_at BETWEEN ? AND ?
                AND post_interaction.status = 1
                AND post_interaction.create_at BETWEEN ? AND ?
                GROUP BY posts.user_id, users.username
                ORDER BY total_likes DESC
                LIMIT 5;
            `;

            const topRankingRows = await conn.query(topRankingQuery, [startDate, endDate, startDate, endDate]);

            // แปลงค่าของ topRankingRows
            const topRankings = topRankingRows.map((row,index) => ({
                rank: index + 1,
                user_id: row.user_id,
                username: row.username, // เพิ่มชื่อผู้ใช้
                image_url: row.image_url,
                total_likes: row.total_likes.toString() // แปลงเป็น string
            }));

            // Query หายอดไลค์ของผู้ใช้ที่ส่งมา (เฉพาะไลค์ที่ถูกกดในเดือนที่แล้ว)
            const userRankingQuery = `
                SELECT rank_position, total_likes, user_ranking.username ,user_ranking.image_url FROM (
                    SELECT posts.user_id , users.username, users.image_url, COUNT(post_interaction.post_id) AS total_likes,
                    RANK() OVER (ORDER BY COUNT(post_interaction.post_id) DESC) AS rank_position
                    FROM posts
                    JOIN post_interaction ON posts.post_id = post_interaction.post_id
                    JOIN users ON posts.user_id = users.user_id
                    WHERE posts.create_at BETWEEN ? AND ?
                    AND post_interaction.status = 1
                    AND post_interaction.create_at BETWEEN ? AND ?
                    GROUP BY posts.user_id, users.username
                ) AS user_ranking
                WHERE user_ranking.user_id = ?;
            `;

            const userRankingRows = await conn.query(userRankingQuery, [startDate, endDate, startDate, endDate, user_id]);

            if (userRankingRows.length > 0) {
                // แปลงค่าของ userRankingRows
                const userRankingData = {
                    username: userRankingRows[0].username, // เพิ่มชื่อผู้ใช้
                    rank_position: userRankingRows[0].rank_position.toString(), // แปลงเป็น string
                    total_likes: userRankingRows[0].total_likes.toString(), // แปลงเป็น string
                    image_url: userRankingRows[0].image_url,
                };

                // เตรียมข้อมูลสำหรับตอบกลับ
                const monthNumber = lastMonthStart.getMonth() + 1; // ค่าหมายเลขเดือน (1-12)
                const monthNameInThai = getMonthNameInThai(monthNumber); // ชื่อเดือนภาษาไทย
    
                const data = {
                    top_5_rankings: topRankings,
                    user_ranking: userRankingData, // ข้อมูลอันดับของ user ที่ส่งมา
                    month: monthNameInThai, // เพิ่มเดือนที่ตรวจสอบ
                };

                res.status(200).json({ message: 'Successfully retrieved ranking', data: data });
            } else {
                res.status(404).json({ message: 'User ranking not found' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        }
    } else {
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

module.exports = router;
