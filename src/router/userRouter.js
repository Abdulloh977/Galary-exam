import express from 'express';
import userCtrl from '../controller/userCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';
import optionalAuth from '../authMiddleware/optionalAuth.js';

const router = express.Router();

router.get('/profile/:id', optionalAuth, userCtrl.getProfile);

router.get('/users', authMiddleware, userCtrl.getAll);
router.get('/oneUser/:id', authMiddleware, userCtrl.getOne);
router.delete('/delete/:id', authMiddleware, userCtrl.deleteUser);
router.put('/update/:id', authMiddleware, userCtrl.updateUser);
router.put('/block/:id', authMiddleware, userCtrl.blockUser);
router.put('/unblock/:id', authMiddleware, userCtrl.unblockUser);

export default router;