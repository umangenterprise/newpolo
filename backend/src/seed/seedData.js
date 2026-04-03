import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedProducts = [
  {
    name: "Urban Drift Sling",
    price: 1299,
    description: "Compact crossbody sling designed for city commuting and all-day comfort.",
    image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=900&q=80"
    ],
    category: "sling bag",
    stock: 24,
    featured: true
  },
  {
    name: "Metro Flex Backpack",
    price: 2499,
    description: "Water-resistant backpack with padded laptop sleeve and ergonomic straps.",
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80"
    ],
    category: "backpack",
    stock: 18,
    featured: true
  },
  {
    name: "Luna Arc Handbag",
    price: 2199,
    description: "Minimal structured handbag that elevates both casual and work outfits.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80"
    ],
    category: "handbag",
    stock: 12,
    featured: true
  },
  {
    name: "Campus Rover Backpack",
    price: 1899,
    description: "Daily-use backpack with organized pockets for youth and students.",
    image: "https://images.unsplash.com/photo-1575844264771-892081089af5?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1575844264771-892081089af5?auto=format&fit=crop&w=900&q=80"
    ],
    category: "backpack",
    stock: 30,
    featured: false
  },
  {
    name: "Nomad Zip Sling",
    price: 1499,
    description: "Hands-free sling bag with quick-access front pocket and premium zips.",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80"
    ],
    category: "sling bag",
    stock: 20,
    featured: false
  },
  {
    name: "Aster Mini Handbag",
    price: 1699,
    description: "Chic mini handbag with soft vegan leather finish and magnetic closure.",
    image: "https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=900&q=80"
    ],
    category: "handbag",
    stock: 15,
    featured: false
  }
];

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany();
    await Product.deleteMany();

    const adminPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Umang Admin",
      email: "admin@umang.com",
      password: adminPassword,
      role: "admin",
      isEmailVerified: true
    });

    await Product.insertMany(seedProducts);

    // eslint-disable-next-line no-console
    console.log("Seed complete. Admin: admin@umang.com / Admin@123");
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
};

runSeed();
