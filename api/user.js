const express = require('express');
const bcrypt = require('bcrypt');

const getConnection = require('../javascript/connect/connection');
const router = express.Router();

router.get('/getByEmail/:email', async (req, res) => {
  console.log('======================');
  console.log('API ROUTE GET USER BY EMAIL');
  console.log('======================');

  const { email } = req.params;
  console.log('Received email:', email);

  const conn = await getConnection();
  if (conn) {
      console.log('Database connection established.');
      try {
          const query = 'SELECT * FROM users WHERE email = ?';
          const rows = await conn.query(query, [email]);
          if (rows.length > 0) {
              const user = rows[0];
              console.log('GET USER SUCCESSFULY:', user);
              res.status(200).json({ message: 'Successfully get user', data: user });
          } else {
              console.log('Status: 400, NOT Found user');
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
router.get('/getById/:user_id', async (req, res) => {
    console.log('======================');
    console.log('API ROUTE GET USER BY ID');
    console.log('======================');
  
    const { user_id } = req.params;
    console.log(req.params);
    console.log('Received login data:', { user_id });
  
    const conn = await getConnection();
    if (conn) {
      console.log('Database connection established.');
  
      try {
        const query = 'SELECT * FROM users WHERE user_id = ? ';
        const rows = await conn.query(query, [user_id]);
  
  
        if (rows.length > 0) {
            const user = rows[0];
            console.log('GET USER SUCCESSFULY:', user);
            res.status(200).json({ message: 'Successfuly get user', data: user });
        }else{
            console.log('Status: 400 , NOT Found user:');
            res.status(400).json({ message: 'NOT Found user'});
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