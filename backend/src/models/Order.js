import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, required: true, min: 0, max: 28, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    orderItems: { type: [orderItemSchema], required: true },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, enum: ["razorpay", "cod", "upi_qr"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentReference: { type: String, default: "", trim: true },
    paymentProofImage: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: ["processing", "confirmed", "shipped", "delivered", "cancelled"],
      default: "processing"
    },
    subtotal: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    deliveryDetails: {
      courierName: { type: String, default: "", trim: true },
      trackingId: { type: String, default: "", trim: true },
      estimatedDelivery: { type: String, default: "", trim: true },
      sellerNote: { type: String, default: "", trim: true }
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
