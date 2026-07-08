import express from 'express';
import authCtrl from '../controller/authCtrl.js';

const router = express.Router();

router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);

// SIZ SO'RAGAN YANGI GOOGLE LOGIN YO'NALISHI
router.post('/google-login', authCtrl.googleLogin);

export default router;
