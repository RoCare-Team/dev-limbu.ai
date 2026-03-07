import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  const MONGO_URI = process.env.MONGODB_URI;

  // Build time par crash na ho
  if (!MONGO_URI) {
    console.warn("⚠️ MONGODB_URI not defined. Skipping DB connection.");
    return null;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return null;
  }

  return cached.conn;
}