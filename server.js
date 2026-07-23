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
import chatRouter from './src/router/chatRouter.js';
import contactRouter from './src/router/contactRouter.js';
import Chat from './src/model/chatModel.js';


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
app.use('/api', chatRouter);
app.use('/api', contactRouter);

// Onlayn foydalanuvchilarni saqlab turish uchun: { userId: socketId }
const onlineUsers = new Map();

// REST controllerlar ham (masalan rasm xabar yuborilganda) real vaqtda
// signal yubora olishi uchun io va onlineUsers'ni app orqali ulashamiz
app.set("io", io);
app.set("onlineUsers", onlineUsers);

const broadcastOnlineUsers = () => {
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
};

io.on('connection', (socket) => {
    // Foydalanuvchi saytga kirganda, o'z ID'sini socket bilan bog'laydi
    socket.on('addUser', (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        broadcastOnlineUsers();
    });

    // Yangi xabar yuborilganda
    socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
        try {
            // Xabarni ma'lumotlar bazasiga saqlaymiz
            const newMessage = await Chat.create({
                sender: senderId,
                receiver: receiverId,
                text
            });

            // Agar qabul qiluvchi hozir onlayn bo'lsa — unga real vaqtda yuboramiz
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('getMessage', newMessage);
            }

            // Yuboruvchiga ham tasdiq sifatida qaytarib beramiz
            socket.emit('messageSent', newMessage);
        } catch (error) {
            socket.emit('messageError', { message: error.message });
        }
    });

    // Suhbat ochilganda, qarshi tomonning xabarlari "ko'rildi" deb belgilanadi
    socket.on('markSeen', async ({ viewerId, otherUserId }) => {
        try {
            await Chat.updateMany(
                { sender: otherUserId, receiver: viewerId, seen: false },
                { $set: { seen: true } }
            );

            const otherSocketId = onlineUsers.get(otherUserId);
            if (otherSocketId) {
                io.to(otherSocketId).emit('messagesSeen', { by: viewerId });
            }
        } catch (error) {
            console.error("markSeen xatosi:", error.message);
        }
    });

    // --- Ovozli / videoqo'ng'iroq signalizatsiyasi (WebRTC, oddiy peer-to-peer) ---
    socket.on('callUser', ({ to, from, offer, callType, callerInfo }) => {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('incomingCall', { from, offer, callType, callerInfo });
        } else {
            socket.emit('callFailed', { reason: 'offline' });
        }
    });

    socket.on('answerCall', ({ to, answer }) => {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('callAccepted', { answer });
        }
    });

    socket.on('rejectCall', ({ to }) => {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('callRejected');
        }
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('iceCandidate', { candidate });
        }
    });

    socket.on('endCall', ({ to }) => {
        const targetSocketId = onlineUsers.get(to);
        if (targetSocketId) {
            io.to(targetSocketId).emit('callEnded');
        }
    });

    socket.on('disconnect', () => {
        // Uzilgan foydalanuvchini ro'yxatdan olib tashlaymiz
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        broadcastOnlineUsers();
    });
});

const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(() => {
        httpServer.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    })
    .catch(error => {
        console.log(error);
    });