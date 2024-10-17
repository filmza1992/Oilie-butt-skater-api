const { v4 } = require('uuid');
const express = require('express');
const bcrypt = require('bcrypt');

const { getConnection } = require('../javascript/connect/connection');
const { interfaceMessage, interfaceShowBody, operationQuery } = require('./interface/operation');
const interfaceConnectDB = require('./interface/connect');
const { exceptionCredentials, exceptionDBQuery, exceptionError } = require('./interface/exception');
const { responseMessage, responseMessageId } = require('./interface/response');
const router = express.Router();
const uuidv4 = v4;
const saltRounds = 10;

// Login endpoint
router.post('/login', async (req, res) => {

  const { email, password } = req.body;
  interfaceShowBody("POST", "LOGIN", { email, password });

  const conn = await getConnection();
  if (conn) {
    interfaceConnectDB();

    try {
      const query = 'SELECT * FROM users WHERE  email = ? ';
      operationQuery(query);
      const rows = await conn.query(query, [email]);

      if (rows.length > 0) {
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          console.log('Login successful:', user);
          res.status(200).json({ message: 'Login successful', data: user });
        } else {
          exceptionCredentials(res);
        }
      } else {
        exceptionCredentials(res);
      }
    } catch (err) {
      exceptionDBQuery(err, res);
    } finally {
      if (conn) {
        conn.release();
      }
    }
  } else {
    exceptionError(err, res);
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  const { email, password, username, birth_day, image_url } = req.body;
  
  const body = { email, password, username, birth_day, image_url } ;
  interfaceShowBody("POST", "SIGNUP", body);

  try {
    const id = uuidv4();

    const create_at = Date.now();
    console.log(password);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Received signup data:', { id, email, hashedPassword, username, birth_day, image_url, create_at });

    const conn = await getConnection();
    if (conn) {
      interfaceConnectDB();
      try {
        const query = 'SELECT * FROM users where email = ?';
        operationQuery(query);
               
        const result = await conn.query(query, [email]);
        if (result.length > 0) {
          res.status(500).json({ message: 'Email is exist : ' + email });
          console.log('EMAIL IS EXIST:' + email);
          return;
        }
      } catch (err) {
        exceptionDBQuery(err, res);
      }
      try {
        const query = 'INSERT INTO users (user_id, email, password, username, birth_day, image_url, create_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        operationQuery(query);

        const result = await conn.query(query, [id, email, hashedPassword, username, birth_day, image_url, create_at]);

        responseMessageId(res, 'Signup successful', id);
        } catch (err) {
          exceptionDBQuery(err, res);   
        } finally {
        if (conn) await conn.close();
      }
    } else {
      exceptionEstablish(err, res);  }
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).json({ message: 'Error hashing password', error: err });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});


module.exports = router;
