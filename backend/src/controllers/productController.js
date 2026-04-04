import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const buildImagePaths = (files = []) => files.map((file) => `/uploads/${file.filename}`);
const normalizeGstPercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 28);
};

export const createProduct = async (req, res) => {
  const { name, price, gstPercent, description, category, stock, featured } = req.body;

  if (!name || !price || !description || !category || stock === undefined) {
    return res.status(400).json({ message: "Please provide complete product details" });
  }

  if (!req.files?.length) {
    return res.status(400).json({ message: "At least 1 product image is required" });
  }

  const images = buildImagePaths(req.files);

  const product = await Product.create({
    name,
    price,
    gstPercent: normalizeGstPercent(gstPercent),
    description,
    category,
    stock,
    featured: featured === "true" || featured === true,
    image: images[0],
    images
  });

  return res.status(201).json(product);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!product.images?.length && product.image) {
    product.images = [product.image];
  }

  const { name, price, gstPercent, description, category, stock, featured } = req.body;

  product.name = name ?? product.name;
  product.price = price ?? product.price;
  if (gstPercent !== undefined) {
    product.gstPercent = normalizeGstPercent(gstPercent);
  }
  product.description = description ?? product.description;
  product.category = category ?? product.category;
  product.stock = stock ?? product.stock;
  if (featured !== undefined) {
    product.featured = featured === "true" || featured === true;
  }

  if (req.files?.length) {
    const images = buildImagePaths(req.files);
    product.image = images[0];
    product.images = images;
  }

  const updatedProduct = await product.save();
  return res.status(200).json(updatedProduct);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await product.deleteOne();
  return res.status(200).json({ message: "Product removed" });
};

export const getProducts = async (req, res) => {
  const { category, q, minPrice, maxPrice, sort } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (q) {
    query.name = { $regex: q, $options: "i" };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let productQuery = Product.find(query);

  if (sort === "price_asc") {
    productQuery = productQuery.sort({ price: 1 });
  } else if (sort === "price_desc") {
    productQuery = productQuery.sort({ price: -1 });
  } else {
    productQuery = productQuery.sort({ createdAt: -1 });
  }

  const products = (await productQuery).map((product) => {
    if (!product.images?.length && product.image) {
      product.images = [product.image];
    }

    return product;
  });

  return res.status(200).json(products);
};

export const getFeaturedProducts = async (req, res) => {
  const products = (await Product.find({ featured: true }).limit(8).sort({ createdAt: -1 })).map((product) => {
    if (!product.images?.length && product.image) {
      product.images = [product.image];
    }

    return product;
  });
  return res.status(200).json(products);
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!product.images?.length && product.image) {
    product.images = [product.image];
  }

  return res.status(200).json(product);
};

export const createProductReview = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const rating = Number(req.body.rating);
  const comment = req.body.comment?.toString().trim() || "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const hasDeliveredPurchase = await Order.exists({
    user: req.user._id,
    orderStatus: "delivered",
    orderItems: { $elemMatch: { product: product._id } }
  });

  if (!hasDeliveredPurchase) {
    return res.status(403).json({
      message: "Only customers with delivered orders can rate this product."
    });
  }

  const existingReview = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

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

  product.numReviews = product.reviews.length;
  product.averageRating =
    product.numReviews > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews
      : 0;

  await product.save();
  return res.status(201).json({
    message: existingReview ? "Review updated" : "Review added",
    product
  });
};
