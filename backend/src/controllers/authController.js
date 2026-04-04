import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { sendAuthOtpEmail, isEmailConfigured } from "../utils/email.js";
import { generateToken } from "../utils/generateToken.js";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
const AUTH_OTP_EXPIRY_MINUTES = Number(process.env.AUTH_OTP_EXPIRY_MINUTES || 10);
const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const toAuthPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  address: user.address,
  phone: user.phone,
  isEmailVerified: user.isEmailVerified
});

export const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  if (name.length < 2) {
    return res.status(400).json({ message: "Full name must be at least 2 characters long" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
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
    password: hashedPassword,
    isEmailVerified: true,
    emailVerificationOtp: "",
    emailVerificationExpiresAt: null
  });

  return res.status(201).json({
    ...toAuthPayload(user),
    token: generateToken(user._id)
  });
};

export const loginUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account has been blocked by the seller." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.status(200).json({
    ...toAuthPayload(user),
    token: generateToken(user._id)
  });
};

export const requestLoginOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (!isEmailConfigured()) {
    return res.status(400).json({
      message: "Email OTP login is not configured yet. Seller ko Gmail setup karna hoga."
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "No account found with this email" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account has been blocked by the seller." });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + AUTH_OTP_EXPIRY_MINUTES * 60 * 1000);

  user.emailVerificationOtp = otp;
  user.emailVerificationExpiresAt = expiresAt;
  await user.save();

  await sendAuthOtpEmail({
    customer: { name: user.name, email: user.email },
    otp
  });

  return res.status(200).json({
    message: "Login code sent to your email",
    expiresInMinutes: AUTH_OTP_EXPIRY_MINUTES
  });
};

export const verifyLoginOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.toString().trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Enter valid 6-digit code" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "No account found with this email" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: "Your account has been blocked by the seller." });
  }

  if (!user.emailVerificationOtp || !user.emailVerificationExpiresAt) {
    return res.status(400).json({ message: "Please request a new login code" });
  }

  if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
    user.emailVerificationOtp = "";
    user.emailVerificationExpiresAt = null;
    await user.save();
    return res.status(400).json({ message: "Login code expired. Please request a new one." });
  }

  if (user.emailVerificationOtp !== otp) {
    return res.status(400).json({ message: "Incorrect login code" });
  }

  user.emailVerificationOtp = "";
  user.emailVerificationExpiresAt = null;
  user.isEmailVerified = true;
  await user.save();

  return res.status(200).json({
    ...toAuthPayload(user),
    token: generateToken(user._id)
  });
};

export const getMyProfile = async (req, res) => {
  return res.status(200).json(req.user);
};

export const logoutUser = async (req, res) => {
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
    address: updated.address,
    isEmailVerified: updated.isEmailVerified
  });
};
