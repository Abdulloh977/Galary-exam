import express from 'express';
import boardCtrl from '../controller/boardCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

router.post('/board/create', authMiddleware, boardCtrl.createBoard);

router.get('/board/my', authMiddleware, boardCtrl.getMyBoards);

router.get('/board/one/:id', boardCtrl.getOneBoard);

router.put('/board/update/:id', authMiddleware, boardCtrl.updateBoard);

router.delete('/board/delete/:id', authMiddleware, boardCtrl.deleteBoard);

router.put('/board/addPin', authMiddleware, boardCtrl.addPinToBoard);

router.put('/board/save/:boardId', authMiddleware, boardCtrl.saveBoardToUser);

export default router;