const express = require('express');
const router = express.Router();
const {getConnection} = require('../javascript/connect/connection');
const { QUERY_LIKE_POST, QUERY_DISLIKE_POST, QUERY_COMMENT_POST, QUERY_INTERACTION_POST } = require('../constant/post');
const { exceptionEstablish, exceptionError } = require('./interface/exception');


router.post('/getUsers/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST USER');
    console.log('======================');

    const { username, user_id } = req.body;
    console.log(req.body);
    console.log(username);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // ใช้ LIKE สำหรับการค้นหาแบบ case-insensitive
            let query = `SELECT * FROM users WHERE username LIKE ? and users.user_id != ?`;
            const searchPattern = `%${username}%`; // ค้นหาทั้งหมดที่มีชื่อผู้ใช้รวมถึงชื่อที่ป้อน
            const rows = await conn.query(query, [searchPattern, user_id]);
          
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
        } finally {
            if (conn){
                conn.release();
            }
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

            if (rows.length > 0) {
                // สร้าง postsMap สำหรับเก็บโพสต์ที่มี post_id เดียวกัน
                const postsMap = {};

                rows.forEach((item) => {
                    if (!postsMap[item.post_id]) {
                        // สร้าง array เพื่อเก็บรูปภาพและวิดีโอ
                        const contentList = [];

                        if (item.image_url) {
                            contentList.push(item.image_url);
                        }
                        if (item.video_url) {
                            contentList.push(item.video_url);
                        }

                        postsMap[item.post_id] = {
                            post_id: item.post_id,
                            username: item.username,
                            user_image: item.user_image,
                            title: item.title,
                            user_id: item.user_id,
                            type: item.type,
                            tag: item.tag,
                            created_at: item.create_at,
                            content: contentList, // ใช้ array สำหรับเก็บรูปภาพหรือวิดีโอ
                            likes: 0, // Default value (จะอัปเดตภายหลัง)
                            dislikes: 0, // Default value (จะอัปเดตภายหลัง)
                            comments: 0, // Default value (จะอัปเดตภายหลัง)
                            status: 0 // Default value (จะอัปเดตภายหลัง)
                        };
                    } else {
                        // เพิ่มรูปภาพหรือวิดีโอเข้ากับ content list ถ้าโพสต์เดิมมีอยู่แล้ว
                        if (item.image_url) {
                            postsMap[item.post_id].content.push(item.image_url);
                        }
                        if (item.video_url) {
                            postsMap[item.post_id].content.push(item.video_url);
                        }
                    }
                });

                // ประมวลผลข้อมูลเพิ่มเติม เช่น likes, dislikes, comments, status
                const posts = await Promise.all(Object.values(postsMap).map(async (post) => {
                    // Query likes, dislikes, comments และ status เหมือนเดิม
                    const likesQuery = QUERY_LIKE_POST;
                    const [likesResult] = await conn.query(likesQuery, [post.post_id]);
                    post.likes = parseInt(likesResult.likes);

                    const dislikesQuery = QUERY_DISLIKE_POST;
                    const [dislikesResult] = await conn.query(dislikesQuery, [post.post_id]);
                    post.dislikes = parseInt(dislikesResult.dislikes);

                    const commentsQuery = QUERY_COMMENT_POST;
                    const [commentsResult] = await conn.query(commentsQuery, [post.post_id]);
                    post.comments = parseInt(commentsResult.comments);

                    const interactionsQuery = QUERY_INTERACTION_POST;
                    const interactionsResult = await conn.query(interactionsQuery, [post.post_id, user_id]);
                    post.status = interactionsResult[0]?.status ?? 0;

                    return post;
                }));

                res.status(200).json({ message: 'Successfully retrieved posts', data: { posts } });
            } else {
                res.status(400).json({ message: 'NOT Found post' });
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





router.post('/getTags/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST SERACH TAG');
    console.log('======================');

    const { tag } = req.body;
    console.log(req.body);
    console.log(tag);
    const conn = await getConnection();
    try{
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
    }catch(err) {
        exceptionError(err, res);
    } finally {
        if (conn){
            conn.release();
        }
    }
   
});

module.exports = router;