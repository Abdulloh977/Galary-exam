import express from 'express';
import userCtrl from '../controller/userCtrl';

const router = express.Router()

router.get('/users', userCtrl.getAll);
router.get('/oneUser', userCtrl.getOne);
router.get('/delete', userCtrl.deleteUser);
router.get('/update', userCtrl.updateUser);


export default router;
