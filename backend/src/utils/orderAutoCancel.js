import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

const AUTO_CANCEL_MINUTES = Math.max(1, Number(process.env.ORDER_AUTO_CANCEL_MINUTES || 5));

const restoreStock = async (orderItems = []) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
};

export const autoCancelExpiredOrders = async () => {
  const cutoff = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000);

  const staleOrders = await Order.find({
    paymentStatus: "pending",
    orderStatus: { $in: ["processing", "confirmed"] },
    createdAt: { $lte: cutoff }
  });

  for (const order of staleOrders) {
    const shouldRestoreStock = ["cod", "upi_qr"].includes(order.paymentMethod);

    if (shouldRestoreStock) {
      await restoreStock(order.orderItems);
    }

    await Order.updateOne(
      { _id: order._id, paymentStatus: "pending", orderStatus: { $in: ["processing", "confirmed"] } },
      { $set: { orderStatus: "cancelled", paymentStatus: "failed" } }
    );
  }

  return staleOrders.length;
};

