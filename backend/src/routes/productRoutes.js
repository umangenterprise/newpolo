import express from "express";
import {
  createProductReview,
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductById,
  getProducts,
  updateProduct
} from "../controllers/productController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", protect, createProductReview);

router.post("/", protect, adminOnly, upload.array("images", 4), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 4), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
