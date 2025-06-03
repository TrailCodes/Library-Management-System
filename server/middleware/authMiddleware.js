import { catchAsyncError } from "./catchAsyncError.js";
import  Errorhandler from "./errorMiddleware.js";
import jwt from "jsonwebtoken"
import { User } from "../models/userModel.js"

export const isAuthorized = catchAsyncError(async(req, res, next) => {
   const  {token} = req.cookies;
   if(!token) {
       return next(new Errorhandler("Please Login to access this resource", 401));
   }
   const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
   console.log(decoded)
   req.user = await User.findById(decoded.id);
   next();
});

export const isAuthenticated= (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new Errorhandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
}