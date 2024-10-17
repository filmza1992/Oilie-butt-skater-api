const express = require('express');
const router = express.Router();
const { getConnection } = require('../javascript/connect/connection');
const getMonthNameInThai = require('./util/date');
const { responseMessageAndData } = require('./interface/response');


router.post('/month/', async (req, res) => {
    const { user_id } = req.body;

    const conn = await getConnection();
    if (conn) {
        try {
            // คำนวณวันเริ่มต้นและสิ้นสุดของเดือนที่แล้ว
            const today = new Date();
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            
            // ฟังก์ชันสำหรับแปลงวันที่เป็น 'YYYY-MM-DD'
            function formatDateToLocal(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            const startDate = formatDateToLocal(thisMonthStart) + ' 00:00:00';
            const endDate = formatDateToLocal(thisMonthEnd) + ' 23:59:59';
            console.log(startDate);
            console.log(endDate);
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
            const topRankings = topRankingRows.map((row, index) => ({
                rank: index + 1,
                user_id: row.user_id,
                username: row.username,
                image_url: row.image_url,
                total_likes: row.total_likes.toString()
            }));

            // ตรวจสอบว่า user_id ของเรามีอยู่ใน top 5 หรือไม่
            const isUserInTop5 = topRankings.some(ranking => ranking.user_id === user_id);
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
            if (!isUserInTop5) {

                if (userRankingRows.length > 0 && !isUserInTop5) {
                    // แปลงค่าของ userRankingRows
                    const userRankingData = {
                        username: userRankingRows[0].username,
                        rank_position: userRankingRows[0].rank_position.toString(),
                        total_likes: userRankingRows[0].total_likes.toString(),
                        image_url: userRankingRows[0].image_url,
                    };

                    const monthNumber = thisMonthStart.getMonth() + 1;
                    const monthNameInThai = getMonthNameInThai(monthNumber);

                    const data = {
                        top_5_rankings: topRankings,
                        user_ranking: userRankingData,
                        month: monthNameInThai,
                    };
                    responseMessageAndData(res, 'Successfully retrieved ranking', data);
                } else {
                    const userRankingData = {
                        username: '',
                        rank_position: '0',
                        total_likes: '0',
                        image_url: ''
                    };
                    const monthNumber = thisMonthStart.getMonth() + 1;
                    const monthNameInThai = getMonthNameInThai(monthNumber);

                    const data = {
                        top_5_rankings: topRankings,
                        user_ranking: userRankingData,
                        month: monthNameInThai,
                    };
                    responseMessageAndData(res, 'Successfully retrieved ranking', data);
                }
            } else {
                if (userRankingRows.length > 0 && !isUserInTop5) {
                    // แปลงค่าของ userRankingRows
                    const userRankingData = {
                        username: userRankingRows[0].username,
                        rank_position: "0",
                        total_likes: userRankingRows[0].total_likes.toString(),
                        image_url: userRankingRows[0].image_url,
                    };

                    const monthNumber = thisMonthStart.getMonth() + 1;
                    const monthNameInThai = getMonthNameInThai(monthNumber);

                    const data = {
                        top_5_rankings: topRankings,
                        user_ranking: userRankingData,
                        month: monthNameInThai,
                    };
                    responseMessageAndData(res, 'Successfully retrieved ranking', data);
                } else {
                    const userRankingData = {
                        username: '',
                        rank_position: '0',
                        total_likes: '0',
                        image_url: ''
                    };
                    const monthNumber = thisMonthStart.getMonth() + 1;
                    const monthNameInThai = getMonthNameInThai(monthNumber);

                    const data = {
                        top_5_rankings: topRankings,
                        user_ranking: userRankingData,
                        month: monthNameInThai,
                    };
                    responseMessageAndData(res, 'Successfully retrieved ranking', data);
                }
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
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

router.post('/allmonth/', async (req, res) => {
    const { user_id } = req.body;
    const conn = await getConnection();

    if (conn) {
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const rankingData = [];

            // ฟังก์ชันแปลงวันที่เป็น 'YYYY-MM-DD'
            function formatDateToLocal(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            // ฟังก์ชันแปลงเดือนเป็นภาษาไทย
            function getMonthNameInThai(monthNumber) {
                const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
                return monthNames[monthNumber - 1];
            }

            // Loop ผ่านเดือนตั้งแต่มกราคมจนถึงเดือนปัจจุบันของปีนี้
            for (let month = 1; month <= today.getMonth() + 1; month++) {
                const monthStart = new Date(currentYear, month - 1, 1);
                const monthEnd = new Date(currentYear, month, 0);

                const startDate = formatDateToLocal(monthStart) + ' 00:00:00';
                const endDate = formatDateToLocal(monthEnd) + ' 23:59:59';

                // ตรวจสอบว่ามีโพสต์เกิดขึ้นในเดือนนี้หรือไม่
                const checkPostsQuery = `
                    SELECT COUNT(*) as post_count
                    FROM posts
                    WHERE create_at BETWEEN ? AND ?;
                `;
                const postCountRows = await conn.query(checkPostsQuery, [startDate, endDate]);

                if (postCountRows[0].post_count > 0) {
                    // ดึงข้อมูลการจัดอันดับของเดือนนี้หากมีโพสต์
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

                    const topRankings = topRankingRows.map((row, index) => ({
                        rank: index + 1,
                        user_id: row.user_id,
                        username: row.username,
                        image_url: row.image_url,
                        total_likes: row.total_likes.toString()
                    }));

                    // ตรวจสอบอันดับของ user ปัจจุบัน
                    const userRankingQuery = `
                        SELECT rank_position, total_likes, user_ranking.username, user_ranking.image_url FROM (
                            SELECT posts.user_id, users.username, users.image_url, COUNT(post_interaction.post_id) AS total_likes,
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

                    let userRankingData = {};
                    
                    const isUserInTop5 = topRankings.some(ranking => ranking.user_id === user_id);
           
                    if (userRankingRows.length > 0 && !isUserInTop5) {
                        userRankingData = {
                            username: userRankingRows[0].username,
                            rank_position: userRankingRows[0].rank_position.toString(),
                            total_likes: userRankingRows[0].total_likes.toString(),
                            image_url: userRankingRows[0].image_url
                        };
                    } else {
                        userRankingData = {
                            username: '',
                            rank_position: '0',
                            total_likes: '0',
                            image_url: ''
                        };
                    }

                    // แปลงข้อมูลเดือนเป็นภาษาไทย
                    const monthNameInThai = getMonthNameInThai(month);

                    // จัดเก็บข้อมูลของแต่ละเดือนที่มีโพสต์
                    rankingData.push({
                        month: monthNameInThai,
                        top_5_rankings: topRankings,
                        user_ranking: userRankingData
                    });
                }
            }

            // ส่งข้อมูลที่จัดเก็บให้กับ client
            responseMessageAndData(res, 'Successfully retrieved monthly rankings', rankingData);

        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) {
                conn.release();
            }
        }
    } else {
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});


module.exports = router;
