import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 0, min: 0, max: 28 },
    description: { type: String, required: true },
    image: { type: String, required: true },
    images: {
      type: [String],
      default() {
        return this.image ? [this.image] : [];
      },
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1 && value.length <= 4,
        message: "Products must have between 1 and 4 images"
      }
    },
    category: {
      type: String,
      enum: ["sling bag", "backpack", "handbag", "duffle bag", "laptop bag"],
      required: true
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    reviews: { type: [reviewSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
