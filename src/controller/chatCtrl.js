import Chat from "../model/chatModel.js";
import fs from "fs";
import path from "path";

const chatCtrl = {
    // Xabar yuborish (REST orqali, zaxira sifatida — asosiysi Socket.io orqali ishlaydi)
    sendMessage: async (req, res) => {
        try {
            const { receiverId, text } = req.body;

            if (!receiverId || !text) {
                return res.status(400).json({ message: "Qabul qiluvchi va matn kiritilishi shart!" });
            }

            const newMessage = await Chat.create({
                sender: req.user.id,
                receiver: receiverId,
                text
            });

            res.status(201).json({ message: "Xabar yuborildi!", data: newMessage });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Rasm (fayl) orqali xabar yuborish
    sendImageMessage: async (req, res) => {
        try {
            const { receiverId, text } = req.body;

            if (!receiverId) {
                return res.status(400).json({ message: "Qabul qiluvchi kiritilishi shart!" });
            }

            if (!req.files || !req.files.image) {
                return res.status(400).json({ message: "Rasm fayli yuklanishi shart!" });
            }

            const file = req.files.image;

            const ext = path.extname(file.name);
            const baseName = path.basename(file.name, ext)
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9_-]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
            const safeName = baseName ? `${baseName}${ext}` : `chat-image${ext}`;

            const fileName = `${Date.now()}_${safeName}`;
            const uploadPath = path.join("src", "public", fileName);
            await file.mv(uploadPath);

            const newMessage = await Chat.create({
                sender: req.user.id,
                receiver: receiverId,
                text: text || "",
                imageUrl: fileName
            });

            // Agar qabul qiluvchi onlayn bo'lsa, real vaqtda darhol yetkazamiz
            const io = req.app.get("io");
            const onlineUsers = req.app.get("onlineUsers");
            if (io && onlineUsers) {
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("getMessage", newMessage);
                }
            }

            res.status(201).json({ message: "Rasm yuborildi!", data: newMessage });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Xabarni o'chirish — faqat yuboruvchi o'chira oladi
    deleteMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const message = await Chat.findById(id);

            if (!message) {
                return res.status(404).json({ message: "Xabar topilmadi!" });
            }

            if (message.sender.toString() !== req.user.id) {
                return res.status(403).json({ message: "Siz faqat o'zingiz yuborgan xabarni o'chira olasiz!" });
            }

            if (message.imageUrl) {
                const imgPath = path.join("src", "public", message.imageUrl);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                }
            }

            const receiverId = message.receiver.toString();
            await Chat.findByIdAndDelete(id);

            // Qabul qiluvchi onlayn bo'lsa, unga ham real vaqtda bildiramiz
            const io = req.app.get("io");
            const onlineUsers = req.app.get("onlineUsers");
            if (io && onlineUsers) {
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
                }
            }

            res.status(200).json({ message: "Xabar o'chirildi!" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    
    // Ikki foydalanuvchi orasidagi suhbat tarixini olish
    getConversation: async (req, res) => {
        try {
            const myId = req.user.id;
            const { userId } = req.params;

            const messages = await Chat.find({
                $or: [
                    { sender: myId, receiver: userId },
                    { sender: userId, receiver: myId }
                ]
            }).sort({ createdAt: 1 });

            res.status(200).json({ messages });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },


    // Foydalanuvchining barcha suhbatdoshlari ro'yxati (chap paneldagi chat ro'yxati uchun)
    getConversationsList: async (req, res) => {
        try {
            const myId = req.user.id;

            const messages = await Chat.find({
                $or: [{ sender: myId }, { receiver: myId }]
            }).sort({ createdAt: -1 });

            const seenUsers = new Set();
            const conversations = [];

            for (const msg of messages) {
                const otherUserId = msg.sender.toString() === myId ? msg.receiver.toString() : msg.sender.toString();

                if (!seenUsers.has(otherUserId)) {
                    seenUsers.add(otherUserId);
                    conversations.push({
                        userId: otherUserId,
                        lastMessage: msg.text,
                        createdAt: msg.createdAt
                    });
                }
            }

            res.status(200).json({ conversations });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default chatCtrl;