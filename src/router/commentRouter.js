import express from 'express';
import commentCtrl from '../controller/commentCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

router.post('/comment/create', authMiddleware, commentCtrl.createComment);

router.get('/comment/pin/:pinId', commentCtrl.getPinComments);

router.delete('/comment/delete/:id', authMiddleware, commentCtrl.deleteComment);

export default router;
