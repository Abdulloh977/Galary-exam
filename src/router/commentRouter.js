import express from 'express';
import commentCtrl from '../controller/commentCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

// Rasmga izoh qoldirish — token kerak
router.post('/comment/create', authMiddleware, commentCtrl.createComment);

// Bitta rasmga tegishli barcha izohlarni olish — token kerak emas
router.get('/comment/pin/:pinId', commentCtrl.getPinComments);

// Izohni o'chirish — token kerak (faqat egasi yoki admin)
router.delete('/comment/delete/:id', authMiddleware, commentCtrl.deleteComment);

export default router;
