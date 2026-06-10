import mongoose from "mongoose";
import { mongooseConnectionUri } from "./mongoConnectionUri";

function getResolvedUri() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not defined in environment variables");
  }
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
      parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "10000", 10) || 10000,
    connectTimeoutMS:
      parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || "10000", 10) || 10000,
    socketTimeoutMS:
      parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || "120000", 10) || 120000,
    maxIdleTimeMS:
      parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || "60000", 10) || 60000,
    retryWrites: true,
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
    if (global._mongooseCache) {
      global._mongooseCache.conn = null;
      global._mongooseCache.promise = null;
    }
  });
}

// Use a clearly named global cache key (avoids collision with other libs)
if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const cached = global._mongooseCache;

export default async function dbConnect() {
  // Return existing live connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // ✅ Always resolve the URI through mongooseConnectionUri — adds DB name if missing
  const uri = getResolvedUri();
  const opts = getConnectOptions();

  bindConnectionHandlers();

  if (!cached.promise) {
    console.log("[MongoDB] Creating new connection to:", uri.replace(/:\/\/.*@/, "://<credentials>@"));
    cached.promise = mongoose.connect(uri, opts).catch((err) => {
      // Clear promise on failure so next call retries
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("[MongoDB] Connected — DB:", mongoose.connection.db?.databaseName);
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error("[MongoDB] Connection failed:", e.message);
    throw e;
  }

  return cached.conn;
}