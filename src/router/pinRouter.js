import express from 'express';
import pinCtrl from '../controller/pinCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

// Yangi rasm (pin) yuklash — token kerak
router.post('/pin/create', authMiddleware, pinCtrl.createPin);

// Barcha rasmlarni olish — token kerak emas
router.get('/pin/all', pinCtrl.getAllPins);

// Bitta rasmni ko'rish — token kerak emas
router.get('/pin/one/:id', pinCtrl.getOnePin);

// Rasmni o'chirish — token kerak (faqat egasi yoki admin)
router.delete('/pin/delete/:id', authMiddleware, pinCtrl.deletePin);

// Layk bosish / olib tashlash — token kerak
router.put('/pin/like/:id', authMiddleware, pinCtrl.likePin);

export default router;
