const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');
const { POST_TYPE_IMAGE, POST_TYPE_VIDEO, POST_INTERACTION_LIKE, POST_INTERACTION_DISLIKE, QUERY_ALL_POST, QUERY_LIKE_POST, QUERY_DISLIKE_POST, QUERY_COMMENT_POST, QUERY_INTERACTION_POST, QUERY_POPULAR_POST, QUERY_FOLLOWING_POST } = require('../constant/post');

router.post('/addPost', async (req, res) => {
    const { title, user_id, type, create_at, url } = req.body;
    console.log(req.body);

    const tagPattern = /#[\wก-๙]+/g; // Regular expression to find tags (words that start with #)
    const tags = title.match(tagPattern) || [];
    const tagsString = tags.join(' '); // Join tags into a single string
    try {
        const conn = await getConnection();
        if (conn) {
            console.log('Database connection established.');
            try {
                let query = 'INSERT INTO  posts (title, user_id, type, tag, create_at) values (?, ?, ?, ?, ?)';
                const postResult = await conn.query(query, [title, user_id, type, tagsString, create_at]);
                const postId = postResult.insertId;
                console.log(POST_TYPE_IMAGE);
                if (POST_TYPE_IMAGE == type) {
                    console.log("image");
                    query = 'INSERT INTO  images (post_id, url) values (?, ?)';

                    const result = await conn.query(query, [postId, url]);
                    console.log('Inserted image:', result);
                    res.status(200).json({ message: 'Post added successfully' + postId })
                } else if (POST_TYPE_VIDEO == type) {

                }

            } catch (err) {
                res.status(500).json({ message: 'Database query failed', error: err });
            }

        } else {
            console.log('Failed to establish a database connection.');
            res.status(500).json({ message: 'Failed to establish a database connection' });
        }
    } catch (err) {
        console.error('Error :', err);
        res.status(400).json({ message: 'Error ', error: err });
    }

});

router.get('/getAll/:user_id', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET POST ALL');
    console.log('======================');

    const { user_id } = req.params;
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            let query = QUERY_ALL_POST;
            const rows = await conn.query(query);
            if (rows.length > 0) {

                const posts = await Promise.all(rows.map(async (item) => {
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
                console.log('GET POSTS SUCCESSFULY:');
                res.status(200).json({ message: 'Successfuly get user', data: posts });
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
router.get('/feed/:user_id', async (req, res) => {
    const {user_id} = req.params;
    console.log(user_id);
    const conn = await getConnection();
    
    console.log('======================');
    console.log('API ROUTE GET POST FEED ALL');
    console.log('======================');
    if (conn) {
        console.log('Database connection established.');
        try {
            // Query 1: โพสต์ที่มีการกดไลก์เยอะที่สุด
            const popularPostsQuery = QUERY_POPULAR_POST;
            const rowsPopular = await conn.query(popularPostsQuery, [user_id,user_id]);
            //console.log(rowsPopular);
            // Query 2: โพสต์ของผู้ใช้ที่ติดตาม
            const followingPostsQuery = QUERY_FOLLOWING_POST;
            const rowsFollowing  = await conn.query(followingPostsQuery, [user_id,user_id]);
            //console.log(rowFollowing);
            // รวมผลลัพธ์จากทั้งสอง query
            const mixedPosts = shuffleWithPriority(rowsFollowing, rowsPopular);


            const posts = await Promise.all(mixedPosts.map(async (item) => {
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
            res.status(200).json({ data: posts});
            
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
});function shuffleWithPriority(followingPosts, popularPosts) {
    let result = [];
    let followingIndex = 0;
    let popularIndex = 0;
    
    const followingCount = followingPosts.length;
    const popularCount = popularPosts.length;
    
    // สัดส่วนที่ต้องการแสดงโพสต์จาก following มากกว่า popular
    const followPriority = 2;  // กำหนดให้โพสต์จาก following แสดงมากกว่า popular (แสดง following 3 โพสต์ต่อ 1 โพสต์ popular)
    
    while (followingIndex < followingCount || popularIndex < popularCount) {
        // แทรกโพสต์จาก following ตาม priority ที่กำหนด
        for (let i = 0; i < followPriority && followingIndex < followingCount; i++) {
            result.push(followingPosts[followingIndex]);
            followingIndex++;
        }

        // แทรกโพสต์จาก popular หนึ่งครั้งหลังจากแทรก following ครบตามที่กำหนด
        if (popularIndex < popularCount) {
            result.push(popularPosts[popularIndex]);
            popularIndex++;
        }
    }
    
    return result;
}



router.put('/interaction/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE UPDATE POST INTERACTION');
    console.log('======================');

    const { user_id, post_id, notify, status,create_at } = req.body;
    console.log(user_id);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // Check if the chat room exists
            let query = `SELECT * from post_interaction where post_id = ${post_id} and user_id = '${user_id}'`;
            const rows = await conn.query(query);
            console.log(rows);
            if (rows.length == 0) {

                let insertQuery = `INSERT INTO  post_interaction (user_id, post_id, status, notify, create_at) values (?, ?, ?, ?, ?)`;

                const result = await conn.query(insertQuery, [user_id, post_id, status, notify, create_at]);
                console.log('INSERT POSTSINTERACTION  SUCCESSFULY:');
                return res.status(200).json({ message: 'Messages insert successfully' });
            } else {
                let updateQuery = `UPDATE post_interaction 
                       SET status = ?
                       WHERE user_id = ? AND post_id = ?`;

                const result = await conn.query(updateQuery, [status, user_id, post_id]);
                console.log('UPDATE POSTSINTERACTION  SUCCESSFULY:');
                res.status(200).json({ message: 'Messages update successfully' });
            }

        } catch (error) {
            console.error('Error updating messages:', error);
            return res.status(500).json({ error: 'Failed to update messages' });
        }
    }
});
module.exports = router;
