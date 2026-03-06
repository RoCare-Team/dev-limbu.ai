import { MongoClient } from "mongodb"

// Lazy singleton — never evaluated at module load time so build succeeds
// without MONGODB_URI being set in the build environment.
function getClientPromise() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI not defined")

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }

  // Production: create a new promise per cold-start (module is cached anyway)
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  return global._mongoClientPromise
}

// Export a Proxy so callers can still `await clientPromise` — the actual
// connection is only established when the promise is first awaited at runtime.
const clientPromise = new Proxy(
  {},
  {
    get(_target, prop) {
      return getClientPromise()[prop]
    },
  }
)

export default clientPromise
