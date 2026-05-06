import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

const toUploadedImagePaths = (files = []) =>
  files.map((file) => `/uploads/${file.filename}`).filter(Boolean);

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const recalculateRatings = (product) => {
  product.numReviews = product.reviews.length;
  product.averageRating = product.numReviews
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews
    : 0;
};

export const getProducts = async (req, res) => {
  const filter = {};
  const { category, q, minPrice, maxPrice } = req.query;

  if (category && category !== "all") {
    filter.category = category;
  }

  if (q?.trim()) {
    filter.$or = [
      { name: { $regex: q.trim(), $options: "i" } },
      { description: { $regex: q.trim(), $options: "i" } },
      { category: { $regex: q.trim(), $options: "i" } }
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};

    if (minPrice !== undefined && minPrice !== "") {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.status(200).json(products);
};

export const getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ featured: true }).sort({ createdAt: -1 }).limit(8);
  return res.status(200).json(products);
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.status(200).json(product);
};

export const createProduct = async (req, res) => {
  const { name, price, gstPercent, description, category, stock, featured } = req.body;
  const uploadedImages = toUploadedImagePaths(req.files);

  if (!name || !price || !description || !category || stock === undefined || stock === "") {
    return res.status(400).json({ message: "Please provide all required product fields" });
  }

  if (!uploadedImages.length) {
    return res.status(400).json({ message: "At least one product image is required" });
  }

  const product = await Product.create({
    name: name.trim(),
    price: Number(price),
    gstPercent: gstPercent === undefined || gstPercent === "" ? 0 : Number(gstPercent),
    description: description.trim(),
    category,
    stock: Number(stock),
    featured: parseBoolean(featured),
    image: uploadedImages[0],
    images: uploadedImages
  });

  return res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const uploadedImages = toUploadedImagePaths(req.files);

  product.name = req.body.name?.trim() || product.name;
  product.price = req.body.price !== undefined && req.body.price !== "" ? Number(req.body.price) : product.price;
  product.gstPercent =
    req.body.gstPercent !== undefined && req.body.gstPercent !== ""
      ? Number(req.body.gstPercent)
      : product.gstPercent;
  product.description = req.body.description?.trim() || product.description;
  product.category = req.body.category || product.category;
  product.stock = req.body.stock !== undefined && req.body.stock !== "" ? Number(req.body.stock) : product.stock;
  product.featured = req.body.featured !== undefined ? parseBoolean(req.body.featured) : product.featured;

  if (uploadedImages.length) {
    product.images = uploadedImages;
    product.image = uploadedImages[0];
  } else if (!product.images?.length && product.image) {
    product.images = [product.image];
  }

  await product.save();
  return res.status(200).json(product);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await product.deleteOne();
  return res.status(200).json({ message: "Product deleted successfully" });
};

export const createProductReview = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const rating = Number(req.body.rating);
  const comment = req.body.comment?.toString().trim() || "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const hasDeliveredOrder = await Order.exists({
    user: req.user._id,
    orderStatus: "delivered",
    "orderItems.product": product._id
  });

  if (!hasDeliveredOrder) {
    return res.status(403).json({
      message: "You can review this product only after a delivered order."
    });
  }

  const existingReview = product.reviews.find((review) => review.user.toString() === req.user._id.toString());

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.name = req.user.name;
  } else {
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment
    });
  }

  recalculateRatings(product);
  await product.save();

  return res.status(200).json({
    message: existingReview ? "Review updated successfully" : "Review added successfully",
    product
  });
};
