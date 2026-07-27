// scripts/generate-google-refresh-token.mjs
// EK BAAR chalao — franchise demo Meet links ke liye Google Calendar refresh token.
//
// Ye GMB ko bilkul touch nahi karta. Bas ek naya refresh token deta hai
// jise aap .env.local me DEMO_CALENDAR_REFRESH_TOKEN=... daal doge.
//
// Ye existing GMB redirect URI reuse karta hai:
//     http://localhost:3000/api/gmb/callback
// (Console me kuch naya add karne ki zaroorat NAHI — jo pehle se registered hai wahi.)
//
// ⚠️ Chalane se PEHLE dev server band karo (warna port 3000 busy hoga).
//
// Phir chalao:
//     node scripts/generate-google-refresh-token.mjs
// Browser khulega -> GMB wale account se login/allow karo -> token terminal me print hoga.
//
// (Chaho to alag redirect URI env se de sakte ho:
//     DEMO_OAUTH_REDIRECT_URI=http://localhost:3000/api/gmb/callback )

import http from "node:http";
import { readFileSync } from "node:fs";
import { google } from "googleapis";

const REDIRECT_URI =
  process.env.DEMO_OAUTH_REDIRECT_URI || "http://localhost:3000/api/gmb/callback";
const REDIRECT_URL = new URL(REDIRECT_URI);
const PORT = Number(REDIRECT_URL.port || 80);
const CALLBACK_PATH = REDIRECT_URL.pathname;
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

// .env.local se CLIENT_ID / SECRET manually parse (dotenv dependency avoid)
function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const CLIENT_ID = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET .env.local me nahi mile.");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline", // refresh token ke liye zaroori
  prompt: "consent", // har baar refresh token force karo
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith(CALLBACK_PATH)) {
    res.writeHead(404).end();
    return;
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Auth cancelled: ${err}</h2>`);
    console.error("❌ Auth error:", err);
    server.close();
    return;
  }
  if (!code) {
    res.writeHead(400).end("missing code");
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h2>✅ Ho gaya! Terminal me refresh token dekho. Ye tab band kar do.</h2>"
    );

    console.log("\n==================================================");
    if (tokens.refresh_token) {
      console.log("✅ REFRESH TOKEN mil gaya. Ye .env.local me daalo:\n");
      console.log(`DEMO_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log(
        "⚠️  refresh_token nahi mila. Google account -> Security -> " +
          "Third-party access se is app ka access hatao, phir dobara chalao " +
          "(prompt=consent ke saath fresh token aayega)."
      );
    }
    console.log("==================================================\n");
  } catch (e) {
    console.error("❌ Token exchange failed:", e.message);
    res.writeHead(500).end("token exchange failed");
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`\n🔗 Is URL ko browser me kholo aur login/allow karo:\n\n${authUrl}\n`);
  console.log(`(Callback listen ho raha hai ${REDIRECT_URI} par...)\n`);
});
