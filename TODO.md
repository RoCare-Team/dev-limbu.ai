# Build-time Env Safety Fix TODO

## Steps

- [x] Step 1: Refactor `src/lib/dbConnect.js` to remove top-level env throw and validate `MONGODB_URI` lazily inside `dbConnect()`.
- [x] Step 2: Refactor `src/app/api/get-refreshToken/route.js` to avoid top-level Mongo client initialization and env throw; initialize client lazily per request path.
- [x] Step 3: Refactor `src/app/api/generate-images/route.js` to avoid top-level OpenAI client construction; create client lazily in handler after env validation.
- [x] Step 4: Run production build (`npm run build`) and inspect remaining failing modules.
- [x] Step 5: Patch additional routes that still perform top-level env-dependent initialization (if build reports more failures). *(No additional patch needed after Step 4 verification.)*

## In Progress
- Additional CI build-safety patches:
  - [ ] `src/app/api/admin/saveBussiness/route.js`
  - [ ] `src/app/api/ai-genrated-website/route.js`
  - [ ] `src/app/api/app-version/route.js`
  - [ ] `src/app/api/connectedBussiness/route.js`
  - [ ] `src/lib/auth.js`
  - [ ] Re-run `npm run build`
