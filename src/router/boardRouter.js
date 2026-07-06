import express from 'express';
import boardCtrl from '../controller/boardCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

// Yangi doska (board) yaratish — token kerak
router.post('/board/create', authMiddleware, boardCtrl.createBoard);

// Bitta doskani ichidagi rasmlari bilan ko'rish — token kerak emas
router.get('/board/one/:id', boardCtrl.getOneBoard);

// Doskaga rasm qo'shish / olib tashlash — token kerak
router.put('/board/addPin', authMiddleware, boardCtrl.addPinToBoard);

// Boshqa foydalanuvchining doskasini o'ziga saqlab qo'yish — token kerak
router.put('/board/save/:boardId', authMiddleware, boardCtrl.saveBoardToUser);

export default router;
