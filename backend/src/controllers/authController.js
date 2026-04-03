import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import {
  activateSellerSession,
  clearSellerSession,
  getActiveSellerSession,
  isSellerSessionActive
} from "../utils/sellerSession.js";

export const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (isSellerSessionActive()) {
    return res.status(403).json({
      message: "Seller is active right now. New customer accounts are temporarily blocked."
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  return res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
};

export const loginUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account has been blocked by the seller." });
  }

  const activeSeller = getActiveSellerSession();
  if (activeSeller && user.role !== "admin") {
    return res.status(403).json({
      message: "Seller panel is active. Customer login is temporarily disabled."
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.role === "admin") {
    activateSellerSession(user);
  }

  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
    address: user.address,
    phone: user.phone,
    token: generateToken(user._id)
  });
};

export const getMyProfile = async (req, res) => {
  return res.status(200).json(req.user);
};

export const logoutUser = async (req, res) => {
  if (req.user?.role === "admin") {
    clearSellerSession();
  }

  return res.status(200).json({ message: "Logged out successfully" });
};

export const updateMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.address = req.body.address || user.address;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const updated = await user.save();

  return res.status(200).json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    isBlocked: updated.isBlocked,
    phone: updated.phone,
    address: updated.address
  });
};
