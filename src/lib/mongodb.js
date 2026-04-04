import { MongoClient } from "mongodb";
import { mongooseConnectionUri } from "./mongoConnectionUri";
import dbConnect from "./dbConnect";

let clientPromiseCached = global.clientPromise;

if (!clientPromiseCached) {
  clientPromiseCached = global.clientPromise = { client: null, promise: null };
}

function getMongoClientOptions() {
  const maxPoolSize = Math.min(
    100,
    Math.max(5, parseInt(process.env.MONGODB_MAX_POOL_SIZE || "25", 10) || 25),
  );
  const minPoolSize = Math.min(
    maxPoolSize,
    Math.max(0, parseInt(process.env.MONGODB_MIN_POOL_SIZE || "2", 10) || 2),
  );
  return {
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
    ...(process.env.MONGODB_FORCE_IPV4 === "1" ? { family: 4 } : {}),
  };
}

/** Same Mongoose cache as @/lib/dbConnect (no duplicate pools). */
export default dbConnect;

export const clientPromise = (async () => {
  const MONGODB_URI = mongooseConnectionUri(process.env.MONGODB_URI);

  const fallbackClient = {
    db: () => ({
      collection: () => ({
        updateOne: async () => ({ acknowledged: false }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: null }),
      }),
    }),
  };

  if (!MONGODB_URI) {
    console.warn(
      "MONGODB_URI environment variable is not defined. Database connection will not be available.",
    );
    return fallbackClient;
  }

  if (clientPromiseCached.client) {
    return clientPromiseCached.client;
  }

  if (!clientPromiseCached.promise) {
    const client = new MongoClient(MONGODB_URI, getMongoClientOptions());
    clientPromiseCached.promise = client.connect().then(() => client);
  }

  try {
    clientPromiseCached.client = await clientPromiseCached.promise;
  } catch (e) {
    clientPromiseCached.promise = null;
    console.error("MongoDB client connection error:", e.message);
    return fallbackClient;
  }

  return clientPromiseCached.client;
})();
