import express from 'express';
import userCtrl from '../controller/userCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router()

router.get('/profile/:id', userCtrl.getProfile);
router.get('/users', authMiddleware, userCtrl.getAll);
router.get('/oneUser/:id', authMiddleware, userCtrl.getOne);
router.delete('/delete/:id', authMiddleware, userCtrl.deleteUser);
router.put('/update/:id', authMiddleware,  userCtrl.updateUser);


export default router;
