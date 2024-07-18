const express = require('express');
const router = express.Router();
const getConnection = require('../javascript/connect/connection');

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
                
            const rows = await conn.query(query,[user_id]);
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

module.exports = router;