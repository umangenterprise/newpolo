import nodemailer from "nodemailer";

const invalidMailValues = new Set(["", "yourgmail@gmail.com", "your_16_digit_app_password"]);
const normalizeEnvValue = (value) => (typeof value === "string" ? value.trim() : "");
const isInvalidMailValue = (value) => invalidMailValues.has(normalizeEnvValue(value).toLowerCase());

const escapeHtml = (value = "") =>
  value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: process.env.RAZORPAY_CURRENCY || "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);

export const isEmailConfigured = () =>
  !isInvalidMailValue(process.env.GMAIL_USER) &&
  !isInvalidMailValue(process.env.GMAIL_APP_PASSWORD);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const gmailUser = normalizeEnvValue(process.env.GMAIL_USER);
  const gmailAppPassword = normalizeEnvValue(process.env.GMAIL_APP_PASSWORD);

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });
};

export const sendOrderConfirmationEmail = async ({ customer, order }) => {
  const transporter = getTransporter();

  if (!transporter || !customer?.email || !order) {
    return false;
  }

  const itemRows = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0; text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0; text-align:right;">${escapeHtml(formatCurrency(item.lineTotal || item.price * item.quantity))}</td>
        </tr>
      `
    )
    .join("");

  const subject =
    order.paymentMethod === "cod"
      ? `Order received: #${order._id.toString().slice(-6).toUpperCase()}`
      : `Payment confirmed: #${order._id.toString().slice(-6).toUpperCase()}`;

  const html = `
    <div style="font-family:Arial,sans-serif; color:#14100d; max-width:640px; margin:0 auto;">
      <h2 style="margin-bottom:8px;">Umang order confirmation</h2>
      <p style="margin-top:0;">
        Hi ${escapeHtml(customer.name || "there")}, your order has been ${
          order.paymentMethod === "cod" ? "placed successfully" : "confirmed successfully"
        }.
      </p>
      <div style="background:#fff7ef; border:1px solid #e2d8ce; border-radius:14px; padding:16px; margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Order ID:</strong> ${escapeHtml(order._id.toString())}</p>
        <p style="margin:0 0 8px;"><strong>Payment:</strong> ${escapeHtml(order.paymentMethod.toUpperCase())}</p>
        <p style="margin:0 0 8px;"><strong>GST:</strong> ${escapeHtml(formatCurrency(order.gstAmount || 0))}</p>
        <p style="margin:0;"><strong>Total:</strong> ${escapeHtml(formatCurrency(order.totalAmount))}</p>
      </div>
      <h3 style="margin-bottom:10px;">Items</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding-bottom:8px; border-bottom:1px solid #e2d8ce;">Product</th>
            <th style="text-align:center; padding-bottom:8px; border-bottom:1px solid #e2d8ce;">Qty</th>
            <th style="text-align:right; padding-bottom:8px; border-bottom:1px solid #e2d8ce;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <h3 style="margin:22px 0 10px;">Delivery address</h3>
      <p style="line-height:1.6; margin:0;">${escapeHtml(order.shippingAddress).replaceAll(", ", "<br/>")}</p>
      <p style="margin-top:24px; color:#7a6f66;">Thank you for shopping with Umang.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to: customer.email,
    subject,
    html
  });

  return true;
};

export const sendOrderOtpEmail = async ({ customer, otp }) => {
  const transporter = getTransporter();

  if (!transporter || !customer?.email || !otp) {
    return false;
  }

  const html = `
    <div style="font-family:Arial,sans-serif; color:#14100d; max-width:560px; margin:0 auto;">
      <h2 style="margin-bottom:10px;">Order verification OTP</h2>
      <p style="margin-top:0;">Hi ${escapeHtml(customer.name || "there")}, use this OTP to confirm your Umang order.</p>
      <div style="margin:24px 0; padding:18px; border-radius:16px; background:#fff7ef; border:1px solid #e2d8ce; text-align:center;">
        <div style="font-size:32px; font-weight:700; letter-spacing:10px;">${escapeHtml(otp)}</div>
      </div>
      <p style="margin:0; color:#7a6f66;">This OTP is valid for ${escapeHtml(process.env.ORDER_OTP_EXPIRY_MINUTES || "10")} minutes.</p>
      <p style="margin-top:20px; color:#7a6f66;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to: customer.email,
    subject: "Your Umang order OTP",
    html
  });

  return true;
};

export const sendAuthOtpEmail = async ({ customer, otp }) => {
  const transporter = getTransporter();

  if (!transporter || !customer?.email || !otp) {
    return false;
  }

  const html = `
    <div style="font-family:Arial,sans-serif; color:#14100d; max-width:560px; margin:0 auto;">
      <h2 style="margin-bottom:10px;">Verify your Umang account</h2>
      <p style="margin-top:0;">Hi ${escapeHtml(customer.name || "there")}, enter this OTP to verify your email and activate your Umang account.</p>
      <div style="margin:24px 0; padding:18px; border-radius:16px; background:#fff7ef; border:1px solid #e2d8ce; text-align:center;">
        <div style="font-size:32px; font-weight:700; letter-spacing:10px;">${escapeHtml(otp)}</div>
      </div>
      <p style="margin:0; color:#7a6f66;">This OTP is valid for ${escapeHtml(process.env.AUTH_OTP_EXPIRY_MINUTES || "10")} minutes.</p>
      <p style="margin-top:20px; color:#7a6f66;">If you did not sign up on Umang, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to: customer.email,
    subject: "Verify your Umang account",
    html
  });

  return true;
};
