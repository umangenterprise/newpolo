import express from "express";
import {
  getMyProfile,
  loginUser,
  logoutUser,
  requestLoginOtp,
  registerUser,
  verifyLoginOtp,
  updateMyProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login/request-otp", requestLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

export default router;
