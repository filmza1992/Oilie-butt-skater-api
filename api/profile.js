const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const {getConnection} = require('../javascript/connect/connection');
const saltRounds = 10;


router.post('/edit', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST UPDATE PROFILE');
    console.log('======================');

    const { user_id, username, birth_day, image_url } = req.body;
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            const checkUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const [existingUser] = await conn.query(checkUserQuery, [user_id]);

            if (existingUser.length === 0) {
                // ถ้าผู้ใช้ไม่มีอยู่ในระบบ ให้ส่งข้อผิดพลาดกลับ
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // อัปเดตข้อมูลผู้ใช้ในฐานข้อมูล
            const updateQuery = `
              UPDATE users 
              SET username = ?,  birth_day = ?, image_url = ? 
              WHERE user_id = ?
            `;
            const result = await conn.query(updateQuery, [username, birth_day, image_url, user_id]);
            console.log(result)
            console.log(result.affectedRows);
            const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const [updatedUser] = await conn.query(getUserQuery, [user_id]);

            console.log('Update successful');
            console.log({
                message: 'Update successful',
                user: updatedUser // ส่งคืน user object ที่ถูกอัปเดต
            });
            res.status(200).json({
                message: 'Update successful',
                data: updatedUser // ส่งคืน user object ที่ถูกอัปเดต
            });
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) await conn.close();
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});



router.post('/edit/password', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST UPDATE PASSWORD ');
    console.log('======================');

    const { user_id, password, new_password } = req.body;
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {

            const checkUserQuery = 'SELECT * FROM users WHERE user_id = ?';
            const [existingUser] = await conn.query(checkUserQuery, [user_id]);

            if (existingUser.length === 0) {
                // ถ้าผู้ใช้ไม่มีอยู่ในระบบ ให้ส่งข้อผิดพลาดกลับ
                res.status(404).json({ message: 'User not found' });
                return;
            }

            const passwordMatch = await bcrypt.compare(password, existingUser.password);
            if (passwordMatch) {
                const updateQuery = `
                UPDATE users 
                SET password = ?
                WHERE user_id = ?
                `;
                const hashedPassword = await bcrypt.hash(new_password, saltRounds);

                await conn.query(updateQuery, [hashedPassword, user_id]);
                console.log('Update password successful:');

                const getUserQuery = 'SELECT * FROM users WHERE user_id = ?';
                const [updatedUser] = await conn.query(getUserQuery, [user_id]);


                console.log({
                    message: 'Update password successful',
                    user: updatedUser // ส่งคืน user object ที่ถูกอัปเดต
                });
                res.status(200).json({
                    message: 'Update successful',
                    data: updatedUser // ส่งคืน user object ที่ถูกอัปเดต
                });
            } else {
                console.log('Update failed: Invalid credentials');
                res.status(401).json({ message: 'Invalid credentials' });
            }

        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) await conn.close();
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});


router.post('/check-empty-password', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST CHECK EMPTY PASSWORD');
    console.log('======================');

    const { user_id } = req.body; // รับค่า user_id จาก body
    const conn = await getConnection();
    
    if (conn) {
        console.log('Database connection established.');
        try {
            const query = 'SELECT password FROM users WHERE user_id = ?';
            const [user] = await conn.query(query, [user_id]);

            if (user.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const hashedPassword = user.password;

            // แฮชของค่าว่าง ("") ด้วย bcrypt
            const emptyPasswordHash = await bcrypt.hash('', 10);

            // ตรวจสอบว่าแฮชตรงกับค่าว่างหรือไม่
            const isEmptyPassword = await bcrypt.compare('', hashedPassword);

            if (isEmptyPassword) {
                return res.status(200).json({ message: 'Password is empty', data: true });
            } else {
                return res.status(200).json({ message: 'Password is not empty', data: false });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        } finally {
            if (conn) await conn.close();
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});

router.get('/getAll/:user_id', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET IMAGE ALL');
    console.log('======================');

    const { user_id } = req.params;
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            let query = ` 
                SELECT posts.*, users.username, users.image_url AS user_image, images.url AS image_url, videos.url AS video_url
                FROM posts
                LEFT JOIN users ON posts.user_id = users.user_id
                LEFT JOIN images ON posts.post_id = images.post_id
                LEFT JOIN videos ON posts.post_id = videos.post_id
                WHERE users.user_id = ?
                ORDER BY posts.create_at DESC
            `;

            const rows = await conn.query(query, [user_id]);
            let sumLikes = 0;
            console.log(user_id);
            console.log(rows);
            const postsMap = {};

            // Process rows and map posts by post_id
            rows.forEach(item => {
                const postId = item.post_id;

                // Check if the post already exists in the map
                if (!postsMap[postId]) {
                    postsMap[postId] = {
                        post_id: postId,
                        username: item.username,
                        user_image: item.user_image,
                        title: item.title,
                        user_id: item.user_id,
                        type: item.type,
                        tag: item.tag,
                        created_at: item.create_at,
                        content: [], // Array to store image or video URLs
                        likes: 0,
                        dislikes: 0,
                        comments: 0,
                        status: 0
                    };
                }

                // Add URL of image or video to the content array
                if (item.image_url) {
                    postsMap[postId].content.push(item.image_url);
                } else if (item.video_url) {
                    postsMap[postId].content.push(item.video_url);
                }
            });

            if (Object.keys(postsMap).length > 0) {
                const posts = await Promise.all(Object.values(postsMap).map(async (post) => {
                    const likesQuery = `
                        SELECT COUNT(*) as likes
                        FROM post_interaction
                        WHERE post_id = ? AND status = ${POST_INTERACTION_LIKE}
                    `;
                    const [likesResult] = await conn.query(likesQuery, [post.post_id]);
                    const likes = likesResult.likes;

                    const dislikesQuery = `
                        SELECT COUNT(*) as dislikes
                        FROM post_interaction
                        WHERE post_id = ? AND status = ${POST_INTERACTION_DISLIKE}
                    `;
                    const [dislikesResult] = await conn.query(dislikesQuery, [post.post_id]);
                    const dislikes = dislikesResult.dislikes;

                    const commentsQuery = `
                        SELECT COUNT(*) as comments
                        FROM comments
                        WHERE post_id = ?
                    `;
                    const [commentsResult] = await conn.query(commentsQuery, [post.post_id]);
                    const comments = commentsResult.comments;

                    const interactionsQuery = `
                        SELECT * FROM post_interaction 
                        WHERE post_id = ? AND user_id = ?
                    `;
                    const interactionsResult = await conn.query(interactionsQuery, [post.post_id, user_id]);
                    let status = interactionsResult[0] ? interactionsResult[0].status : 0;

                    sumLikes += parseInt(likes);
                    return {
                        ...post,
                        likes: parseInt(likes),
                        dislikes: parseInt(dislikes),
                        comments: parseInt(comments),
                        status: status
                    };
                }));

                const followQuery = `
                SELECT COUNT(*) as follows
                FROM follows
                WHERE followed_user_id = ?
            `;
            const followResult = await conn.query(followQuery, [user_id]);
            sumFollows = parseInt(followResult[0].follows);
                
                posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const data = {
                    posts: posts,
                    sumLikes: sumLikes,
                    follow: sumFollows
                };
            
                console.log(data);
                console.log('GET POSTS SUCCESSFULLY:');
                res.status(200).json({ message: 'Successfully get user', data: data });
            } else {
                console.log('Status: 400 , NOT Found user:');
                res.status(400).json({ message: 'NOT Found user' });
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



router.get('/getAllByUser/:target_id/:user_id', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET IMAGE INTERACT WITH THAT USER ALL');
    console.log('======================');

    const { target_id, user_id } = req.params;
    console.log(target_id + " " + user_id);
    const conn = await getConnection();

    if (conn) {
        console.log('Database connection established.');
        try {
            let query = `
                SELECT posts.*, users.username, users.image_url AS user_image, 
                images.url AS image_url, videos.url AS video_url
                FROM posts
                LEFT JOIN users ON posts.user_id = users.user_id
                LEFT JOIN images ON posts.post_id = images.post_id
                LEFT JOIN videos ON posts.post_id = videos.post_id
                WHERE users.user_id = ?
                ORDER BY posts.create_at DESC
            `;

            const rows = await conn.query(query, [target_id]);
            let sumLikes = 0;

            console.log(rows);
            if (rows.length > 0) {
                // สร้างอ็อบเจ็กต์เพื่อนำไปเก็บข้อมูลโพสต์
                const postsMap = {};

                // ประมวลผลโพสต์ที่มีการกดไลก์เยอะที่สุด
                const processPosts = (rows) => {
                    rows.forEach(item => {
                        const postId = item.post_id;

                        // ตรวจสอบว่าโพสต์นี้มีอยู่ใน postsMap หรือไม่
                        if (!postsMap[postId]) {
                            postsMap[postId] = {
                                post_id: postId,
                                username: item.username,
                                user_image: item.user_image,
                                title: item.title,
                                user_id: item.user_id,
                                type: item.type,
                                tag: item.tag,
                                created_at: item.create_at,
                                content: [], // สร้างอาเรย์สำหรับเก็บ URL ของภาพ
                                likes: 0,
                                dislikes: 0,
                                comments: 0,
                                status: 0
                            };
                        }

                        // เพิ่ม URL ของภาพหรือวิดีโอสำหรับโพสต์นี้
                        if (item.image_url) {
                            postsMap[postId].content.push(item.image_url);
                        } else if (item.video_url) {
                            postsMap[postId].content.push(item.video_url);
                        }
                    });
                };

                // ประมวลผลโพสต์จาก rows
                processPosts(rows);

                // คำนวณค่าคะแนน
                await Promise.all(Object.keys(postsMap).map(async (postId) => {
                    const likesQuery = `
                        SELECT COUNT(*) as likes
                        FROM post_interaction
                        WHERE post_id = ? AND status = ${POST_INTERACTION_LIKE}
                    `;
                    const [likesResult] = await conn.query(likesQuery, [postId]);
                    const likes = likesResult.likes;

                    const dislikesQuery = `
                        SELECT COUNT(*) as dislikes
                        FROM post_interaction
                        WHERE post_id = ? AND status = ${POST_INTERACTION_DISLIKE}
                    `;
                    const [dislikesResult] = await conn.query(dislikesQuery, [postId]);
                    const dislikes = dislikesResult.dislikes;

                    const commentsQuery = `
                        SELECT COUNT(*) as comments
                        FROM comments
                        WHERE post_id = ?
                    `;
                    const [commentsResult] = await conn.query(commentsQuery, [postId]);
                    const comments = commentsResult.comments;

                    const interactionsQuery = QUERY_INTERACTION_POST;
                    const interactionsResult = await conn.query(interactionsQuery, [postId, user_id]);
                    let status = 0;
                    if (interactionsResult[0]) {
                        status = interactionsResult[0].status;
                    }
        
                    // บันทึกค่าคะแนนลงใน postsMap
                    postsMap[postId].likes = parseInt(likes);
                    postsMap[postId].dislikes = parseInt(dislikes);
                    postsMap[postId].comments = parseInt(comments);
                    postsMap[postId].status = status;

                    sumLikes += parseInt(likes);
                }));
                const posts =  Object.values(postsMap)
                posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
           
                const followQuery = `
                SELECT COUNT(*) as follows
                FROM follows
                WHERE followed_user_id = ?
            `;
            const followResult = await conn.query(followQuery, [target_id]);
            sumFollows = parseInt(followResult[0].follows);
                const data = {
                    posts: posts,
                    sumLikes: sumLikes,
                    follow: sumFollows// Assuming follow logic will be implemented elsewhere
                };

                console.log(data);
                console.log('GET POSTS SUCCESSFULLY:');
                res.status(200).json({ message: 'Successfully get user', data: data });
            } else {
                console.log('Status: 400, NOT Found user:');
                res.status(400).json({ message: 'NOT Found user' });
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