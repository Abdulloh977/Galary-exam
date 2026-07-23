import express from 'express';
import contactCtrl from '../controller/contactCtrl.js';
import authMiddleware from '../authMiddleware/authMiddleware.js';

const router = express.Router();

router.post('/contact/save', authMiddleware, contactCtrl.saveContact);

router.delete('/contact/remove/:contactId', authMiddleware, contactCtrl.removeContact);

router.get('/contact/list', authMiddleware, contactCtrl.getContacts);

export default router;
