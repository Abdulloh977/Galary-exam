import express from 'express';
import chatCtrl from '../controller/chatCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

// Barcha suhbatdoshlar ro'yxati — MUHIM: /chat/:userId dan OLDIN yozilishi shart!
router.get('/chat/conversations', authMiddleware, chatCtrl.getConversationsList);

// Ikki foydalanuvchi orasidagi suhbat tarixi
router.get('/chat/:userId', authMiddleware, chatCtrl.getConversation);

// Xabar yuborish (REST orqali)
router.post('/chat/send', authMiddleware, chatCtrl.sendMessage);

// Rasm orqali xabar yuborish
router.post('/chat/send-image', authMiddleware, chatCtrl.sendImageMessage);

// Xabarni o'chirish
router.delete('/chat/message/:id', authMiddleware, chatCtrl.deleteMessage);

export default router;