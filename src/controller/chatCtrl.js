import Chat from "../model/chatModel.js";
import User from "../model/userModel.js";
import { uploadToImgBB } from "../utils/imgbb.js";

const chatCtrl = {

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

    sendImageMessage: async (req, res) => {
        try {
            const { receiverId, text } = req.body;

            if (!receiverId) {
                return res.status(400).json({ message: "Qabul qiluvchi kiritilishi shart!" });
            }

            if (!req.files || !req.files.image) {
                return res.status(400).json({ message: "Rasm fayli yuklanishi shart!" });
            }

            const [sender, receiver] = await Promise.all([
                User.findById(req.user.id).select("blockedUsers"),
                User.findById(receiverId).select("blockedUsers")
            ]);

            const isBlocked =
                (sender && sender.blockedUsers.some(id => id.toString() === receiverId)) ||
                (receiver && receiver.blockedUsers.some(id => id.toString() === req.user.id));

            if (isBlocked) {
                return res.status(403).json({ message: "Xabar yuborib bo'lmaydi — bloklangan!" });
            }

            const file = req.files.image;

            const permanentImageUrl = await uploadToImgBB(file);

            const newMessage = await Chat.create({
                sender: req.user.id,
                receiver: receiverId,
                text: text || "",
                imageUrl: permanentImageUrl
            });

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

    updateMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const { text } = req.body;

            if (!text || text.trim() === "") {
                return res.status(400).json({ message: "Xabar matni bo'sh bo'lishi mumkin emas!" });
            }

            const message = await Chat.findById(id);
            if (!message) {
                return res.status(404).json({ message: "Xabar topilmadi!" });
            }

            if (message.sender.toString() !== req.user.id) {
                return res.status(403).json({ message: "Siz faqat o'zingiz yuborgan xabarni tahrirlashingiz mumkin!" });
            }

            message.text = text.trim();
            message.edited = true;
            await message.save();

            const io = req.app.get("io");
            const onlineUsers = req.app.get("onlineUsers");
            if (io && onlineUsers) {
                const receiverSocketId = onlineUsers.get(message.receiver.toString());
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("messageUpdated", message);
                }
            }

            res.status(200).json({ message: "Xabar yangilandi!", data: message });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

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

            const receiverId = message.receiver.toString();
            await Chat.findByIdAndDelete(id);

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