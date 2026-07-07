import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

// =============================================================
// CRON: Plan Expiry WhatsApp Automation
// =============================================================
// Kya karta hai:
//   1) Jinka plan 7 din baad expire hoga  -> reminder WhatsApp
//   2) Jinka plan expire ho chuka hai      -> expired WhatsApp
//
// AWS pe schedule kaise karein (EventBridge / cron / curl):
//   GET  https://<your-domain>/api/cron/plan-expiry-whatsapp
//   Har din 1 baar chalao (e.g. subah 9:00 AM IST).
//
// Optional query params:
//   ?mode=reminder   -> sirf 7-day reminder
//   ?mode=expired    -> sirf expired notice
//   (default: dono chalte hain)
//   ?days=7          -> reminder window override (default 7)
//   ?dry=1           -> koi message nahi bhejega, sirf preview dega
// =============================================================

export const dynamic = "force-dynamic";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";
const API_KEY = process.env.LIMBU_AI_WHATSAPP_KEY;

// Campaign names — AISENSY dashboard ke hisaab se env se override kar sakte ho
const CAMPAIGN_REMINDER =
  process.env.CAMPAIGN_PLAN_EXPIRY_REMINDER || "plan_expiry_reminder";
const CAMPAIGN_EXPIRED =
  process.env.CAMPAIGN_PLAN_EXPIRED || "plan_expired_notice";

function normalizeNumber(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  if (n.length !== 12 || !n.startsWith("91")) return null;
  return n;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function sendWhatsApp({ campaignName, phone, firstName, planName, expiryDate, invoiceUrl }) {
  const destination = normalizeNumber(phone);
  if (!destination) {
    return { ok: false, skipped: true, reason: "invalid-phone" };
  }

  const payload = {
    apiKey: API_KEY,
    campaignName,
    destination,
    userName: "YOUR_BRAND_NAME",
    templateParams: ["$FirstName", "$PlanName", "$ExpiryDate"],
    source: "cron-api",
    ...(invoiceUrl
      ? { media: { url: invoiceUrl, filename: "invoice.pdf" } }
      : {}),
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName || "Customer",
      PlanName: planName || "-",
      ExpiryDate: expiryDate || "-",
    },
  };

  try {
    const res = await fetch(AISENSY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, response: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode"); // reminder | expired | null(both)
    const dry = searchParams.get("dry") === "1";
    const reminderDays = Number(searchParams.get("days") || 7);

    const runReminder = !mode || mode === "reminder";
    const runExpired = !mode || mode === "expired";

    await dbConnect();

    // Sirf package/plan records jinki expiry date set hai
    const records = await FranchiseRevenue.find({
      type: { $in: ["user_onboard", "plan"] },
      status: { $in: ["active", "user_onboard"] },
      packageExpiryDate: { $ne: null },
    })
      .sort({ packageExpiryDate: -1 })
      .lean();

    // Ek lead ke multiple plans ho sakte hain — sirf LATEST (max expiry) lo,
    // taaki purana expired record galti se message na bheje.
    const latestByLead = {};
    for (const r of records) {
      const key = String(r.leadId);
      if (
        !latestByLead[key] ||
        new Date(r.packageExpiryDate) >
          new Date(latestByLead[key].packageExpiryDate)
      ) {
        latestByLead[key] = r;
      }
    }
    const currentPlans = Object.values(latestByLead);

    // Phone missing ho to User doc se bhar lo
    const leadIds = currentPlans.map((r) => r.leadId);
    const users = await User.find({ userId: { $in: leadIds } })
      .select("userId phone fullName name")
      .lean();
    const userMap = {};
    users.forEach((u) => (userMap[String(u.userId)] = u));

    const today = startOfDay(new Date());
    const reminderTarget = startOfDay(new Date());
    reminderTarget.setDate(reminderTarget.getDate() + reminderDays);

    const results = {
      remindersSent: 0,
      expiredSent: 0,
      skipped: 0,
      details: [],
    };

    for (const r of currentPlans) {
      const expiry = startOfDay(r.packageExpiryDate);
      const u = userMap[String(r.leadId)] || {};
      const phone = r.phone || u.phone;
      const firstName = r.leadName || u.fullName || u.name || "Customer";
      const planName = r.plan || "";
      const expiryStr = fmtDate(r.packageExpiryDate);

      // -------- 7-DAY REMINDER --------
      // Window: expiry aaj se lekar agle `reminderDays` din ke andar ho
      // (exact din pe match nahi — taaki cron ek din miss ho jaye to bhi chale)
      if (
        runReminder &&
        expiry.getTime() >= today.getTime() &&
        expiry.getTime() <= reminderTarget.getTime() &&
        // is expiry ke liye pehle reminder nahi bheja
        (!r.expiryReminderSentFor ||
          startOfDay(r.expiryReminderSentFor).getTime() !== expiry.getTime())
      ) {
        if (dry) {
          results.details.push({
            leadId: r.leadId,
            type: "reminder",
            phone,
            expiry: expiryStr,
            dry: true,
          });
          results.remindersSent++;
          continue;
        }

        const sent = await sendWhatsApp({
          campaignName: CAMPAIGN_REMINDER,
          phone,
          firstName,
          planName,
          expiryDate: expiryStr,
          invoiceUrl: r.invoiceUrl,
        });

        if (sent.ok) {
          await FranchiseRevenue.findByIdAndUpdate(r._id, {
            expiryReminderSentFor: r.packageExpiryDate,
          });
          results.remindersSent++;
        } else {
          results.skipped++;
        }

        results.details.push({
          leadId: r.leadId,
          type: "reminder",
          phone,
          expiry: expiryStr,
          ok: sent.ok,
          reason: sent.reason || sent.error,
        });
        continue;
      }

      // -------- EXPIRED NOTICE --------
      if (
        runExpired &&
        expiry.getTime() < today.getTime() &&
        (!r.expiredNoticeSentFor ||
          startOfDay(r.expiredNoticeSentFor).getTime() !== expiry.getTime())
      ) {
        if (dry) {
          results.details.push({
            leadId: r.leadId,
            type: "expired",
            phone,
            expiry: expiryStr,
            dry: true,
          });
          results.expiredSent++;
          continue;
        }

        const sent = await sendWhatsApp({
          campaignName: CAMPAIGN_EXPIRED,
          phone,
          firstName,
          planName,
          expiryDate: expiryStr,
          invoiceUrl: r.invoiceUrl,
        });

        if (sent.ok) {
          await FranchiseRevenue.findByIdAndUpdate(r._id, {
            expiredNoticeSentFor: r.packageExpiryDate,
          });
          results.expiredSent++;
        } else {
          results.skipped++;
        }

        results.details.push({
          leadId: r.leadId,
          type: "expired",
          phone,
          expiry: expiryStr,
          ok: sent.ok,
          reason: sent.reason || sent.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      scanned: currentPlans.length,
      reminderDays,
      dry,
      ...results,
    });
  } catch (error) {
    console.error("PLAN EXPIRY CRON ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
