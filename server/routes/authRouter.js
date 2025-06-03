import express from 'express';
import { register , verifyOTP , login ,logout ,getUser, forgotPassword, resetPassword ,updatePassword} from '../controllers/authController.js';
import { isAuthorized } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/register",register);
router.post("/verify-otp",verifyOTP);
router.post("/login",login);
router.get("/logout",isAuthorized,logout);
router.get("/me",isAuthorized,getUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthorized, updatePassword);

export default router;