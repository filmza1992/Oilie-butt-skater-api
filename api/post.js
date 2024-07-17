const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');
const { POST_TYPE_IMAGE, POST_TYPE_VIDEO, POST_INTERACTION_LIKE, POST_INTERACTION_DISLIKE } = require('../constant/post');

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
                if (POST_TYPE_IMAGE == type) {
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

router.get('/getAll/', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET POST ALL');
    console.log('======================');


    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');

        try {
            let query = 'SELECT posts.*,users.username,users.image_url AS user_image, images.url AS image_url, videos.url AS video_url FROM posts LEFT JOIN users ON posts.user_id = users.user_id LEFT JOIN images ON posts.post_id = images.post_id LEFT JOIN videos ON posts.post_id = videos.post_id'

            const rows = await conn.query(query);
            console.log(rows);

            if (rows.length > 0) {
                
                const posts =await Promise.all(rows.map(async (item) => {
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
                        comments: parseInt(comments)
                    };
                }));
                console.log(posts);
                console.log('GET POSTS SUCCESSFULY:');
                res.status(200).json({ message: 'Successfuly get user' ,data:posts});
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
