const express = require('express');
const router = express.Router();
const { getConnection } = require('../javascript/connect/connection');
const { POST_TYPE_IMAGE, POST_TYPE_VIDEO, POST_INTERACTION_LIKE, POST_INTERACTION_DISLIKE, QUERY_ALL_POST, QUERY_LIKE_POST, QUERY_DISLIKE_POST, QUERY_COMMENT_POST, QUERY_INTERACTION_POST, QUERY_POPULAR_POST, QUERY_FOLLOWING_POST, QUERY_POST_ID } = require('../constant/post');
const { interfaceShowBody, interface, interfaceShowId } = require('./interface/operation');
const { exceptionDBQuery, exceptionError, exceptionEstablish } = require('./interface/exception');
const { responseMessageId, responseMessageAndData, responseMessage } = require('./interface/response');
const interfaceConnectDB = require('./interface/connect');
const { operationQuery } = require('./interface/operation');

router.get('/', async (req, res) => {
    const conn = await getConnection();
   
    try {
        let query = `SELECT * from posts`;
        operationQuery(query);
        const rows = await conn.query(query);
      
      if (rows.length > 0) {
        res.status(200).json({ data: rows });
      } else {
        res.status(404).json({ message: 'No posts found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }finally {
        if (conn){
            conn.release();
        }
    }
  });
router.post('/addPost', async (req, res) => {
    const { title, user_id, type, create_at, urls } = req.body;
    const body = { title, user_id, type, create_at, urls };
    interfaceShowBody("POST", "ADD POSTS", body);

    const tagPattern = /#[\wก-๙]+/g; // Regular expression to find tags (words that start with #)
    const tags = title.match(tagPattern) || [];
    const tagsString = tags.join(' '); // Join tags into a single string
    const conn = await getConnection();
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                let query = 'INSERT INTO  posts (title, user_id, type, tag, create_at) values (?, ?, ?, ?, ?)';
                operationQuery(query);
                const postResult = await conn.query(query, [title, user_id, type, tagsString, create_at]);
                const postId = postResult.insertId;

                if (POST_TYPE_IMAGE == type) {
                    const insertImageQuery = 'INSERT INTO images (post_id, url) values (?, ?)';
                    operationQuery(insertImageQuery);

                    const imageInsertPromises = urls.map(url => {
                        return conn.query(insertImageQuery, [postId, url]);
                    });
                    await Promise.all(imageInsertPromises); // รอให้แทรกรูปภาพทั้งหมดเสร็จ

                    console.log('Inserted Images Successfully');
                    responseMessageId(res, 'Post added successfully', postId);
                } else if (POST_TYPE_VIDEO == type) {
                    console.log('Inserted Video Successfuly');
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    }finally {
        if (conn){
            conn.release();
        }
    }

});

router.get('/getAll/:user_id', async (req, res) => {
   
    const { user_id } = req.params;
    interfaceShowId("GET","POST",user_id);

    const conn = await getConnection();
    if (conn) {
        interfaceConnectDB();
        try {
            let query = QUERY_ALL_POST;
            operationQuery(query);
            const rows = await conn.query(query);
            if (rows.length > 0) {

                const posts = await Promise.all(rows.map(async (item) => {
                    const likesQuery = QUERY_LIKE_POST;
                    operationQuery(likesQuery);
                    const [likesResult] = await conn.query(likesQuery, [item.post_id]);
                    const likes = likesResult.likes;

                    const dislikesQuery = QUERY_DISLIKE_POST;
                    operationQuery(dislikesQuery);
                    const [dislikesResult] = await conn.query(dislikesQuery, [item.post_id]);
                    const dislikes = dislikesResult.dislikes;

                    const commentsQuery = QUERY_COMMENT_POST;
                    operationQuery(commentsQuery);
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
                
                responseMessageAndData(res, 'Successfuly get user post', posts);
              
              } else {
                console.log('Status: 400 , NOT Found user:');
                res.status(400).json({ message: 'NOT Found user' });
            }
        } catch (err) {
            console.error('Database query error:', err);
            res.status(500).json({ message: 'Database query failed', error: err });
        }finally {
            if (conn){
                conn.release();
            }
        }
    } else {
        console.log('Failed to establish a database connection.');
        res.status(500).json({ message: 'Failed to establish a database connection' });
    }
});
router.get('/getByPostId/:postId/:userId', async (req, res) => {
    const { postId, userId } = req.params;
    const conn = await getConnection();

    interfaceShowId("GET", "POST BY POST ID", postId);
    
    try {
        // ดึงข้อมูลโพสต์
        let query = `
            SELECT posts.*, users.username, users.image_url AS user_image 
            FROM posts 
            LEFT JOIN users ON posts.user_id = users.user_id 
            WHERE posts.post_id = ?
            ORDER BY posts.create_at DESC;
        `;
        const postResult = await conn.query(query, [parseInt(postId)]);
        
        if (postResult.length === 0) {
            return res.status(404).json({ message: 'No posts found for this ID' });
        }

        const postsMap = {};

        const posts = await Promise.all(postResult.map(async (item) => {
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
            const interactionsResult = await conn.query(interactionsQuery, [item.post_id, userId]);
            let status = 0;
            if (interactionsResult[0]) {
                status = interactionsResult[0].status;
            }

            // สร้างอาร์เรย์เพื่อเก็บ content หลายรายการ
            const contentList = [];

            // ดึงข้อมูลรูปภาพที่เกี่ยวข้องกับโพสต์
            const imageQuery = `SELECT images.url AS image_url FROM images WHERE images.post_id = ?`;
            const imageResult = await conn.query(imageQuery, [item.post_id]);
            imageResult.forEach(image => {
                contentList.push(image.image_url);
            });

            // ดึงข้อมูลวิดีโอที่เกี่ยวข้องกับโพสต์
            const videoQuery = `SELECT videos.url AS video_url FROM videos WHERE videos.post_id = ?`;
            const videoResult = await conn.query(videoQuery, [item.post_id]);
            videoResult.forEach(video => {
                contentList.push(video.video_url);
            });

            postsMap[item.post_id] = {
                post_id: item.post_id,
                username: item.username,
                user_image: item.user_image,
                title: item.title,
                user_id: item.user_id,
                type: item.type,
                tag: item.tag,
                created_at: item.create_at,
                content: contentList,  // เปลี่ยนจาก string เป็น list of strings
                likes: parseInt(likes),
                dislikes: parseInt(dislikes),
                comments: parseInt(comments),
                status: status ?? 0
            };

            return postsMap[item.post_id];
        }));

        const postsArray = Object.values(postsMap);

        responseMessageAndData(res, 'Successfuly get user post', postsArray);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        if (conn) {
            conn.release();
        }
    }
});


  
  router.get('/feed/:user_id', async (req, res) => {
    const { user_id } = req.params;
    interfaceShowId("GET", "POST FEED ALL", user_id);

    const conn = await getConnection();

    if (conn) {
        interfaceConnectDB();
        try {
            // Query 1: โพสต์ที่มีการกดไลก์เยอะที่สุด
            const popularPostsQuery = QUERY_POPULAR_POST;
            operationQuery(popularPostsQuery);
            const rowsPopular = await conn.query(popularPostsQuery, [user_id, user_id]);

            // Query 2: โพสต์ของผู้ใช้ที่ติดตาม
            const followingPostsQuery = QUERY_FOLLOWING_POST;
            operationQuery(followingPostsQuery);
            const rowsFollowing = await conn.query(followingPostsQuery, [user_id, user_id]);

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

                    // เพิ่ม URL ของภาพสำหรับโพสต์นี้
                    if (item.image_url) {
                        postsMap[postId].content.push(item.image_url);
                    } else if (item.video_url) {
                        postsMap[postId].content.push(item.video_url);
                    }
                });
            };

            // ประมวลผลโพสต์จากทั้งสอง query
            processPosts(rowsPopular);
            processPosts(rowsFollowing);

            // เพิ่มจำนวน Likes, Dislikes, Comments และ Status
            await Promise.all(Object.keys(postsMap).map(async (postId) => {
                const likesQuery = QUERY_LIKE_POST;
                const [likesResult] = await conn.query(likesQuery, [postId]);
                postsMap[postId].likes += Number(likesResult.likes || 0); // ใช้ Number แทน parseInt

                const dislikesQuery = QUERY_DISLIKE_POST;
                const [dislikesResult] = await conn.query(dislikesQuery, [postId]);
                postsMap[postId].dislikes += Number(dislikesResult.dislikes || 0); // ใช้ Number แทน parseInt

                const commentsQuery = QUERY_COMMENT_POST;
                const [commentsResult] = await conn.query(commentsQuery, [postId]);
                postsMap[postId].comments += Number(commentsResult.comments || 0); // ใช้ Number แทน parseInt

                const interactionsQuery = QUERY_INTERACTION_POST;
                const interactionsResult = await conn.query(interactionsQuery, [postId, user_id]);
                if (interactionsResult[0]) {
                    postsMap[postId].status = interactionsResult[0].status;
                }
            }));

            // เปลี่ยน postsMap เป็น array
            const popularPosts = Object.values(postsMap).filter(post => rowsPopular.some(item => item.post_id === post.post_id));
            const followingPosts = Object.values(postsMap).filter(post => rowsFollowing.some(item => item.post_id === post.post_id));
            followingPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            popularPosts.sort((a, b) => new Date(b.likes) - new Date(a.likes));

            // รวมผลลัพธ์จาก popularPosts และ followingPosts โดยใช้ฟังก์ชัน shuffleWithPriority
            const mixedPosts = shuffleWithPriority(followingPosts, popularPosts);

            // ส่งผลลัพธ์กลับไปยังผู้ใช้
            responseMessageAndData(res, 'Get Feed Successfully', mixedPosts);

        } catch (err) {
            exceptionDBQuery(err, res);
        } finally {
            if (conn) {
                conn.release();
            }
        }
    } else {
        exceptionEstablish(err, res);
    }
});




function shuffleWithPriority(followingPosts, popularPosts) {
    let result = [];
    let followingIndex = 0;
    let popularIndex = 0;

    const followingCount = followingPosts.length;
    const popularCount = popularPosts.length;
    console.log(followingCount);
    console.log(popularCount);

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
    const { user_id, post_id, notify, status, create_at } = req.body;
    const body = { user_id, post_id, notify, status, create_at };
    interfaceShowBody("PUT","UPDATE POST INTERACTION",body);

    const conn = await getConnection();
    if (conn) {
        interfaceConnectDB();
        try {
            // Check if the chat room exists
            let query = `SELECT * from post_interaction where post_id = ${post_id} and user_id = '${user_id}'`;
            operationQuery(query);
            const rows = await conn.query(query);
            console.log(rows);
            if (rows.length == 0) {

                let insertQuery = `INSERT INTO  post_interaction (user_id, post_id, status, notify, create_at) values (?, ?, ?, ?, ?)`;
                operationQuery(insertQuery);
                const result = await conn.query(insertQuery, [user_id, post_id, status, notify, create_at]);
                console.log('INSERT POSTSINTERACTION  SUCCESSFULY:');
                responseMessage(res, 'Messages insert successfully');
            } else {
                let updateQuery = `UPDATE post_interaction 
                       SET status = ?
                       WHERE user_id = ? AND post_id = ?`;
                operationQuery(updateQuery);
               
                const result = await conn.query(updateQuery, [status, user_id, post_id]);
                console.log('UPDATE POSTSINTERACTION  SUCCESSFULY:');
                responseMessage(res, 'Messages update successfully');
            }

        } catch (error) {
           exceptionDBQuery(err, res);
        }finally {
            if (conn){
                conn.release();
            }
        }
    }
});

router.post('/delete', async (req, res) => {
    const { post_id, user_id } = req.body;
    const body = { post_id, user_id };
    interfaceShowBody("POST", "DELETE POST", body);

    const conn = await getConnection();
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                // ตรวจสอบว่า post มีอยู่และเป็นของ user ที่ต้องการลบ
                let query = 'SELECT * FROM posts WHERE post_id = ? AND user_id = ?';
                operationQuery(query);
                const postResult = await conn.query(query, [post_id, user_id]);

                if (postResult.length === 0) {
                    return responseError(res, 'Post not found or unauthorized', 404);
                }

                // ลบไฟล์ที่เกี่ยวข้องกับโพสต์ก่อน เช่น ภาพหรือวิดีโอ
                if (postResult[0].type === POST_TYPE_IMAGE) {
                    query = 'DELETE FROM images WHERE post_id = ?';
                    operationQuery(query);
                    await conn.query(query, [post_id]);
                    console.log('Deleted associated images');
                } else if (postResult[0].type === POST_TYPE_VIDEO) {
                    query = 'DELETE FROM videos WHERE post_id = ?';
                    operationQuery(query);
                    await conn.query(query, [post_id]);
                    console.log('Deleted associated videos');
                }

                // ลบ interactions ที่เกี่ยวข้องกับโพสต์
                query = 'DELETE FROM comments WHERE post_id = ?';
                operationQuery(query);
                await conn.query(query, [post_id]);
                console.log('Deleted associated comments');

                query = 'DELETE FROM post_interaction WHERE post_id = ?';
                operationQuery(query);
                await conn.query(query, [post_id]);
                console.log('Deleted associated interactions');

                // ลบโพสต์
                query = 'DELETE FROM posts WHERE post_id = ? AND user_id = ?';
                operationQuery(query);
                await conn.query(query, [post_id, user_id]);

                console.log('Deleted Post Successfully');
                responseMessage(res, 'Post deleted successfully');
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});

router.put('/update/:postId', async (req, res) => {
    const { title, user_id } = req.body;
    const { postId } = req.params;

    const body = { title, user_id, postId };
    interfaceShowBody("PUT", "UPDATE POST", body);

    const tagPattern = /#[\wก-๙]+/g; // Regular expression to find tags (words that start with #)
    const tags = title.match(tagPattern) || [];
    const tagsString = tags.join(' '); // Join tags into a single string

    const conn = await getConnection();
    try {
        if (conn) {
            interfaceConnectDB();
            try {
                // ตรวจสอบก่อนว่า user_id ตรงกับเจ้าของโพสต์หรือไม่
                let checkQuery = 'SELECT * FROM posts WHERE post_id = ? AND user_id = ?';
                operationQuery(checkQuery);
                const checkResult = await conn.query(checkQuery, [postId, user_id]);

                if (checkResult.length > 0) {
                    // Update ข้อมูล title และ tag
                    let updateQuery = 'UPDATE posts SET title = ?, tag = ? WHERE post_id = ?';
                    operationQuery(updateQuery);
                    const updateResult = await conn.query(updateQuery, [title, tagsString, postId]);

                    console.log('Post updated successfully');
                    responseMessage(res, 'Post updated successfully');
                } else {
                    console.log('Post not found or not authorized');
                    responseMessage(res, 'Post not found or not authorized', 404);
                }
            } catch (err) {
                exceptionDBQuery(err, res);
            }
        } else {
            exceptionEstablish(err, res);
        }
    } catch (err) {
        exceptionError(err, res);
    } finally {
        if (conn) {
            conn.release();
        }
    }
});


module.exports = router;
