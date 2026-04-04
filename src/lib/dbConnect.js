import mongoose from "mongoose";
import { mongooseConnectionUri } from "./mongoConnectionUri";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  const raw = process.env.MONGODB_URI;
  const MONGO_URI = mongooseConnectionUri(raw);

  if (!MONGO_URI) {
    console.warn("⚠️ MONGODB_URI not defined");
    return null;
  }

  // 🔥 Already connected
  if (cached.conn) {
    return cached.conn;
  }

  // 🔥 Create new connection promise if not exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // fast fail
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    cached.promise = null; // 🔥 VERY IMPORTANT (retry fix)
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }

  return cached.conn;
}