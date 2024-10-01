
const express = require('express');
const { initializeApp } = require('firebase/app');
const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const chatRouter = require('./api/chat');
const postRouter = require('./api/post');
const profileRouter = require('./api/profile');
const searchRouter = require('./api/search');
const followRouter = require('./api/follow');
const firebaseConfig = require('./firebaseConfig'); 
const app = express();

initializeApp(firebaseConfig);

app.use(express.json());
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/chat', chatRouter);
app.use('/post', postRouter);
app.use('/profile', profileRouter);
app.use('/search', searchRouter);
app.use('/follow', followRouter);

module.exports = app;