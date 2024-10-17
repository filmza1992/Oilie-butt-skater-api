
const express = require('express');
const { initializeApp } = require('firebase/app');
const authRouter = require('./api/auth');
const userRouter = require('./api/user');
const chatRouter = require('./api/chat');
const postRouter = require('./api/post');
const profileRouter = require('./api/profile');
const searchRouter = require('./api/search');
const followRouter = require('./api/follow');
const commentRouter = require('./api/comment');
const rankingRouter = require('./api/ranking');
const roomRouter = require('./api/room');
const notificationRouter = require('./api/notification');


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
app.use('/comment', commentRouter);
app.use('/ranking', rankingRouter);
app.use('/room', roomRouter);
app.use('/notification', notificationRouter);
module.exports = app;