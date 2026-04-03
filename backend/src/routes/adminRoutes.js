import express from "express";
import {
  deleteOrderPermanently,
  deleteUser,
  getAllOrders,
  getAllUsers,
  getDashboardStats,
  toggleUserBlock,
  updateOrderStatus
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/block", toggleUserBlock);
router.delete("/users/:id", deleteUser);
router.get("/orders", getAllOrders);
router.put("/orders/:id", updateOrderStatus);
router.delete("/orders/:id", deleteOrderPermanently);

export default router;
