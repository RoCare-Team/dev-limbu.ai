#!/usr/bin/env node
/**
 * Meta (Facebook) access token ka health-check aur long-lived exchange.
 *
 * KYUN
 * ────
 * `META_ACCESS_TOKEN` ke marte hi Meta lead sync band ho jaata hai. Do baar ye
 * ho chuka hai aur dono baar wajah alag thi:
 *   • subcode 460 — jis account ka token tha usne PASSWORD badla
 *   • subcode 463 — Graph API Explorer wala SHORT-LIVED token (~1-2 ghante) expire
 *
 * Graph Explorer se copy kiya hua token 1-2 ghante me mar jaata hai, isliye use
 * seedha .env me daalna bekaar hai. Ye script usse 60-din wale LONG-LIVED token
 * me badal deti hai.
 *
 * USAGE
 *   node scripts/meta-token.mjs check
 *       → abhi jo META_ACCESS_TOKEN hai uski sehat aur expiry
 *
 *   node scripts/meta-token.mjs exchange <short-lived-token>
 *       → 60-din ka long-lived token banakar deta hai (.env me paste karne ke liye)
 *
 * SABSE PAKKA FIX (ye script bhi 60 din baad phir chalani padegi)
 * ──────────────────────────────────────────────────────────────
 * Meta Business Settings → Users → System users → naya system user →
 * "Generate new token" → app chunein → permissions: leads_retrieval,
 * pages_show_list, pages_read_engagement → us Page par system user ko assign
 * karein. System user ka token EXPIRE NAHI HOTA aur password change se bhi
 * nahi marta. Use ek baar META_ACCESS_TOKEN me daal dein, phir ye dikkat khatam.
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const GRAPH = "https://graph.facebook.com/v24.0";

const SUBCODE_REASON = {
  460: "Us Facebook account ka PASSWORD badal gaya (ya FB ne session band kar diya).",
  458: "Us account se app ka access hata diya gaya hai.",
  463: "Token EXPIRE ho chuka hai — short-lived token tha (Graph Explorer wala ~1-2 ghante chalta hai).",
  467: "Token invalid — user logged out ho gaya.",
};

async function describe(token, label) {
  // App token se debug karte hain — usse token ki poori details milti hain.
  let dbg = await (
    await fetch(`${GRAPH}/debug_token?input_token=${token}&access_token=${APP_ID}|${APP_SECRET}`)
  ).json();

  // (#100) "App_id in the input_token did not match the Viewing App" ka matlab
  // hai ki ye token KISI AUR Facebook app se bana hai. Ye chup-chaap fail hone
  // wali sabse confusing dikkat hai, isliye alag se saaf batate hain — warna
  // banda samajhta hai ki token kharab hai, jabki app galat chuna gaya tha.
  if (Number(dbg?.error?.code) === 100) {
    console.log(`\n❌ ${label}: ye token DOOSRE Facebook app ka hai.`);
    console.log(`   Is project ka app: ${APP_ID} (limbu_ai_connect)`);
    console.log(
      "   Graph API Explorer me upar-right se app 'limbu_ai_connect' chunkar\n" +
        "   naya token banayein — tabhi ye credentials uske saath kaam karenge.",
    );
    // Token khud ko viewing-app bana kar dobara koshish — kam se kam ye to
    // pata chal jaye ki wo zinda bhi hai ya nahi.
    dbg = await (
      await fetch(`${GRAPH}/debug_token?input_token=${token}&access_token=${token}`)
    ).json();
    if (dbg?.error) {
      console.log(`   Upar se, token khud bhi dead hai: ${dbg.error.message}`);
    }
    return false;
  }

  if (dbg?.error) {
    console.log(`\n❌ ${label}: ${dbg.error.message}`);
    return false;
  }
  const d = dbg.data || {};
  if (!d.is_valid) {
    const why = SUBCODE_REASON[d.error?.subcode] || d.error?.message || "unknown";
    console.log(`\n❌ ${label}: INVALID — ${why}`);
    return false;
  }

  const never = !d.expires_at;
  const expIso = never ? "NEVER (system user token 👍)" : new Date(d.expires_at * 1000).toISOString();
  const daysLeft = never ? Infinity : (d.expires_at * 1000 - Date.now()) / 86400000;

  console.log(`\n✅ ${label}: VALID`);
  console.log(`   type       : ${d.type}`);
  console.log(`   app        : ${d.app_id} ${d.application || ""}`);
  console.log(`   expires    : ${expIso}${never ? "" : `  (${daysLeft.toFixed(1)} din baaki)`}`);
  console.log(`   scopes     : ${(d.scopes || []).join(", ") || "-"}`);

  const need = ["leads_retrieval", "pages_show_list"];
  const missing = need.filter((s) => !(d.scopes || []).includes(s));
  if (missing.length) console.log(`   ⚠ missing scopes: ${missing.join(", ")}`);
  if (!never && daysLeft < 7) console.log(`   ⚠ ${daysLeft.toFixed(1)} din me expire — abhi naya bana lein`);
  return true;
}

async function main() {
  if (!APP_ID || !APP_SECRET) {
    console.error("META_APP_ID / META_APP_SECRET .env.local me nahi mile.");
    process.exit(1);
  }
  const cmd = process.argv[2] || "check";

  if (cmd === "check") {
    const tok = process.env.META_ACCESS_TOKEN;
    if (!tok) {
      console.error("META_ACCESS_TOKEN .env.local me nahi hai.");
      process.exit(1);
    }
    const ok = await describe(tok, "META_ACCESS_TOKEN");
    if (ok) {
      const formId = process.env.META_FORM_ID || "1393275835835157";
      const r = await (await fetch(`${GRAPH}/${formId}/leads?limit=1&access_token=${tok}`)).json();
      console.log(
        `\n   form ${formId}: ${r?.error ? "❌ " + r.error.message : `✅ leads padh sakta hai (${(r.data || []).length} mile)`}`,
      );
    }
    process.exit(ok ? 0 : 1);
  }

  if (cmd === "exchange") {
    const short = process.argv[3];
    if (!short) {
      console.error("Usage: node scripts/meta-token.mjs exchange <short-lived-token>");
      process.exit(1);
    }
    console.log("Short-lived token check kar rahe hain…");
    if (!(await describe(short, "input token"))) {
      console.error(
        "\nYe token pehle se dead hai — exchange nahi ho sakta.\n" +
          "Graph API Explorer se ek NAYA token banayein aur TURANT ye command chalayein\n" +
          "(wo token sirf 1-2 ghante chalta hai).",
      );
      process.exit(1);
    }

    const url =
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${short}`;
    const j = await (await fetch(url)).json();
    if (!j.access_token) {
      console.error("\nExchange fail:", JSON.stringify(j).slice(0, 400));
      process.exit(1);
    }

    console.log("\n✅ Long-lived token ban gaya:\n");
    console.log(`META_ACCESS_TOKEN=${j.access_token}\n`);
    await describe(j.access_token, "naya long-lived token");
    console.log(
      "\nIse .env.local me META_ACCESS_TOKEN par paste karein, phir app restart karein.\n" +
        "Yaad rahe: ye bhi ~60 din me expire hoga. Hamesha ke liye chahiye to\n" +
        "System User token banayein (upar file ke comment me steps hain).",
    );
    process.exit(0);
  }

  console.error(`Unknown command "${cmd}". Use: check | exchange <token>`);
  process.exit(1);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
