import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/umang_store";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || DEFAULT_MONGO_URI);
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
