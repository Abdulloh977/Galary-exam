import express from 'express';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';


dotenv.config();

import authRouter from './src/router/authRouter.js';
import userRouter from './src/router/userRouter.js';
import pinRouter from './src/router/pinRouter.js';
import boardRouter from './src/router/boardRouter.js';
import commentRouter from './src/router/commentRouter.js';


const app = express();
const PORT = process.env.PORT;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/public', express.static('src/public')); // yuklangan rasmlarni ko'rsatish uchun

app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', pinRouter);
app.use('/api', boardRouter);
app.use('/api', commentRouter);

io.on('connection', (socket) => {
    socket.on('disconnect', () => { });
});

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        httpServer.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    })
    .catch(error => {
        console.log(error);
    });