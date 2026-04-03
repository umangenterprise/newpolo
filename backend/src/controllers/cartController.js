import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

const buildPopulatedCart = async (userId) =>
  Cart.findOne({ user: userId }).populate("items.product", "name price image category stock");

export const getCart = async (req, res) => {
  let cart = await buildPopulatedCart(req.user._id);

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
    cart = await buildPopulatedCart(req.user._id);
  }

  return res.status(200).json(cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ message: "Not enough stock available" });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    const newQuantity = existingItem.quantity + Number(quantity);
    if (product.stock < newQuantity) {
      return res.status(400).json({ message: "Stock limit reached" });
    }
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  const populated = await buildPopulatedCart(req.user._id);
  return res.status(200).json(populated);
};

export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.productId;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const item = cart.items.find((cartItem) => cartItem.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ message: "Item not found in cart" });
  }

  const product = await Product.findById(productId);
  if (!product || product.stock < Number(quantity)) {
    return res.status(400).json({ message: "Requested quantity not available" });
  }

  item.quantity = Number(quantity);
  await cart.save();

  const populated = await buildPopulatedCart(req.user._id);
  return res.status(200).json(populated);
};

export const removeFromCart = async (req, res) => {
  const productId = req.params.productId;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  const populated = await buildPopulatedCart(req.user._id);
  return res.status(200).json(populated);
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { new: true, upsert: true });
  const populated = await buildPopulatedCart(req.user._id);
  return res.status(200).json(populated);
};