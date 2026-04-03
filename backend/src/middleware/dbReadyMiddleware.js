import { getDbHealth } from "../config/db.js";

export const requireDbConnection = (req, res, next) => {
  const db = getDbHealth();

  if (db.state === "connected") {
    return next();
  }

  return res.status(503).json({
    message: "Database is temporarily unavailable. Please try again in a moment."
  });
};
