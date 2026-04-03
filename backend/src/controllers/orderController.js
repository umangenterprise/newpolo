import crypto from "crypto";
import Razorpay from "razorpay";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { autoCancelExpiredOrders } from "../utils/orderAutoCancel.js";
import { isEmailConfigured, sendOrderConfirmationEmail } from "../utils/email.js";
import { isSmsConfigured, sendOrderCancelledSms, sendOrderPlacedSms } from "../utils/sms.js";

const SHIPPING_FEE = 99;
const DELIVERY_MIN_DAYS = 2;
const DELIVERY_MAX_DAYS = 4;
const invalidRazorpayValues = new Set([
  undefined,
  null,
  "",
  "rzp_test_replace",
  "replace_key_secret"
]);

const hasValidRazorpayConfig = () =>
  !invalidRazorpayValues.has(process.env.RAZORPAY_KEY_ID) &&
  !invalidRazorpayValues.has(process.env.RAZORPAY_KEY_SECRET);

const getRazorpayClient = () => {
  if (!hasValidRazorpayConfig()) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const calculateTotals = (items, paymentMethod) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = paymentMethod === "upi_qr" || subtotal > 1999 ? 0 : SHIPPING_FEE;
  const totalAmount = subtotal + shippingFee;

  return { subtotal, shippingFee, totalAmount };
};

const buildEstimatedDeliveryText = (fromDate = new Date()) => {
  const deliveryStart = new Date(fromDate);
  deliveryStart.setDate(deliveryStart.getDate() + DELIVERY_MIN_DAYS);

  const deliveryEnd = new Date(fromDate);
  deliveryEnd.setDate(deliveryEnd.getDate() + DELIVERY_MAX_DAYS);

  const startText = deliveryStart.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });
  const endText = deliveryEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  });

  return `${DELIVERY_MIN_DAYS}-${DELIVERY_MAX_DAYS} days (${startText} - ${endText})`;
};

const normalizeShippingAddress = (shippingAddress) => {
  if (typeof shippingAddress === "string") {
    const raw = shippingAddress.trim();
    if (!raw) return "";

    if (raw.startsWith("{") && raw.endsWith("}")) {
      try {
        const parsed = JSON.parse(raw);
        return normalizeShippingAddress(parsed);
      } catch (error) {
        return raw;
      }
    }

    return raw;
  }

  if (!shippingAddress || typeof shippingAddress !== "object") {
    return "";
  }

  const { fullName, phone, line1, line2, city, state, pincode } = shippingAddress;
  const parts = [
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode
  ]
    .map((value) => value?.toString().trim())
    .filter(Boolean);

  return parts.join(", ");
};

const normalizeCustomerEmail = (email) => email?.toString().trim().toLowerCase() || "";
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizePaymentReference = (value) => value?.toString().trim().toUpperCase() || "";
const buildPaymentProofPath = (file) => (file?.filename ? `/uploads/${file.filename}` : "");

const buildOrderItemsFromCart = async (cartItems) => {
  const orderItems = [];

  for (const item of cartItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error("Product not found while placing order");
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity
    });
  }

  return orderItems;
};

const reduceStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }
};

const restoreStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
};

const trySendConfirmationEmail = async ({ customer, order }) => {
  if (!isEmailConfigured()) {
    return;
  }

  try {
    await sendOrderConfirmationEmail({ customer, order });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send order confirmation email:", error.message);
  }
};

const ensureOrderCustomerEmail = async (order) => {
  if (order.customerEmail?.trim()) {
    return;
  }

  const orderUser = await User.findById(order.user).select("email");
  order.customerEmail = orderUser?.email || "unknown@example.com";
};

const extractPhoneFromShippingAddress = (shippingAddress = "") =>
  shippingAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)?.[1] || "";

const trySendOrderPlacedSmsNotification = async ({ order, user, shippingAddress }) => {
  if (!isSmsConfigured()) {
    return;
  }

  const targetPhone = user?.phone || extractPhoneFromShippingAddress(shippingAddress);
  if (!targetPhone) {
    return;
  }

  try {
    await sendOrderPlacedSms({
      phone: targetPhone,
      customerName: user?.name,
      orderId: order?._id,
      estimatedDelivery: order?.deliveryDetails?.estimatedDelivery || "2-4 days"
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send order placed SMS:", error.message);
  }
};

const trySendOrderCancelledSmsNotification = async ({ order, user, shippingAddress }) => {
  if (!isSmsConfigured()) {
    return;
  }

  const targetPhone = user?.phone || extractPhoneFromShippingAddress(shippingAddress);
  if (!targetPhone) {
    return;
  }

  try {
    await sendOrderCancelledSms({
      phone: targetPhone,
      customerName: user?.name,
      orderId: order?._id
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to send order cancelled SMS:", error.message);
  }
};

export const createOrder = async (req, res) => {
  const { paymentMethod } = req.body;
  const shippingAddress = normalizeShippingAddress(req.body.shippingAddress);
  const customerEmail = normalizeCustomerEmail(req.body.customerEmail || req.user?.email);
  const paymentReference = normalizePaymentReference(req.body.paymentReference);
  const paymentProofImage = buildPaymentProofPath(req.file);

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: "Shipping address and payment method are required" });
  }

  if (!isValidEmail(customerEmail)) {
    return res.status(400).json({ message: "Valid email address is required" });
  }

  if (paymentMethod === "upi_qr") {
    if (!/^[A-Z0-9-]{6,30}$/.test(paymentReference)) {
      return res.status(400).json({
        message: "Enter valid UTR / transaction ID (6-30 letters or digits)."
      });
    }

    if (!paymentProofImage) {
      return res.status(400).json({
        message: "Payment screenshot is required for UPI QR orders."
      });
    }
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  try {
    const orderItems = await buildOrderItemsFromCart(cart.items);
    const totals = calculateTotals(orderItems, paymentMethod);
    const estimatedDelivery = buildEstimatedDeliveryText();

    if (paymentMethod === "cod") {
      const order = await Order.create({
        user: req.user._id,
        customerEmail,
        orderItems,
        shippingAddress,
        paymentMethod,
        paymentStatus: "pending",
        deliveryDetails: { estimatedDelivery },
        ...totals
      });

      await reduceStock(orderItems);
      cart.items = [];
      await cart.save();
      await trySendOrderPlacedSmsNotification({
        order,
        user: req.user,
        shippingAddress
      });
      await trySendConfirmationEmail({
        customer: { ...req.user.toObject(), email: customerEmail },
        order
      });

      return res.status(201).json({ order, razorpayOrder: null });
    }

    if (paymentMethod === "upi_qr") {
      const order = await Order.create({
        user: req.user._id,
        customerEmail,
        orderItems,
        shippingAddress,
        paymentMethod,
        paymentStatus: "pending",
        paymentReference,
        paymentProofImage,
        deliveryDetails: { estimatedDelivery },
        ...totals
      });

      await reduceStock(orderItems);
      cart.items = [];
      await cart.save();
      await trySendOrderPlacedSmsNotification({
        order,
        user: req.user,
        shippingAddress
      });

      return res.status(201).json({ order, razorpayOrder: null });
    }

    if (paymentMethod === "razorpay") {
      const razorpay = getRazorpayClient();

      if (!razorpay) {
        return res.status(400).json({
          message: "Razorpay is not configured. Add valid Razorpay keys to continue."
        });
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totals.totalAmount * 100),
        currency: process.env.RAZORPAY_CURRENCY || "INR",
        receipt: `umang_${Date.now()}`
      });

      const order = await Order.create({
        user: req.user._id,
        customerEmail,
        orderItems,
        shippingAddress,
        paymentMethod,
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
        deliveryDetails: { estimatedDelivery },
        ...totals
      });

      return res.status(201).json({ order, razorpayOrder });
    }

    return res.status(400).json({ message: "Unsupported payment method" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const requestOrderOtp = async (req, res) => {
  return res.status(410).json({
    message: "Order OTP is temporarily disabled."
  });
};

export const verifyRazorpayPayment = async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment payload" });
  }

  if (!hasValidRazorpayConfig()) {
    return res.status(400).json({
      message: "Razorpay is not configured. Add valid Razorpay keys to continue."
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    order.paymentStatus = "failed";
    await order.save();
    return res.status(400).json({ message: "Payment verification failed" });
  }

  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  await reduceStock(order.orderItems);
  await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
  await trySendConfirmationEmail({
    customer: { ...req.user.toObject(), email: order.customerEmail || req.user.email },
    order
  });
  await trySendOrderPlacedSmsNotification({
    order,
    user: req.user,
    shippingAddress: order.shippingAddress
  });

  return res.status(200).json({ message: "Payment verified", order });
};

export const getMyOrders = async (req, res) => {
  await autoCancelExpiredOrders();
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.status(200).json(order);
};

export const deleteMyOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (["shipped", "delivered"].includes(order.orderStatus)) {
    return res.status(400).json({
      message: "Shipped or delivered orders cannot be cancelled."
    });
  }

  if (order.orderStatus === "cancelled") {
    return res.status(200).json({ message: "Order is already cancelled.", order });
  }

  order.orderStatus = "cancelled";

  if (order.paymentMethod === "cod") {
    order.paymentStatus = "failed";
  }

  await ensureOrderCustomerEmail(order);
  await order.save();

  const shouldRestoreStock =
    ["cod", "upi_qr"].includes(order.paymentMethod) ||
    order.paymentStatus === "paid" ||
    Boolean(order.razorpayPaymentId);

  if (shouldRestoreStock) {
    await restoreStock(order.orderItems);
  }

  await trySendOrderCancelledSmsNotification({
    order,
    user: req.user,
    shippingAddress: order.shippingAddress
  });

  return res.status(200).json({ message: "Order cancelled successfully", order });
};
