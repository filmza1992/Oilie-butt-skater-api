const { Query } = require("firebase-admin/firestore");

POST_TYPE_IMAGE = 1;
POST_TYPE_VIDEO = 2;

POST_INTERACTION_LIKE = 1;
POST_INTERACTION_DISLIKE = -1;

QUERY_ALL_POST = `
                SELECT posts.*, users.username, users.image_url AS user_image, images.url AS image_url, videos.url AS video_url 
                    FROM posts 
                    LEFT JOIN users ON posts.user_id = users.user_id 
                    LEFT JOIN images ON posts.post_id = images.post_id 
                    LEFT JOIN videos ON posts.post_id = videos.post_id
                    ORDER BY posts.create_at DESC
                `;
QUERY_POPULAR_POST = `
                SELECT posts.*, users.username, users.image_url AS user_image, images.url AS image_url, videos.url AS video_url,
                       COUNT(post_interaction.status) AS like_count
                FROM posts
                LEFT JOIN users ON posts.user_id = users.user_id
                LEFT JOIN images ON posts.post_id = images.post_id
                LEFT JOIN videos ON posts.post_id = videos.post_id
                LEFT JOIN post_interaction ON posts.post_id = post_interaction.post_id AND post_interaction.status = ${POST_INTERACTION_LIKE}
                WHERE posts.user_id NOT IN (
                    SELECT followed_user_id FROM follows WHERE following_user_id = ? 
                )
                and posts.user_id != ?
                GROUP BY posts.post_id
                ORDER BY like_count DESC
                LIMIT 10;
            `;

QUERY_FOLLOWING_POST = `
                SELECT posts.*, users.username, users.image_url AS user_image, images.url AS image_url, videos.url AS video_url
                FROM posts
                LEFT JOIN users ON posts.user_id = users.user_id
                LEFT JOIN images ON posts.post_id = images.post_id
                LEFT JOIN videos ON posts.post_id = videos.post_id
                WHERE posts.user_id IN (
                    SELECT followed_user_id FROM follows WHERE following_user_id = ?
                )
                or posts.user_id = ?
                ORDER BY posts.create_at DESC
                LIMIT 10;
            `;
QUERY_LIKE_POST = `
                    SELECT COUNT(*) as likes
                    FROM posts
                    JOIN post_interaction ON posts.post_id = post_interaction.post_id
                    WHERE posts.post_id = ? AND post_interaction.status = ${POST_INTERACTION_LIKE}
                `;

QUERY_DISLIKE_POST = `
                    SELECT COUNT(*) as dislikes
                    FROM posts
                    JOIN post_interaction ON posts.post_id = post_interaction.post_id
                    WHERE posts.post_id = ? AND post_interaction.status = ${POST_INTERACTION_DISLIKE}
                `;

QUERY_COMMENT_POST = `
                    SELECT COUNT(*) as comments
                    FROM posts
                    JOIN comments ON posts.post_id = comments.post_id
                    WHERE posts.post_id = ? 
                `;

QUERY_INTERACTION_POST = `
                    SELECT * from post_interaction 
                    WHERE post_interaction.post_id = ? 
                    and post_interaction.user_id = ?
                `;
    module.exports = {
        POST_TYPE_IMAGE: POST_TYPE_IMAGE,
        POST_TYPE_VIDEO: POST_TYPE_VIDEO,
        POST_INTERACTION_LIKE: POST_INTERACTION_LIKE,
        POST_INTERACTION_DISLIKE: POST_INTERACTION_DISLIKE,
        QUERY_ALL_POST: QUERY_ALL_POST,
        QUERY_LIKE_POST: QUERY_LIKE_POST,
        QUERY_DISLIKE_POST: QUERY_DISLIKE_POST,
        QUERY_COMMENT_POST: QUERY_COMMENT_POST,
        QUERY_INTERACTION_POST: QUERY_INTERACTION_POST,
        QUERY_POPULAR_POST: QUERY_POPULAR_POST,
        QUERY_FOLLOWING_POST: QUERY_FOLLOWING_POST
    };