
const express = require('express');
const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/user', userRouter);

module.exports = app;