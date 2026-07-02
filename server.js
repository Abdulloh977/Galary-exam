import express from 'express';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';


dotenv.config();

import authRouter from './src/router/authRouter.js';


const app = express();
const PORT = process.env.PORT || 4005;

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

app.use('/api', authRouter);

io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
});

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        httpServer.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    })
    .catch(error => {
        console.log(error);
    });
