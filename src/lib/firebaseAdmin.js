// Firebase Admin SDK — server side se app ko push notification bhejne ke liye
// Modular imports (firebase-admin v12+) — Next.js webpack ke saath default import se
// admin.apps undefined aa jata hai, isliye modular API use karte hain
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    // Env missing ho to clear error de, warna JSON.parse pe cryptic error aata hai
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON env var missing. .env.local me service account JSON add karein.",
    );
  }

  const serviceAccount = JSON.parse(raw);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

// messaging instance export karo — route me admin.messaging() ki jagah isko use karenge
export const messaging = getMessaging();
