import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/umang_store";
const RETRY_DELAY_MS = 5000;
let retryTimer = null;
let lastDbError = null;
let lastConnectedAt = null;

const getMongoUri = () => process.env.MONGO_URI || DEFAULT_MONGO_URI;
const getMaskedUri = () => getMongoUri().replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");

export const getDbHealth = () => ({
  state: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  lastError: lastDbError,
  lastConnectedAt
});

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  const conn = await mongoose.connect(getMongoUri(), {
    serverSelectionTimeoutMS: 10000
  });

  lastDbError = null;
  lastConnectedAt = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export const connectDBWithRetry = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log(`Attempting MongoDB connection: ${getMaskedUri()}`);
    await connectDB();
  } catch (error) {
    lastDbError = error.message || "Unknown MongoDB error";
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error.message);

    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connectDBWithRetry();
      }, RETRY_DELAY_MS);
    }
  }
};
