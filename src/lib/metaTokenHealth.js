/**
 * Meta (Facebook) access token ki sehat — pehchaan aur alert.
 *
 * PROBLEM
 * ───────
 * `META_ACCESS_TOKEN` ek **user access token** hai (env me hardcoded). Facebook
 * user token ko in cases me maar deta hai:
 *   • us Facebook user ne apna PASSWORD badla        → code 190, subcode 460
 *   • user ne app ka access hataya                    → code 190, subcode 458
 *   • token expire ho gaya (long-lived ~60 din)       → code 190, subcode 463
 *   • Facebook ne security ke liye session invalidate → code 190
 *
 * Token marte hi meta-leads-import har 10 min par 502 deta rehta hai aur
 * dashboard par Facebook ka apna raw jumla dikhta hai — jisse ye pata hi nahi
 * chalta ki karna kya hai. Ye helper us error ko pehchaan kar ek KAAM KI baat
 * me badalta hai, aur team ko ek baar email bhejta hai.
 *
 * PAKKA FIX (code se nahi ho sakta)
 * ─────────────────────────────────
 * User token ki jagah **System User token** (Meta Business Manager → Business
 * settings → Users → System users) use karein. Wo password change se nahi
 * marta aur expire bhi nahi hota — yahi lead-sync jaise background kaam ke liye
 * sahi hai. Naya token banakar `META_ACCESS_TOKEN` update karna hoga.
 */
import nodemailer from "nodemailer";

/** Facebook ke wo error codes jinka matlab hai "token ab kaam ka nahi". */
export function isMetaTokenDead(graphError) {
  if (!graphError) return false;
  const code = Number(graphError.code);
  const type = String(graphError.type || "");
  return code === 190 || code === 102 || type === "OAuthException";
}

/** Subcode ko padhne laayak wajah me badalta hai. */
export function metaTokenDeadReason(graphError) {
  const sub = Number(graphError?.error_subcode);
  if (sub === 460)
    return "Jis Facebook account ka token hai usne PASSWORD badal diya (ya Facebook ne security ke liye session band kar diya).";
  if (sub === 458) return "Us Facebook account se app ka access hata diya gaya hai.";
  if (sub === 463) return "Token expire ho chuka hai (long-lived user token ~60 din chalta hai).";
  if (sub === 467) return "Token invalid ho chuka hai (user logged out).";
  return String(graphError?.message || "Facebook ne token reject kar diya.");
}

/**
 * Dashboard / API ke liye ek saaf, actionable message.
 * Facebook ka raw jumla nahi — jo karna hai wahi.
 */
export function metaTokenFixMessage(graphError) {
  return [
    "Meta access token ab valid nahi hai — lead sync isi wajah se ruka hua hai.",
    metaTokenDeadReason(graphError),
    "Fix: Meta Business Manager me System User token banayein (wo password change se nahi marta aur expire nahi hota) aur usse META_ACCESS_TOKEN update karke app restart karein.",
  ].join(" ");
}

/* ── Alerting ──────────────────────────────────────────────────────────────
   Cron har 10 min chalta hai. Bina dedupe ke ek dead token roz ~144 email
   bhej deta, isliye per-process cooldown rakha hai. Process restart par ek
   alert dobara jayega — jaan-boojhkar, taaki deploy ke baad bhi pata chale ki
   dikkat abhi bhi hai.
──────────────────────────────────────────────────────────────────────────── */
let lastAlertAt = 0;
const ALERT_COOLDOWN_MS =
  Math.max(1, Number(process.env.META_ALERT_COOLDOWN_HOURS) || 12) * 3600 * 1000;

export async function alertMetaTokenDead(graphError, { context = "" } = {}) {
  try {
    const now = Date.now();
    if (now - lastAlertAt < ALERT_COOLDOWN_MS) return { alerted: false, reason: "cooldown" };

    const to = (process.env.GMB_ALERT_EMAIL || process.env.EMAIL_USER || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!to.length || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { alerted: false, reason: "mailer not configured" };
    }

    lastAlertAt = now;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "⚠ Meta lead sync ruk gaya — access token invalid",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px">
          <h2 style="margin:0 0 4px;color:#b91c1c">Facebook lead sync band hai</h2>
          <p style="margin:0 0 14px;color:#475569">
            <code>META_ACCESS_TOKEN</code> ab valid nahi hai, isliye naye Meta leads
            import nahi ho paa rahe. Jab tak token update nahi hota, har sync fail hoga.
          </p>
          <div style="margin:0 0 14px;padding:12px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px">
            <div style="font-weight:700;color:#991b1b;margin-bottom:4px">Wajah</div>
            <div style="color:#7f1d1d;font-size:13.5px">${metaTokenDeadReason(graphError)}</div>
            <div style="margin-top:8px;color:#9f1239;font-size:12px;font-family:monospace">
              code=${graphError?.code ?? "-"} subcode=${graphError?.error_subcode ?? "-"}
            </div>
          </div>
          <div style="padding:12px 14px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px">
            <div style="font-weight:700;color:#166534;margin-bottom:6px">Pakka fix — System User token</div>
            <div style="color:#14532d;font-size:13.5px;line-height:1.6">
              Abhi jo token hai wo ek <b>user token</b> hai — jis person ka account hai
              uske password badalte hi wo mar jata hai. Iski jagah:<br><br>
              1. Meta <b>Business Settings → Users → System users</b><br>
              2. System user banayein → <b>Generate new token</b><br>
              3. App chunein, permissions: <code>leads_retrieval</code>,
                 <code>pages_show_list</code>, <code>pages_read_engagement</code><br>
              4. Us page par System user ko <b>assign</b> karein<br>
              5. Token ko <code>META_ACCESS_TOKEN</code> me daal kar app restart karein<br><br>
              System user token expire nahi hota aur password change se nahi marta.
            </div>
          </div>
          ${context ? `<p style="margin:14px 0 0;font-size:12px;color:#94a3b8">context: ${context}</p>` : ""}
        </div>`,
    });

    console.log("[meta-token] ✉ token-dead alert bheja gaya →", to.join(", "));
    return { alerted: true };
  } catch (err) {
    // Alert ki dikkat se sync flow kabhi nahi rukna chahiye.
    console.error("[meta-token] alert failed:", err.message);
    return { alerted: false, reason: err.message };
  }
}
