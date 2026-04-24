import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fetch from "node-fetch";
import User from "@/models/User";
import MetaSync from "@/models/MetaSync";
import Admin from "@/models/Admin";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import { runNewUserOnboarding } from "@/lib/onboardingNewUser";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";

export const dynamic = "force-dynamic";

const LIMIT = 10000;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const TATA_TOKEN = process.env.TATA_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;

// Define Setting Schema for Round Robin
const SettingSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: Number, default: -1 },
});
const Setting = mongoose.models.settings || mongoose.model("settings", SettingSchema);

/* ================= DB ================= */
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(mongooseConnectionUri(MONGODB_URI));
}

/* ================= HELPERS ================= */
function normalizeFieldKey(n) {
  return String(n || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Match Meta field_data `name` to standard keys (handles custom question labels). */
function getFieldByAliases(fields = [], aliases = []) {
  const want = new Set(aliases.map(normalizeFieldKey));
  for (const f of fields) {
    if (want.has(normalizeFieldKey(f.name))) {
      const v = f.values?.[0];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return "";
}

const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function extractEmailFromFields(fields = []) {
  const direct = getFieldByAliases(fields, [
    "email",
    "work_email",
    "business_email",
    "email_address",
    "contact_email",
  ]);
  if (direct) return direct.toLowerCase().trim();

  for (const f of fields) {
    for (const val of f.values || []) {
      const m = String(val).match(EMAIL_IN_TEXT);
      if (m) return m[0].toLowerCase().trim();
    }
  }
  return "";
}

function cleanPhone(phone) {
  if (!phone) return "";
  phone = String(phone).replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length === 12) phone = phone.slice(2);
  return phone.length === 10 ? phone : "";
}

function extractPhoneFromFields(fields = []) {
  const direct = getFieldByAliases(fields, [
    "phone_number",
    "phone",
    "mobile",
    "mobile_number",
    "contact_number",
    "whatsapp",
    "whatsapp_number",
  ]);
  let p = cleanPhone(direct);
  if (p) return p;

  for (const f of fields) {
    for (const val of f.values || []) {
      p = cleanPhone(val);
      if (p) return p;
    }
  }
  return "";
}

function extractFullNameFromFields(fields = []) {
  let name = getFieldByAliases(fields, [
    "full_name",
    "full name",
    "name",
    "your_name",
    "business_owner_name",
  ]);
  if (name) return name;

  const first = getFieldByAliases(fields, ["first_name", "first name", "given_name"]);
  const last = getFieldByAliases(fields, ["last_name", "last name", "surname"]);
  if (first || last) return [first, last].filter(Boolean).join(" ").trim();

  for (const f of fields) {
    const v = f.values?.[0];
    if (v == null || !String(v).trim()) continue;
    const s = String(v).trim();
    if (EMAIL_IN_TEXT.test(s)) continue;
    if (cleanPhone(s)) continue;
    if (/^(yes|no)$/i.test(s)) continue;
    if (s.length > 1) return s;
  }
  return "Meta Lead";
}

function parseMetaCreatedAt(createdTime) {
  if (!createdTime) return new Date();
  const d = new Date(createdTime);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Atomic round-robin counter. Avoids $inc + $setOnInsert on same path (MongoDB conflict on `value`). */
async function bumpAgentRoundRobin(SettingModel, rrKey) {
  const doc = await SettingModel.findOneAndUpdate(
    { key: rrKey },
    [
      {
        $set: {
          key: rrKey,
          value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
        },
      },
    ],
    { new: true, upsert: true }
  );
  return doc;
}

/* ================= WHATSAPP ================= */
// async function sendWhatsApp(phone, fullName) {
//   try {
//     await fetch("https://limbu.ai/api/whatsapp-message", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         destination: phone,
//         templateParams: [fullName, "https://limbu.ai"],
//       }),
//     });
//   } catch (err) {
//     console.error("WhatsApp Error:", err.message);
//   }
// }

/* ================= TATA AUTODIAL ================= */
async function sendToTataDialer(phone, fullName) {
  // Har din chalega
  const ids = ["827981"];

  // Friday ko extra ID bhi chalegi
  if (new Date().getDay() === 5) {
    ids.push("830002");
  }

  for (const id of ids) {
    try {
      const res = await fetch(
        `https://api-smartflo.tatateleservices.com/v1/broadcast/lead/${id}`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${TATA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field_0: phone,
            field_1: fullName,
          }),
        }
      );

      const data = await res.json();
      console.log(`Tata Dialer Response (${id}):`, data);

    } catch (err) {
      console.error(`Tata Dialer Error (${id}):`, err.message);
    }
  }
}


/* ================= API ================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    const isCronAuthOk =
      isVercelCron ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthOk) {
      const adminEmail = searchParams.get("email");
      if (!adminEmail) {
        return NextResponse.json(
          { success: false, error: "email required" },
          { status: 401 }
        );
      }

      const admin = await Admin.findOne({ email: adminEmail }).select("role");
      if (!admin || !["superAdmin", "admin"].includes(admin.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Fetch active agents for Round Robin
    const activeAgents = await Admin.find({ role: "agent", isActive: true }).sort({ createdAt: 1, _id: 1 });

    const formId = process.env.META_FORM_ID || searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "formId required" },
        { status: 400 }
      );
    }

    let inserted = 0;
    let skipped = 0;
    let totalFetched = 0;
    let pagesFetched = 0;
    let lastCursor = null;

    // Follow Meta's paging.next so every page is fetched (previously only page 1 loaded; after cursor was never sent).
    let nextUrl = `https://graph.facebook.com/v24.0/${formId}/leads?limit=${LIMIT}&access_token=${META_ACCESS_TOKEN}`;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const json = await res.json();

      if (!res.ok) {
        const msg =
          json?.error?.message ||
          json?.error?.error_user_msg ||
          `Graph API error (${res.status})`;
        return NextResponse.json(
          {
            success: false,
            error: msg,
            graphError: json?.error || null,
          },
          { status: 502 }
        );
      }

      pagesFetched++;
      const leads = json.data || [];
      totalFetched += leads.length;

      if (json.paging?.cursors?.after) {
        lastCursor = json.paging.cursors.after;
      }

      for (const lead of leads) {
        const fields = lead.field_data || [];

        const fullName = extractFullNameFromFields(fields);
        const email = extractEmailFromFields(fields);
        const phone = extractPhoneFromFields(fields);
        const city = getFieldByAliases(fields, ["city", "location", "area", "district"]);

        if (!email || !phone) {
          skipped++;
          continue;
        }

        const exists = await User.findOne({ $or: [{ email }, { phone }] });
        if (exists) {
          skipped++;
          continue;
        }

        const createdAt = parseMetaCreatedAt(lead.created_time);

        // Round Robin Logic
        let assignedAgentId = null;
        if (activeAgents && activeAgents.length > 0) {
          const RR_KEY = "agentLeadRR";
          const rrDoc = await bumpAgentRoundRobin(Setting, RR_KEY);

          let rrValue = parseInt(rrDoc?.value, 10);
          if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

          assignedAgentId = activeAgents[rrValue % activeAgents.length]._id;
        }

        const createdLead = await User.create({
          userId: `USR${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          fullName,
          email,
          phone,
          city,
          wallet: 500,
          freeUsedCount: 2,
          subscription: {
            status: "inactive",
            plan: "Free",
          },
          source: "bulk-upload",
          leadTags: ["metaleads"],
          whatsappSent: true,
          tataCallSent: true,
          assignedAgentId,
          createdAt,
          updatedAt: createdAt,
        });

        inserted++;

        void runWelcomeBonusForUserId(createdLead.userId).catch((err) =>
          console.error("runWelcomeBonusForUserId", err),
        );

        void runNewUserOnboarding(createdLead.userId).catch((err) =>
          console.error("runNewUserOnboarding", err),
        );

        // 🔥 AUTOMATION
        // await sendWhatsApp(phone, fullName);
        await sendToTataDialer(phone, fullName);
      }

      nextUrl = json.paging?.next || null;
    }

    await MetaSync.updateOne(
      { formId },
      { lastAfterCursor: lastCursor, lastSyncedAt: new Date() },
      { upsert: true }
    );

    const [usersSignup, usersMetaSources] = await Promise.all([
      User.countDocuments({ source: "signup" }),
      User.countDocuments({ source: "bulk-upload" }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Leads synced, WhatsApp + Tata AutoDial done",
      stats: {
        pagesFetched,
        totalFetched,
        inserted,
        skipped,
        usersInDbSignup: usersSignup,
        usersInDbBulkUpload: usersMetaSources,
      },
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
