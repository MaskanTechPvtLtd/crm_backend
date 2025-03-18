import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { register, login, verifyEmail, resendOTP, logout, refreshAccessToken, forgotPassword, verifyResetOTP, resetPassword } from "../../controllers/admin/AuthController/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verifyEmail", verifyEmail);
router.post("/resendOTP", resendOTP);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);


export default router;
