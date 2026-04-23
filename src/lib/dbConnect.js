import mongoose from "mongoose";
import { mongooseConnectionUri } from "./mongoConnectionUri";

/**
 * Resolves MONGODB_URI to include DB name when omitted (e.g. mongodb://host:27017 → …/gmb_dashboard).
 * Set MONGODB_DB_NAME to override default database.
 */
function getResolvedUri() {
  return mongooseConnectionUri(process.env.MONGODB_URI);
}

function getConnectOptions() {
  const maxPoolSize = Math.min(
    100,
    Math.max(5, parseInt(process.env.MONGODB_MAX_POOL_SIZE || "25", 10) || 25),
  );
  const minPoolSize = Math.min(
    maxPoolSize,
    Math.max(0, parseInt(process.env.MONGODB_MIN_POOL_SIZE || "2", 10) || 2),
  );

  return {
    bufferCommands: false,
    maxPoolSize,
    minPoolSize,
    serverSelectionTimeoutMS:
      parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "10000", 10) ||
      10000,
    connectTimeoutMS:
      parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || "10000", 10) || 10000,
    socketTimeoutMS:
      parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || "120000", 10) || 120000,
    maxIdleTimeMS:
      parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || "60000", 10) || 60000,
    retryWrites: true,
    // Helps on some hosts where IPv6 is broken for the bound address
    ...(process.env.MONGODB_FORCE_IPV4 === "1" ? { family: 4 } : {}),
  };
}

let handlersBound = false;

function bindConnectionHandlers() {
  if (handlersBound) return;
  handlersBound = true;

  const c = mongoose.connection;
  c.on("error", (err) => {
    console.error("[MongoDB] connection error:", err?.message || err);
  });
  c.on("disconnected", () => {
    console.warn("[MongoDB] disconnected — cache cleared for reconnect");
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });
}

const MONGO_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Single cached Mongoose connection for API routes / server code.
 * Uses the same URI rules as mongooseConnectionUri (host-only URI gets /gmb_dashboard).
 */
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
