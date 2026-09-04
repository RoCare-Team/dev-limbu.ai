import mongoose from "mongoose";

/**
 * Google Business Profile ko ek "connected account" ki tarah store karta hai —
 * login method ki tarah nahi.
 *
 * Key `{userId, connectedBy}` ka JODA hai, sirf `userId` nahi — pehle sirf
 * `userId` par unique tha, isliye impersonation (admin, manager-access wale
 * Google account se) aur client ka apna self-connect EK HI document share
 * karte the. Client jaise hi khud "Connect GMB" karta, uska naya token
 * in-house team ka rocare7-wala connection OVERWRITE kar deta — aur admin
 * dobara impersonate karne par GMB "disconnect ho gaya" jaisa dikhta.
 *
 * Ab dono alag slots hain: ek `connectedBy: "self"`, ek
 * `connectedBy: "admin_impersonation"` — koi ek doosre ko nahi mitata.
 * Dekho: src/lib/gmbSession.js (getGmbConnection / getVisibleGmbConnection)
 *
 * Purana `GmbUser.projects[]` sirf backfill ke liye padha jata hai; naya likhna
 * yahin hota hai.
 */
const GmbConnectionSchema = new mongoose.Schema(
  {
    // App identity — GmbUser ki tarah email nahi, kyunki app email badal sakta hai.
    //
    // WhatsApp chatbot flow (/connect-google-business?phone=…) me user app me
    // logged in nahi hota. Wahan key `phone:<digits>` hoti hai, aur agar us
    // phone ka asli User mil jaye to uska userId use hota hai.
    //
    // Ab akela unique nahi hai — {userId, connectedBy} compound index dekho
    // niche. Same userId ke do documents (self + admin_impersonation) ho
    // sakte hain.
    userId: { type: String, required: true, index: true },

    // Chatbot flow ka identifier. App-login se aaye connections me khaali rehta hai.
    phone: { type: String, index: true },

    // Google identity (sirf display / dedupe ke liye)
    // Ek hi Google account kai app users par connected ho sakta hai — token
    // sharing/self-heal isi index se chalta hai (dekho gmbSession.js).
    googleId: { type: String, index: true },
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

    // ── Reconnect alerting ───────────────────────────────────────────────────
    // Token marne par automation chup-chaap band ho jati thi. RO Care India ka
    // case: 19 Aug se 13 din tak roz 125 locations fail hote rahe aur kisi ko
    // pata hi nahi chala — kyunki kahin koi alert nahi jata tha.
    //
    // `reconnectAlertedAt` sirf DEDUPE ke liye hai: cron har 5 min chalta hai,
    // to bina iske ek toota connection roz 288 email bhej deta. Reconnect
    // hone par callback ise clear kar deta hai, taaki agli baar (agar kabhi
    // dobara toote) alert phir se jaye.
    reconnectAlertedAt: { type: Date, default: null },
    // Lagatar kitne publish is connection ki wajah se fail hue — ek transient
    // hiccup par alert na jaye, isliye threshold ke baad hi bhejte hain.
    consecutiveAuthFailures: { type: Number, default: 0 },

    // Kisne connect kiya — client ne khud, ya in-house team ne admin
    // "login-as-user" (impersonation) se manager-access Google account se.
    // Default "self" rakha hai taaki purane/existing records ka behaviour
    // bilkul waisa hi rahe — sirf naye impersonated connects hi flag hote hain.
    // Dekho: src/lib/gmbSession.js getGmbSession()
    connectedBy: { type: String, enum: ["self", "admin_impersonation"], default: "self" },
  },
  { collection: "gmb_connections" },
);

// Naya "asli" unique key. Purani deployed DB me abhi bhi `userId` par unique
// index ho sakta hai — wo ek-time migration se drop karna padega, warna dusra
// slot insert hote hi duplicate-key error dega. Dekho: scripts/backfill-gmb-connections.mjs
GmbConnectionSchema.index({ userId: 1, connectedBy: 1 }, { unique: true });

export default mongoose.models.GmbConnection ||
  mongoose.model("GmbConnection", GmbConnectionSchema);
