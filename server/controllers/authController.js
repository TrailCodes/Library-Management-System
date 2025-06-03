import {catchAsyncError} from "../middleware/catchAsyncError.js"
import ErrorHandler from "../middleware/errorMiddleware.js"
import {User} from "../models/userModel.js";
import bcrypt from "bcrypt"
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { send } from "process";

export const register = catchAsyncError(async(req,res,next) => {
    try {
        const{name , email ,password } = req.body;
        if(!name || !email || !password){
            return next (new ErrorHandler("PLEASE ENTER ALL FIELDS ",400));
        }
        const isRegistered = await User.findOne({ email , accountVerified : true});

        

        if (isRegistered){
            return next (new ErrorHandler("USER ALREADY EXIST ",400));
        }

        const registerationAttemptByUser = await User.find({
            email,
            accountVerified : false
        });

        if(registerationAttemptByUser.length >= 5){
            return next (new ErrorHandler("You have Excces the Limit ",400));
        }

        if(password.length<8  || password.length > 16){
            return next (new ErrorHandler("Password must be 8 and 16 characters ",400));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,email,
            password : hashedPassword,
        })

        const verificationCode = await user.generateVerificationCode();
        await user.save();
        sendVerificationCode(verificationCode, email, res);
    } catch(error){
        next(error);
    }
});

export const verifyOTP = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return next(new ErrorHandler("Please provide email and OTP", 400));
    }
    try {
        const userAllEntries = await User.find({ email, accountVerified: false }).sort({ createdAt: -1 });

        if (!userAllEntries) {
            return next(new ErrorHandler("No user found with this email", 404));
        }
        let user;
        if (userAllEntries.length > 1) {
            user = userAllEntries[0];
            await User.deleteMany({
                _id: { $ne: user._id },
                email,
                accountVerified: false,
            });
        } else {
            user = userAllEntries[0];
        }
        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler("Invalid OTP", 400));
        }
        const currentTime = Date.now();
        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

        if (currentTime > verificationCodeExpire) {
            return next(new ErrorHandler("OTP has expired", 400));
        }
        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({ validateModifiedOnly: true });

        sendToken(user, 200, "Account Verified", res);
    } catch (error) {
        return next(new ErrorHandler("Invalid OTP", 500));
    }
});

export const login = catchAsyncError(async (req, res, next) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const user = await User.findOne({ email, accountVerified: true }).select("+password");
    if (!user) {
        return next(new ErrorHandler("User not found or account not verified", 404));
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid credentials", 401));
    }
    sendToken(user,200,"Login Successfully",res);
});

export const logout = catchAsyncError(async (req,res,next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
})

export const  getUser = catchAsyncError(async (req,res,next) => {
const user = req.user;
res.status(200).json({
    success: true,
    user,
});
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
    // 1. Validate input
    if (!req.body.email) {
        return next(new ErrorHandler("Please provide an email", 400));
    }

    // 2. Find user
    const user = await User.findOne({ 
        email: req.body.email, 
        accountVerified: true
    });

    if (!user) {
        return next(new ErrorHandler("No verified user found with this email", 404));
    }

    // 3. Generate and save token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });


    // 4. Create reset URL
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    try {
        // 5. Send email
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            message: generateForgotPasswordEmailTemplate(resetPasswordUrl)
        });

        res.status(200).json({
            success: true,
            message: `Password reset link sent to ${user.email}`
        });

    } catch (error) {
        // 6. Clean up on failure
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        return next(new ErrorHandler("Failed to send reset email. Please try again.", 500));
    }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired reset token", 400));
    }

    // Password validation
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    if (req.body.password.length < 8 || req.body.password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters", 400));
    }

    // Update password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    
    await user.save();
    sendToken(user, 200, "Password reset successfully", res);
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("+password");
    const { currentPassword, newPassword , confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new ErrorHandler("Please provide all fields", 400));
    }
    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Current password is incorrect", 401));
    }
    if (newPassword.length < 8 || newPassword.length > 16 || confirmPassword.length < 8 || confirmPassword.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters", 400));
    }
    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("New password and confirm password do not match", 400));
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    });
})