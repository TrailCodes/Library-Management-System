import {catchAsyncError} from '../middleware/catchAsyncError.js';
import {User} from '../models/userModel.js';
import ErrorHandler from '../middleware/errorMiddleware.js';
import bcrypt from 'bcryptjs';
import {v2 as cloudinary} from 'cloudinary';



export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find({});

    if (!users) {
        return next(new ErrorHander('No users found', 404));
    }

    res.status(200).json({
        success: true,
        users
    });
})

export const registerNewAdmin = catchAsyncError(async (req, res, next) => {
    // 1. Validate file upload
    if (!req.files || !req.files.avatar) {
        return next(new ErrorHandler('No file uploaded', 400));
    }

    // 2. Validate required fields
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return next(new ErrorHandler('Please provide all required fields', 400));
    }

    // 3. Validate password length
    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler('Password must be between 8 and 16 characters', 400));
    }

    // 4. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new ErrorHandler('Email already registered', 400));
    }

    // 5. Validate avatar file type
    const { avatar } = req.files;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(avatar.mimetype)) {
        return next(new ErrorHandler('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400));
    }

    try {
        // 6. Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, {
            folder: "LibraryManagement/Admins",
            resource_type: "auto"
        });

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. Create admin user
        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            avatar: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url
            },
            role: 'Admin',
            accountVerified: true
        });

        // 9. Remove sensitive data from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        delete adminResponse.__v;

        // 10. Send success response
        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            admin: adminResponse
        });

    } catch (error) {
        // Handle Cloudinary or database errors
        console.error('Admin registration error:', error);
        return next(new ErrorHandler('Registration failed. Please try again', 500));
    }
});