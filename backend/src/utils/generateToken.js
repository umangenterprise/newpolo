import jwt from "jsonwebtoken";

const DEFAULT_JWT_SECRET = "dev_jwt_secret_change_me";

export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || DEFAULT_JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
