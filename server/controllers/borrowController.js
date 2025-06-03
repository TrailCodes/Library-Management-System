
import {catchAsyncError }from '../middleware/catchAsyncError.js';
import { Borrow } from '../models/borrowModel.js';
import ErrorHandler from '../middleware/errorMiddleware.js';
import { Book } from '../models/bookModel.js';
import { User } from '../models/userModel.js';
import { calculateFine } from '../utils/fineCalculate.js';


export const recordBorrowedBooks = catchAsyncError(async (req, res ,next) => {
        const { id } = req.params;
        const {email } = req.body;

        const book = await Book.findById(id);
        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }
        const user = await User.findOne({email});
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        if(book.quantity <= 0) {
            return next(new ErrorHandler("Book is not available", 400));
        }
       const isAlreadyBorrowed = user.borrowedBooks.find(
        (b) => b.bookId.toString() === id && b.returned === false
       );
       if (isAlreadyBorrowed) {
            return next(new ErrorHandler("You have already borrowed this book", 400));
        }
        book.quantity -= 1;
        book.availability = book.quantity > 0;
        await book.save();

        user.borrowedBooks.push({
            bookId: book._id,
            bookTitle: book.title,
            borrowedDate : new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        await user.save();

        await Borrow.create({
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            book: book._id,
            borrowDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            price: book.price,
        });

        res.status(200).json({
            success: true,
            message: "Book borrowed successfully",
            book,
            user
        });
})

export const returnBorrowedBook = catchAsyncError(async (req, res, next) => {
    const { bookId } = req.params;
    const { email } = req.body;

    // 1. Find the book
    const book = await Book.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Book not found", 404));
    }

    // 2. Find verified user
    const user = await User.findOne({ 
        email, 
        accountVerified: true 
    });
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // 3. Check borrowing status
    const borrowedBook = user.borrowedBooks.find(
        b => b.bookId.toString() === bookId && !b.returned
    );
    if (!borrowedBook) {
        return next(new ErrorHandler("You have not borrowed this book", 400));
    }

    // 4. Find borrow record
    const borrow = await Borrow.findOne({
        book: bookId,
        "user.email": email,
        returnDate: null
    });
    if (!borrow) {
        return next(new ErrorHandler("Borrow record not found", 404));
    }

    // 5. Update records
    borrowedBook.returned = true;
    await user.save();

    book.quantity += 1;
    book.availability = book.quantity > 0;
    await book.save();

    borrow.returnDate = new Date();
    const fine = calculateFine(borrow.dueDate);
    borrow.fine = fine;
    await borrow.save();

    // 6. Send response
    res.status(200).json({
        success: true,
        message: fine > 0 
            ? `Book returned successfully. Total charges: $${fine + book.price}`
            : `Book returned successfully. No fines incurred. Total charges: $${book.price}`,
    
    });
});

export const borrowedBooks = catchAsyncError(async (req, res ,next) => {
   const {borrowedBooks} = req.user;
   res.status(200).json({
        success: true,
        borrowedBooks
    });
})

export const getAllBorrowBooksForAdmin = catchAsyncError(async (req, res ,next) => {
     const borrowedBooks = await Borrow.find();
    res.status(200).json({
        success: true,
        borrowedBooks
    });
})


