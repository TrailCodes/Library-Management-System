 import express from 'express';
 import {
    getAllUsers,
    registerNewAdmin,
} from '../controllers/userController.js';

import { isAuthenticated, isAuthorized } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/all', isAuthorized , isAuthenticated('Admin'), getAllUsers);
router.post('/add/new-admin',isAuthorized , isAuthenticated('Admin'), registerNewAdmin);

export default router;