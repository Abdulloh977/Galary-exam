import express from 'express';
import authCtrl from '../controller/authCtrl.js';

const router = express.Router();

router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);
router.post('/verify', authCtrl.verifyOtp);

export default router;
