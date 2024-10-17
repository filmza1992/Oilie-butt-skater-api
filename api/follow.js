const express = require('express');
const router = express.Router();
const {getConnection} = require('../javascript/connect/connection');

router.post('/following', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST FOLLOWING');
    console.log('======================');

    const { user_id, target_id, create_at, notify } = req.body;
    console.log(user_id + " " + target_id);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            let query = `INSERT INTO  follows (following_user_id, followed_user_id, create_at, notify) values ( ?, ?, ?, ?)
                `
            const rows = await conn.query(query, [user_id, target_id, create_at, notify]);
            console.log('POST FOLLOW SUCCESSFULY:');
            res.status(200).json({ message: 'Successfuly post follow' });

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


router.post('/unfollowing', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST UNFOLLOWING');
    console.log('======================');

    const { user_id, target_id } = req.body;
    console.log(user_id + " " + target_id);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            let query = `DELETE FROM follows WHERE following_user_id = ? AND followed_user_id = ?`
            const rows = await conn.query(query, [user_id, target_id]);
            console.log('POST DELETE FOLLOW SUCCESSFULY:');
            res.status(200).json({ message: 'Successfuly delete follow' });
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

router.post('/check/following', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE POST CHECK FOLLOWING');
    console.log('======================');

    const { user_id, target_id, room } = req.body;
    console.log(user_id + " " + target_id);
    const conn = await getConnection();
    if (conn) {
        console.log('Database connection established.');
        try {
            // Check if the user is already following the target
            let checkQuery = `
                SELECT * FROM follows 
                WHERE following_user_id = ? 
                AND followed_user_id = ?
            `;
            
            const rows  = await conn.query(checkQuery, [user_id, target_id]);

            if (rows.length > 0) {
                // If a follow record exists
                console.log('User is already following the target.');
                return res.status(200).json({ message: 'User is already following the target' , isFollower: true});
            } 
            console.log('POST FOLLOW SUCCESSFULY: '+room);
            res.status(200).json({ message: 'User is not already following the target', isFollower: false });

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
module.exports = router;