const { v4 } = require('uuid');
const express = require('express');
const bcrypt = require('bcrypt');

const getConnection = require('../javascript/connect/connection');
const router = express.Router();
const uuidv4 = v4;
const saltRounds = 10;

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('======================');
  console.log('API ROUTE POST LOGIN');
  console.log('======================');

  const { email, password } = req.body;
  console.log('Received login data:', { email, password });

  const conn = await getConnection();
  if (conn) {
    console.log('Database connection established.');

    try {
      const query = 'SELECT * FROM users WHERE  email = ? ';
      const rows = await conn.query(query, [email]);

      if (rows.length > 0) {
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          console.log('Login successful:', user);
          res.status(200).json({ message: 'Login successful', data: user });
        } else {
          console.log('Login failed: Invalid credentials');
          res.status(401).json({ message: 'Invalid credentials' });
        }
      } else {
        console.log('Login failed: Invalid credentials');
        res.status(401).json({ message: 'Invalid credentials' });
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

// Signup endpoint
router.post('/signup', async (req, res) => {
  console.log('======================');
  console.log('API ROUTE POST SIGNUP');
  console.log('======================');


  try {
    const id = uuidv4();
    const { email, password, username, birth_day, image_url } = req.body;

    const create_at = Date.now();
    console.log(password);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Received signup data:', { id, email, hashedPassword, username, birth_day, image_url, create_at });

    const conn = await getConnection();
    if (conn) {
      console.log('Database connection established.');
      try {
        const query = 'SELECT * FROM users where email = ?';
        const result = await conn.query(query, [email]);
        if (result.length > 0) {
          res.status(500).json({ message: 'Email is exist : ' + email });
          console.log('EMAIL IS EXIST:'+ email);
          return;
        }
      } catch (err) {
        res.status(500).json({ message: 'Database query failed', error: err });
      }
      try {
        const query = 'INSERT INTO users (user_id, email, password, username, birth_day, image_url, create_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const result = await conn.query(query, [id, email, hashedPassword, username, birth_day, image_url, create_at]);

        console.log('Signup successful:');
        res.status(200).json({ message: 'Signup successful', userId: id });
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
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).json({ message: 'Error hashing password', error: err });
  }
});


module.exports = router;
