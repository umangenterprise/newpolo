import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  const email = (process.env.ADMIN_EMAIL || "admin@umang.com").trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error("MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const existing = await User.findOne({ email });

    if (existing) {
      existing.name = existing.name || "Umang Admin";
      existing.password = hashedPassword;
      existing.role = "admin";
      existing.isBlocked = false;
      await existing.save();
    } else {
      await User.create({
        name: "Umang Admin",
        email,
        password: hashedPassword,
        role: "admin",
        isBlocked: false
      });
    }

    // eslint-disable-next-line no-console
    console.log(`Admin ready: ${email} / ${plainPassword}`);
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to reset admin:", error.message);
    process.exit(1);
  }
};

void run();
