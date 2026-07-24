// Firebase Admin SDK — server side se app ko push notification bhejne ke liye
// Modular imports (firebase-admin v12+) — Next.js webpack ke saath default import se
// admin.apps undefined aa jata hai, isliye modular API use karte hain
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Lazy init — ye function tabhi chalega jab actually call hoga (request time pe),
// build time page-data collection ke waqt nahi. Isse `next build` fail nahi hoga
// jab env var CI/CodeBuild me set nahi hota.
function getMessagingInstance() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!raw) {
      // Env missing ho to clear error de, warna JSON.parse pe cryptic error aata hai
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON env var missing. .env.local me service account JSON add karein.",
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON invalid JSON hai. Value dobara check karein: " +
          err.message,
      );
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getMessaging();
}

// Route ya kisi aur server code me `messaging()` function ki tarah call karo,
// pre-built instance ki tarah nahi — isse init sirf request time pe hoga.
export { getMessagingInstance as messaging };