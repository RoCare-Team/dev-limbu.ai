import mongoose from "mongoose";
import { MongoClient } from "mongodb";

let cached = global.mongoose;
let clientPromiseCached = global.clientPromise;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!clientPromiseCached) {
  clientPromiseCached = global.clientPromise = { client: null, promise: null };
}

export default async function dbConnect() {
  // Only check for MONGODB_URI when actually connecting, not at module load time
  // This allows the build to succeed even without the env var at build time
  const MONGODB_URI = process.env.MONGODB_URI;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!MONGODB_URI) {
      console.warn("MONGODB_URI environment variable is not defined. Database connection will not be available.");
      return null;
    }
    
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e.message);
    return null;
  }

  return cached.conn;
}

// Export a clientPromise for NextAuth and other modules that need direct MongoDB client access
export const clientPromise = (async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI environment variable is not defined. Database connection will not be available.");
    return null;
  }

  if (clientPromiseCached.client) {
    return clientPromiseCached.client;
  }

  if (!clientPromiseCached.promise) {
    clientPromiseCached.promise = MongoClient.connect(MONGODB_URI);
  }

  try {
    clientPromiseCached.client = await clientPromiseCached.promise;
  } catch (e) {
    clientPromiseCached.promise = null;
    console.error("MongoDB client connection error:", e.message);
    return null;
  }

  return clientPromiseCached.client;
})();
