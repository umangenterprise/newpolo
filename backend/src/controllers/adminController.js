import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { autoCancelExpiredOrders } from "../utils/orderAutoCancel.js";
import { isSmsConfigured, sendOrderCancelledSms, sendOrderConfirmedSms } from "../utils/sms.js";

const ensureOrderCustomerEmail = async (order) => {
  if (order.customerEmail?.trim()) {
    return;
  }

  const orderUser = await User.findById(order.user).select("email");
  order.customerEmail = orderUser?.email || "unknown@example.com";
};

export const getDashboardStats = async (req, res) => {
  await autoCancelExpiredOrders();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [usersCount, ordersCount, productsCount, paidRevenueData, pendingRevenueData] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "pending" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ])
  ]);

  const revenue = paidRevenueData[0]?.total || 0;
  const pendingRevenue = pendingRevenueData[0]?.total || 0;
  const [ordersToday, ordersLast7Days, ordersThisMonth] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } })
  ]);

  return res.status(200).json({
    usersCount,
    ordersCount,
    productsCount,
    revenue,
    pendingRevenue,
    ordersToday,
    ordersLast7Days,
    ordersThisMonth
  });
};

export const getAllUsers = async (req, res) => {
  const users = await User.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });
  return res.status(200).json(users);
};

export const toggleUserBlock = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(400).json({ message: "Owner account cannot be blocked" });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return res.status(200).json(user);
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(400).json({ message: "Owner account cannot be deleted" });
  }

  await user.deleteOne();

  return res.status(200).json({ message: "User deleted successfully" });
};

export const getAllOrders = async (req, res) => {
  await autoCancelExpiredOrders();
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  return res.status(200).json(orders);
};

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const { orderStatus, paymentStatus, deliveryDetails } = req.body;
  const previousOrderStatus = order.orderStatus;
  const allowedTransitions = {
    processing: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  if (orderStatus && orderStatus !== order.orderStatus) {
    const nextAllowed = allowedTransitions[order.orderStatus] || [];
    if (!nextAllowed.includes(orderStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.orderStatus} to ${orderStatus}`
      });
    }

    if (orderStatus === "shipped") {
      const courierName = deliveryDetails?.courierName?.toString().trim();
      const trackingId = deliveryDetails?.trackingId?.toString().trim();
      if (!courierName || !trackingId) {
        return res.status(400).json({
          message: "Courier name and tracking ID are required before marking order as shipped."
        });
      }
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    if (orderStatus === "cancelled" && order.paymentStatus === "pending") {
      order.paymentStatus = "failed";
    }
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;

    if (paymentStatus === "paid" && order.orderStatus === "processing") {
      order.orderStatus = "confirmed";
    }
  }

  if (deliveryDetails && typeof deliveryDetails === "object") {
    order.deliveryDetails = {
      courierName: deliveryDetails.courierName?.toString().trim() || order.deliveryDetails?.courierName || "",
      trackingId: deliveryDetails.trackingId?.toString().trim() || order.deliveryDetails?.trackingId || "",
      estimatedDelivery:
        deliveryDetails.estimatedDelivery?.toString().trim() || order.deliveryDetails?.estimatedDelivery || "",
      sellerNote: deliveryDetails.sellerNote?.toString().trim() || order.deliveryDetails?.sellerNote || ""
    };
  }

  await ensureOrderCustomerEmail(order);
  const updated = await order.save();

  const isNewlyConfirmed = previousOrderStatus !== "confirmed" && updated.orderStatus === "confirmed";
  const isNewlyCancelled = previousOrderStatus !== "cancelled" && updated.orderStatus === "cancelled";
  const orderUser = await User.findById(updated.user).select("name phone");
  const fallbackPhone = updated.shippingAddress?.split(",")?.[1]?.trim() || "";
  const targetPhone = orderUser?.phone || fallbackPhone;

  if (isNewlyConfirmed && isSmsConfigured()) {
    try {
      await sendOrderConfirmedSms({
        phone: targetPhone,
        customerName: orderUser?.name,
        orderId: updated._id,
        estimatedDelivery: "2-4 days"
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send order confirmation SMS:", error.message);
    }
  }

  if (isNewlyCancelled && isSmsConfigured()) {
    try {
      await sendOrderCancelledSms({
        phone: targetPhone,
        customerName: orderUser?.name,
        orderId: updated._id
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send order cancelled SMS:", error.message);
    }
  }

  return res.status(200).json(updated);
};

export const deleteOrderPermanently = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const shouldRestoreStock =
    order.orderStatus !== "cancelled" &&
    (["cod", "upi_qr"].includes(order.paymentMethod) ||
      order.paymentStatus === "paid" ||
      Boolean(order.razorpayPaymentId));

  if (shouldRestoreStock) {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  await order.deleteOne();
  return res.status(200).json({ message: "Order permanently deleted" });
};
