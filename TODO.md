# Build-time Env Safety Fix TODO

## Steps

- [x] Step 1: `src/lib/dbConnect.js` — moved `MONGODB_URI` validation inside `dbConnect()`.
- [x] Step 2: `src/lib/mongodb.js` — replaced top-level `new MongoClient(uri)` with lazy `getClientPromise()` via Proxy export.
- [x] Step 3: `src/lib/auth.js` — replaced `getRequiredEnv()` calls in module-level `authOptions` with `process.env.X || ""` to allow build-time module evaluation.
- [x] Step 4: `src/app/api/get-refreshToken/route.js` — lazy MongoClient + env validation inside handler.
- [x] Step 5: `src/app/api/generate-images/route.js` — lazy OpenAI client via `getOpenAIClient()` inside POST handler.
- [x] Step 6: `src/app/api/admin/saveBussiness/route.js` — lazy env validation in `connectDB()`.
- [x] Step 7: `src/app/api/ai-genrated-website/route.js` — lazy OpenAI client inside POST handler.
- [x] Step 8: `src/app/api/app-version/route.js` — lazy `MONGODB_URI` validation in `connectDB()`.
- [x] Step 9: `src/app/api/connectedBussiness/route.js` — `MongoClient` instantiated inside `GET` handler.
- [x] Step 10: `src/app/api/customer-review/route.js` — `MongoClient` instantiated per-request via `getMongoClient()`.
- [x] Step 11: `src/app/api/fb-webhook/route.js` — `mongoose.connect()` moved inside `ensureMongoConnection()` called at request time.
- [x] Step 12: `src/app/api/review-page/[slug]/route.js` — lazy `getClientPromise()` inside handler.
- [x] Step 13: `src/app/api/reviews/generate-ai-review/route.js` — lazy OpenAI client via `getOpenAIClient()` inside POST handler.
- [x] Step 14: `src/app/api/user-bussiness/[title]/route.js` — `MongoClient` instantiated inside `GET` handler.
- [x] Step 15: `src/app/api/user-details/route.js` — `MongoClient` instantiated per-request via `getMongoClient()` in both GET and PUT.
- [x] Step 16: Verified `npm run build` passes (156 pages, 0 errors).

## All Steps Complete ✅
