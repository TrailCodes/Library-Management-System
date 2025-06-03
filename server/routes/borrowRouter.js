import express from 'express';
import { borrowedBooks , recordBorrowedBooks, getAllBorrowBooksForAdmin , returnBorrowedBook } from '../controllers/borrowController.js'

import {isAuthorized , isAuthenticated} from '../middleware/authMiddleware.js'

const router = express.Router();


router.post('/record-borrowed-book/:id', isAuthorized , isAuthenticated("Admin") , recordBorrowedBooks);

router.get('/borrowed-books-by-user', isAuthorized , isAuthenticated("Admin") , getAllBorrowBooksForAdmin);

router.get('/my-borrowed-books', isAuthorized , isAuthenticated("User" , "Admin") , borrowedBooks);

router.put('/return-borrowed-book/:bookId', isAuthorized , isAuthenticated("Admin") , returnBorrowedBook);

export default router;