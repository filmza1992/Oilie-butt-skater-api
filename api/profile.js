const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const getConnection = require('../javascript/connect/connection');
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
            await conn.query(updateQuery, [username, birth_day, image_url, user_id]);
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
            let query = ` SELECT posts.*,users.username,users.image_url AS user_image, images.url AS image_url, videos.url AS video_url
                FROM posts
                LEFT JOIN users ON posts.user_id = users.user_id
                LEFT JOIN images ON posts.post_id = images.post_id
                LEFT JOIN videos ON posts.post_id = videos.post_id
                WHERE users.user_id = ?
                ORDER BY posts.create_at DESC
                `

            const rows = await conn.query(query, [user_id]);
            let sumLikes = 0;
            console.log(user_id);
            console.log(rows);
            if (rows.length > 0) {

                const posts = await Promise.all(rows.map(async (item) => {
                    const likesQuery = `
                        SELECT COUNT(*) as likes
                        FROM posts
                        JOIN post_interaction ON posts.post_id = post_interaction.post_id
                        WHERE posts.post_id = ? AND post_interaction.status = ${POST_INTERACTION_LIKE}
                    `;
                    const [likesResult] = await conn.query(likesQuery, [item.post_id]);
                    const likes = likesResult.likes;

                    const dislikesQuery = `
                        SELECT COUNT(*) as dislikes
                        FROM posts
                        JOIN post_interaction ON posts.post_id = post_interaction.post_id
                        WHERE posts.post_id = ? AND post_interaction.status = ${POST_INTERACTION_DISLIKE}
                    `;
                    const [dislikesResult] = await conn.query(dislikesQuery, [item.post_id]);
                    const dislikes = dislikesResult.dislikes;

                    const commentsQuery = `
                    SELECT COUNT(*) as comments
                    FROM posts
                    JOIN comments ON posts.post_id = comments.post_id
                    WHERE posts.post_id = ? 
                `;
                    const [commentsResult] = await conn.query(commentsQuery, [item.post_id]);
                    const comments = commentsResult.comments;

                    const interactionsQuery = `
                    SELECT * from post_interaction 
                    WHERE post_interaction.post_id = ? 
                    and post_interaction.user_id = ?
                `;

                    const interactionsResult = await conn.query(interactionsQuery, [item.post_id, user_id]);
                    let status = 0;

                    if (interactionsResult[0]) {
                        status = interactionsResult[0].status;
                    }

                    sumLikes += parseInt(likes);
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

                const data = {
                    posts: posts,
                    sumLikes: sumLikes,
                    follow: 0
                }
                console.log(data);
                console.log('GET POSTS SUCCESSFULY:');
                res.status(200).json({ message: 'Successfuly get user', data: data });
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