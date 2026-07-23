import mongoose from "mongoose";

/**
 * Google Business Profile ko ek "connected account" ki tarah store karta hai —
 * login method ki tarah nahi. Key hamesha app ka apna `userId` (USR…/MB…) hai,
 * isliye impersonation aur normal login dono ek hi record par land karte hain.
 *
 * Purana `GmbUser.projects[]` sirf backfill ke liye padha jata hai; naya likhna
 * yahin hota hai. Dekho: src/lib/gmbSession.js
 */
const GmbConnectionSchema = new mongoose.Schema(
  {
    // App identity — GmbUser ki tarah email nahi, kyunki app email badal sakta hai.
    userId: { type: String, required: true, unique: true, index: true },

    // Google identity (sirf display / dedupe ke liye)
    googleId: String,
    email: String,
    name: String,
    image: String,

    accessToken: String,
    refreshToken: String,
    // ms epoch — isi ke bharose refresh hota hai (NextAuth JWT callback ki jagah)
    accessTokenExpires: Number,

    scope: String,
    connectedAt: Date,
    updatedAt: Date,

    // Refresh fail hone par set hota hai. UI "Reconnect GMB" dikhata hai,
    // app se logout NAHI karta.
    invalid: { type: Boolean, default: false },
    invalidReason: String,
  },
  { collection: "gmb_connections" },
);

export default mongoose.models.GmbConnection ||
  mongoose.model("GmbConnection", GmbConnectionSchema);
