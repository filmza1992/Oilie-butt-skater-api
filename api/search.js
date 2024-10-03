const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');
const { QUERY_LIKE_POST, QUERY_DISLIKE_POST, QUERY_COMMENT_POST, QUERY_INTERACTION_POST } = require('../constant/post');


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

router.post('/getPosts/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST SEARCH POST');
    console.log('======================');

    const { tag, user_id } = req.body;
    console.log(req.body);
    console.log(tag);

    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // Query แบบ LIKE
            let query = `
                SELECT posts.*, users.username, users.image_url AS user_image, images.url AS image_url, videos.url AS video_url 
                FROM posts 
                LEFT JOIN users ON posts.user_id = users.user_id 
                LEFT JOIN images ON posts.post_id = images.post_id 
                LEFT JOIN videos ON posts.post_id = videos.post_id
                WHERE posts.tag LIKE ?
                ORDER BY posts.create_at DESC
            `;
            const searchPattern = `%${tag}%`;
            const rows = await conn.query(query, [searchPattern]);
            console.log(rows);
            if (rows.length > 0) {
                // กรองโพสต์ที่มีแท็กตรงตามที่ต้องการ
                const filteredPosts = rows.filter(item => {
                    // แยกแท็กออกเป็น array และเช็คว่าแท็กที่ต้องการอยู่ใน array หรือไม่
                    const tagsArray = item.tag.split(' '); // สมมติแท็กคั่นด้วยช่องว่าง
                    console.log(`${tag}`);
                    console.log(tagsArray);
                    return tagsArray.includes(`${tag}`); // ค้นหาแท็กที่ตรงกับ tag ที่ค้นหา
                });
                console.log("filteredPosts: "+filteredPosts);
                if (filteredPosts.length > 0) {
                    // ประมวลผลข้อมูลเพิ่มเติม
                    const posts = await Promise.all(filteredPosts.map(async (item) => {
                        // Query likes, dislikes, comments และ status เหมือนเดิม
                        const likesQuery = QUERY_LIKE_POST;
                        const [likesResult] = await conn.query(likesQuery, [item.post_id]);
                        const likes = likesResult.likes;

                        const dislikesQuery = QUERY_DISLIKE_POST;
                        const [dislikesResult] = await conn.query(dislikesQuery, [item.post_id]);
                        const dislikes = dislikesResult.dislikes;

                        const commentsQuery = QUERY_COMMENT_POST;
                        const [commentsResult] = await conn.query(commentsQuery, [item.post_id]);
                        const comments = commentsResult.comments;

                        const interactionsQuery = QUERY_INTERACTION_POST;
                        const interactionsResult = await conn.query(interactionsQuery, [item.post_id, user_id]);
                        let status = 0;
                        if (interactionsResult[0]) {
                            status = interactionsResult[0].status;
                        }

                        return {
                            post_id: item.post_id,
                            username: item.username,
                            user_image: item.user_image,
                            title: item.title,
                            user_id: item.user_id,
                            type: item.type,
                            tag: item.tag,
                            created_at: item.create_at,
                            content: item.image_url ? item.image_url : item.video_url,
                            likes: parseInt(likes),
                            dislikes: parseInt(dislikes),
                            comments: parseInt(comments),
                            status: status ?? 0
                        };
                    }));
                    console.log(posts);
                    res.status(200).json({ message: 'Successfully retrieved posts', data: { posts } });
                } else {
                    res.status(400).json({ message: 'NOT Found post' });
                }
            } else {
                res.status(400).json({ message: 'NOT Found post' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        }
    } else {
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});




router.post('/getTags/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST SERACH TAG');
    console.log('======================');

    const { tag } = req.body;
    console.log(req.body);
    console.log(tag);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            let query = `
                SELECT posts.tag as tag 
                FROM posts 
                WHERE tag LIKE ? 
            `;
            const searchPattern = `%${tag}%`;
            const rows = await conn.query(query, [searchPattern]);

            if (rows.length > 0) {
                // สร้าง object เพื่อนับแท็กหลังจากแยกออก
                const tagCountMap = {};

                // Loop เพื่อแยกแท็กที่ติดกันและนับจำนวน
                rows.forEach(row => {
                    const tags = row.tag.split(' '); // แยก tag ตามช่องว่าง
                    tags.forEach(singleTag => {
                        if (singleTag in tagCountMap) {
                            tagCountMap[singleTag] += 1; // ถ้ามีแท็กนี้อยู่แล้ว เพิ่มจำนวน
                        } else {
                            tagCountMap[singleTag] = 1; // ถ้าไม่มีแท็กนี้ใน map สร้างใหม่
                        }
                    });
                });

                // เปลี่ยนจาก object เป็น array ที่จะส่งกลับ
                const data = {
                    tags: Object.entries(tagCountMap).map(([tag, count]) => ({ tag, count })),
                };

                console.log(data);
                console.log('GET TAGS SUCCESSFULLY:');
                res.status(200).json({ message: 'Successfully retrieved Tags', data: data });
            } else {
                console.log('Status: 400 , NOT Found Tag:');
                res.status(400).json({ message: 'NOT Found post' });
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