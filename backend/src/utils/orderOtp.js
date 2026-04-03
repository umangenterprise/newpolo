const otpStore = new Map();
const OTP_EXPIRY_MS = Number(process.env.ORDER_OTP_EXPIRY_MINUTES || 10) * 60 * 1000;

export const generateOrderOtp = (userId) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(userId.toString(), {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS
  });

  return otp;
};

export const verifyOrderOtp = (userId, otp) => {
  const record = otpStore.get(userId.toString());

  if (!record) {
    return { ok: false, message: "OTP not requested yet" };
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(userId.toString());
    return { ok: false, message: "OTP expired. Please request a new OTP." };
  }

  if (record.otp !== otp?.toString().trim()) {
    return { ok: false, message: "Invalid OTP" };
  }

  otpStore.delete(userId.toString());
  return { ok: true };
};
