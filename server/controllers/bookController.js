import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { Book } from "../models/bookModel.js";
import ErrorHandler  from "../middleware/errorMiddleware.js";
import { User } from "../models/userModel.js";
// import  express from 'express';

export const addBook = catchAsyncError(async (req, res) => {
    const { title, author, description, price , quantity} = req.body;

    if (!title || !author || !description || !price || !quantity) {
        return res.status(400).json({ message: "Please fill all fields" });
    }

    const book = await Book.create({
        title,
        author,
        description,
        price,
        quantity,
    });

    res.status(201).json({
        success: true,
        message: "Book added successfully",
        book,
    });
})
export const getAllBooks = catchAsyncError(async (req, res) => {
    const books = await Book.find()
    if (!books || books.length === 0) {
        return res.status(404).json({ message: "No books found" });
    }

    res.status(200).json({
        success: true,
        books,
    });


})
export const deleteBook = catchAsyncError(async (req, res) => {
    const id = req.params.id;
    const book = await Book.findById(id);
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }
    await book.deleteOne();
    res.status(200).json({
        success: true,
        message: "Book deleted successfully",
    });

})

