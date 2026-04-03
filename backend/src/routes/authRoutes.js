import express from "express";
import {
  getMyProfile,
  loginUser,
  logoutUser,
  registerUser,
  resendEmailOtp,
  verifyEmailOtp,
  updateMyProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-email-otp", resendEmailOtp);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

export default router;
