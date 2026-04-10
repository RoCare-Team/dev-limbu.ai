import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  console.log("👉 DB CONNECT FUNCTION CALLED");

  if (!MONGO_URI) {
    console.error("❌ MONGODB_URI missing in ENV");
    throw new Error("MONGODB_URI not defined");
  }

  console.log("🔗 MONGO URI:", MONGO_URI);

  if (cached.conn) {
    console.log("✅ Using cached DB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("⏳ Creating new DB connection...");

    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // fast fail
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected Successfully");
  } catch (e) {
    console.error("❌ MongoDB Connection Error:", e.message);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}