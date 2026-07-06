import Chat from "../model/chatModel.js";

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