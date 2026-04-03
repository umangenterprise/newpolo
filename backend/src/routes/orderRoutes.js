import express from "express";
import {
  createOrder,
  deleteMyOrder,
  getMyOrders,
  getOrderById,
  requestOrderOtp,
  verifyRazorpayPayment
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/request-otp", requestOrderOtp);
router.post("/", upload.single("paymentProof"), createOrder);
router.post("/verify-payment", verifyRazorpayPayment);
router.get("/my", getMyOrders);
router.delete("/:id", deleteMyOrder);
router.get("/:id", getOrderById);

export default router;
