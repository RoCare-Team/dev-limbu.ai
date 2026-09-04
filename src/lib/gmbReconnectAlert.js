/**
 * GMB reconnect alerting.
 *
 * PROBLEM jo isne solve kiya
 * ──────────────────────────
 * Google ka refresh token marne par automation chup-chaap ruk jati thi. Koi
 * exception nahi, koi alert nahi — bas `automation-logs` me roz ek red line.
 * RO Care India par yahi hua: 19 Aug se 13 din tak ROZ 125 locations fail hote
 * rahe, aur pata tab chala jab client ne khud shikayat ki.
 *
 * Reconnect karna khud me problem nahi hai — 85 stored tokens Google par test
 * karne par 81 zinda mile (43 din purane bhi). Token kabhi-kabhaar hi marta hai
 * (user ne Google Account → Security se app hata diya, ya password reset).
 * Asli problem ye thi ki jab marta hai to koi batata nahi.
 *
 * DESIGN
 * ──────
 * • Threshold — ek transient hiccup par alert nahi. Lagatar
 *   `ALERT_AFTER_FAILURES` (default 2) auth-failures ke baad hi.
 * • Dedupe — cron har 5 min chalta hai; bina dedupe ke ek toota connection roz
 *   288 email bhejta. Ek connection par har `ALERT_COOLDOWN_HOURS` (default 24)
 *   me ek hi alert.
 * • Reconnect hote hi counters clear (dekho `clearGmbReconnectAlert`), taaki
 *   agli baar toote to alert phir jaye.
 * • Best-effort — ye kabhi throw nahi karta. Alert bhejne me dikkat aane se
 *   publish flow nahi rukna chahiye.
 *
 * Alert ADMIN ko jata hai, client ko nahi — reconnect ke liye client ko phone
 * karna account manager ka kaam hai, aur automated "aapka connection toot gaya"
 * email client ko bhejna outward-facing decision hai jo product team le.
 * Client ka email/phone body me hota hai taaki team turant contact kar sake.
 */
import nodemailer from "nodemailer";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import User from "@/models/User";

const ALERT_AFTER_FAILURES = Math.max(
  1,
  Number(process.env.GMB_ALERT_AFTER_FAILURES) || 2,
);
const ALERT_COOLDOWN_MS =
  Math.max(1, Number(process.env.GMB_ALERT_COOLDOWN_HOURS) || 24) * 3600 * 1000;

/** Alert kis inbox par jaye. */
function alertRecipients() {
  const raw = process.env.GMB_ALERT_EMAIL || process.env.EMAIL_USER || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const REASON_TEXT = {
  invalid_grant:
    "Google refresh token revoked — client ne apne Google Account (Security → Third-party apps) se access hata diya, ya us account ka password reset hua.",
  insufficient_scope:
    "Token me 'business.manage' permission nahi hai — connect karte waqt consent screen par Business Profile wala checkbox tick nahi hua tha.",
  no_refresh_token: "Koi refresh token stored hi nahi hai — connect adhoora reh gaya.",
};

/**
 * Auth failure record karo, aur zaroorat ho to alert bhejo.
 *
 * @param {object}  opts
 * @param {string}  opts.userId        app userId (USR…)
 * @param {string}  [opts.reason]      invalid_grant | insufficient_scope | …
 * @param {string}  [opts.businessName]
 * @param {number}  [opts.locationCount] kitni locations aaj block hui
 * @param {string}  [opts.detail]      original error text
 * @param {function}[opts.log]
 * @returns {Promise<{alerted: boolean, reason?: string}>}
 */
export async function reportGmbAuthFailure({
  userId,
  reason = "invalid_grant",
  businessName = "",
  locationCount = 0,
  detail = "",
  log = () => {},
} = {}) {
  if (!userId) return { alerted: false, reason: "no userId" };

  try {
    await dbConnect();

    // Failure count badhao — ek hi transient dikkat par alert nahi jana chahiye.
    const conns = await GmbConnection.find({ userId }).select(
      "_id email connectedBy reconnectAlertedAt consecutiveAuthFailures",
    );
    if (!conns.length) {
      log(`[gmb-alert] ${userId} ka koi GmbConnection nahi — alert skip`);
      return { alerted: false, reason: "no connection row" };
    }

    const now = new Date();
    let failures = 0;
    let lastAlertedAt = null;
    for (const c of conns) {
      c.consecutiveAuthFailures = (c.consecutiveAuthFailures || 0) + 1;
      failures = Math.max(failures, c.consecutiveAuthFailures);
      if (c.reconnectAlertedAt && (!lastAlertedAt || c.reconnectAlertedAt > lastAlertedAt)) {
        lastAlertedAt = c.reconnectAlertedAt;
      }
      await c.save().catch(() => {});
    }

    if (failures < ALERT_AFTER_FAILURES) {
      log(`[gmb-alert] ${userId} failure ${failures}/${ALERT_AFTER_FAILURES} — abhi alert nahi`);
      return { alerted: false, reason: "below threshold" };
    }
    if (lastAlertedAt && now.getTime() - lastAlertedAt.getTime() < ALERT_COOLDOWN_MS) {
      log(`[gmb-alert] ${userId} — cooldown me hai, alert skip`);
      return { alerted: false, reason: "cooldown" };
    }

    const to = alertRecipients();
    if (!to.length || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      log("[gmb-alert] EMAIL_USER/EMAIL_PASS ya GMB_ALERT_EMAIL set nahi — alert skip");
      return { alerted: false, reason: "mailer not configured" };
    }

    const user = await User.findOne({ userId })
      .select("fullName email phone mobileNumber accountManagerName")
      .lean()
      .catch(() => null);

    const googleEmail = conns.find((c) => c.email)?.email || "—";
    const why = REASON_TEXT[reason] || reason;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `⚠ GMB reconnect needed — ${businessName || user?.fullName || userId}`,
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px">
          <h2 style="margin:0 0 4px;color:#b91c1c">GMB automation rok di gayi hai</h2>
          <p style="margin:0 0 16px;color:#475569">
            Is business ka Google connection kaam nahi kar raha, isliye scheduled
            posts publish nahi ho paa rahe. Jab tak reconnect nahi hota, ye roz
            fail hote rahenge.
          </p>
          <table style="border-collapse:collapse;font-size:14px;width:100%">
            ${[
              ["Business", businessName || "—"],
              ["Client", user?.fullName || "—"],
              ["userId", userId],
              ["Google account", googleEmail],
              ["Client email", user?.email || "—"],
              ["Client phone", user?.phone || user?.mobileNumber || "—"],
              ["Account manager", user?.accountManagerName || "Unassigned"],
              ["Aaj block hui locations", locationCount || "—"],
              ["Lagatar failures", failures],
            ]
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap">${k}</td><td style="padding:6px 0;font-weight:600;color:#0f172a">${v}</td></tr>`,
              )
              .join("")}
          </table>
          <div style="margin:16px 0;padding:12px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px">
            <div style="font-weight:700;color:#991b1b;margin-bottom:4px">Wajah</div>
            <div style="color:#7f1d1d;font-size:13.5px">${why}</div>
            ${detail ? `<div style="margin-top:8px;color:#9f1239;font-size:12px;font-family:monospace">${String(detail).slice(0, 300)}</div>` : ""}
          </div>
          <div style="padding:12px 14px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px">
            <div style="font-weight:700;color:#166534;margin-bottom:4px">Kya karna hai</div>
            <div style="color:#14532d;font-size:13.5px">
              Client ko <b>${googleEmail}</b> se dashboard par dobara
              <b>Connect GMB</b> karna hoga. Consent screen par
              <b>Business Profile wala checkbox tick karna zaroori hai</b> —
              warna token bina permission ke banega aur yahi dikkat rahegi.
            </div>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">
            Ye alert har ${ALERT_COOLDOWN_MS / 3600000}h me ek baar jata hai. Reconnect hote hi apne aap band ho jayega.
          </p>
        </div>`,
    });

    await GmbConnection.updateMany({ userId }, { $set: { reconnectAlertedAt: now } });
    log(`[gmb-alert] ✉ reconnect alert bheja — ${userId} (${businessName}) → ${to.join(", ")}`);
    return { alerted: true };
  } catch (err) {
    // Alert bhejne ki dikkat se publish flow kabhi nahi rukna chahiye.
    console.error("[gmb-alert] failed:", err.message);
    return { alerted: false, reason: err.message };
  }
}

/**
 * Reconnect safal — counters saaf karo taaki agli baar (agar dobara toote) alert
 * phir se jaye. Callback isse connect hote hi call karta hai.
 */
export async function clearGmbReconnectAlert(userId) {
  if (!userId) return;
  try {
    await dbConnect();
    await GmbConnection.updateMany(
      { userId },
      { $set: { consecutiveAuthFailures: 0, reconnectAlertedAt: null } },
    );
  } catch (err) {
    console.error("[gmb-alert] clear failed:", err.message);
  }
}
