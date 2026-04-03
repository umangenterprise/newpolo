import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { isEmailConfigured, sendAuthOtpEmail } from "../utils/email.js";

const AUTH_OTP_EXPIRY_MINUTES = Math.max(1, Number(process.env.AUTH_OTP_EXPIRY_MINUTES || 10));

const buildAuthOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const buildAuthOtpExpiry = () => new Date(Date.now() + AUTH_OTP_EXPIRY_MINUTES * 60 * 1000);

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

  if (!isEmailConfigured()) {
    return res.status(503).json({
      message: "Email verification is not available right now. Please contact support."
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser?.isEmailVerified) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const otp = buildAuthOtp();
  const otpExpiry = buildAuthOtpExpiry();

  const user = existingUser || new User({ email });
  user.name = name;
  user.email = email;
  user.password = hashedPassword;
  user.isEmailVerified = false;
  user.emailVerificationOtp = otp;
  user.emailVerificationExpiresAt = otpExpiry;
  await user.save();

  await sendAuthOtpEmail({
    customer: { name: user.name, email: user.email },
    otp
  });

  return res.status(201).json({
    message: "Verification OTP sent to your email.",
    requiresEmailVerification: true,
    email: user.email
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    if (!isEmailConfigured()) {
      return res.status(403).json({
        message: "Your email is not verified yet. Verification service is unavailable right now.",
        requiresEmailVerification: true,
        email: user.email
      });
    }

    user.emailVerificationOtp = buildAuthOtp();
    user.emailVerificationExpiresAt = buildAuthOtpExpiry();
    await user.save();

    await sendAuthOtpEmail({
      customer: { name: user.name, email: user.email },
      otp: user.emailVerificationOtp
    });

    return res.status(403).json({
      message: "Email not verified. OTP sent to your email.",
      requiresEmailVerification: true,
      email: user.email
    });
  }

  return res.status(200).json({
    ...toAuthPayload(user),
    token: generateToken(user._id)
  });
};

export const verifyEmailOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.toString().trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      ...toAuthPayload(user),
      token: generateToken(user._id)
    });
  }

  const isExpired =
    !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now();

  if (isExpired || user.emailVerificationOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isEmailVerified = true;
  user.emailVerificationOtp = "";
  user.emailVerificationExpiresAt = null;
  await user.save();

  return res.status(200).json({
    ...toAuthPayload(user),
    token: generateToken(user._id)
  });
};

export const resendEmailOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({
      message: "Email verification is not available right now. Please contact support."
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  user.emailVerificationOtp = buildAuthOtp();
  user.emailVerificationExpiresAt = buildAuthOtpExpiry();
  await user.save();

  await sendAuthOtpEmail({
    customer: { name: user.name, email: user.email },
    otp: user.emailVerificationOtp
  });

  return res.status(200).json({ message: "Verification OTP sent again" });
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
