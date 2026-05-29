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

async function getNextAgentId(activeAgents = []) {
  if (!activeAgents.length) return null;

  const RR_KEY = "agentLeadRR";
  const rrDoc = await bumpAgentRoundRobin(Setting, RR_KEY);
  let rrValue = parseInt(rrDoc?.value, 10);
  if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

  const index = rrValue % activeAgents.length;
  const agentId = activeAgents[index]._id;
  console.log(
    `[MetaSync] Round-robin assigned agent index: ${index} | agentId: ${agentId}`,
  );
  return agentId;
}

/* ================= TATA AUTODIAL ================= */
async function sendToTataDialer(phone, fullName) {
  const ids = ["827981"];
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
      console.log(`[Tata Dialer] Response (${id}):`, data);

    } catch (err) {
      console.error(`[Tata Dialer] Error (${id}):`, err.message);
    }
  }
}

/* ================= DATE HELPERS ================= */
function isToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
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

    const activeAgents = await Admin.find({ role: "agent", isActive: true }).sort({ createdAt: 1, _id: 1 });
    console.log(`[MetaSync] Active agents for round-robin: ${activeAgents.length}`);

    const formId = process.env.META_FORM_ID || searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "formId required" },
        { status: 400 }
      );
    }

    console.log(`\n========== [MetaSync] START — FormID: ${formId} — ${new Date().toISOString()} ==========`);

    let inserted = 0;
    let updated = 0;
    let assigned = 0;
    let skipped = 0;
    let totalFetched = 0;
    let pagesFetched = 0;
    let lastCursor = null;

    // ✅ Aaj ke inserted leads track karne ke liye
    const todayInserted = [];

    let nextUrl = `https://graph.facebook.com/v24.0/${formId}/leads?limit=${LIMIT}&access_token=${META_ACCESS_TOKEN}`;

    while (nextUrl) {
      const res = await fetch(nextUrl);
      const json = await res.json();

      if (!res.ok) {
        const msg =
          json?.error?.message ||
          json?.error?.error_user_msg ||
          `Graph API error (${res.status})`;
        console.error("[MetaSync] Graph API Error:", msg, json?.error);
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
      console.log(`[MetaSync] Page ${pagesFetched} — ${leads.length} leads fetched from Meta`);

      if (json.paging?.cursors?.after) {
        lastCursor = json.paging.cursors.after;
      }

      for (const lead of leads) {
        const fields = lead.field_data || [];

        // ✅ Raw fields debug log — pehli baar chalao to dekho Meta kya bhej raha hai
        console.log(`\n[MetaSync] Lead ID: ${lead.id} | created_time: ${lead.created_time}`);
        console.log(`[MetaSync] Raw field_data:`, JSON.stringify(fields, null, 2));

        const fullName = extractFullNameFromFields(fields);
        const email = extractEmailFromFields(fields);
        const phone = extractPhoneFromFields(fields);
        const city = getFieldByAliases(fields, ["city", "location", "area", "district"]);

        console.log(`[MetaSync] Extracted → Name: "${fullName}" | Email: "${email}" | Phone: "${phone}" | City: "${city}"`);

        // ❌ SKIP REASON LOG
        if (!email || !phone) {
          console.warn(`[MetaSync] ⚠️  SKIPPED (missing field) — Lead ID: ${lead.id} | email: "${email}" | phone: "${phone}"`);
          skipped++;
          continue;
        }

        const createdAt = parseMetaCreatedAt(lead.created_time);

        const exists = await User.findOne({ $or: [{ email }, { phone }] });
        if (exists) {
          let assignedAgentId = exists.assignedAgentId || null;
          if (!assignedAgentId && activeAgents.length > 0) {
            assignedAgentId = await getNextAgentId(activeAgents);
            if (assignedAgentId) assigned++;
          }

          await User.updateOne(
            { _id: exists._id },
            {
              $set: {
                fullName: exists.fullName || fullName,
                email: exists.email || email,
                phone: exists.phone || phone,
                city: exists.city || city,
                source: "Meta Lead",
                metaLeadId: lead.id,
                metaFormId: formId,
                metaCreatedAt: createdAt,
                metaSyncedAt: new Date(),
                assignedAgentId: assignedAgentId || null,
              },
              $addToSet: { leadTags: "metaleads" },
            },
          );
          console.log(`[MetaSync] UPDATED duplicate Meta lead - email: "${email}" | phone: "${phone}" | existing userId: ${exists.userId} | agentId: ${assignedAgentId || "Unassigned"}`);
          updated++;
          skipped++;
          continue;
        }
        // Round Robin Logic
        const assignedAgentId = await getNextAgentId(activeAgents);
        if (assignedAgentId) assigned++;

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
          source: "Meta Lead",
          leadTags: ["metaleads"],
          metaLeadId: lead.id,
          metaFormId: formId,
          metaCreatedAt: createdAt,
          metaSyncedAt: new Date(),
          whatsappSent: true,
          tataCallSent: true,
          assignedAgentId,
          createdAt,
          updatedAt: createdAt,
        });

        console.log(`[MetaSync] ✅ INSERTED — userId: ${createdLead.userId} | Name: "${fullName}" | Email: "${email}" | Phone: "${phone}" | Meta createdAt: ${createdAt.toISOString()}`);

        inserted++;

        // ✅ Aaj ka lead track karo
        if (isToday(createdAt)) {
          todayInserted.push({
            userId: createdLead.userId,
            fullName,
            email,
            phone,
            city,
            assignedAgentId,
            metaCreatedAt: createdAt.toISOString(),
          });
        }

        void runWelcomeBonusForUserId(createdLead.userId).catch((err) =>
          console.error("[MetaSync] runWelcomeBonusForUserId error:", err),
        );

        void runNewUserOnboarding(createdLead.userId).catch((err) =>
          console.error("[MetaSync] runNewUserOnboarding error:", err),
        );

        await sendToTataDialer(phone, fullName);
      }

      nextUrl = json.paging?.next || null;
    }

    await MetaSync.updateOne(
      { formId },
      { lastAfterCursor: lastCursor, lastSyncedAt: new Date() },
      { upsert: true }
    );

    // ✅ Aaj ke leads ka summary console
    console.log(`\n========== [MetaSync] TODAY'S NEW META LEADS (${new Date().toDateString()}) ==========`);
    if (todayInserted.length === 0) {
      console.log("[MetaSync] Aaj koi naya meta lead save nahi hua.");
    } else {
      console.log(`[MetaSync] Aaj ${todayInserted.length} naye meta leads save hue:\n`);
      todayInserted.forEach((lead, i) => {
        console.log(
          `  ${i + 1}. userId: ${lead.userId}\n` +
          `     Name: ${lead.fullName}\n` +
          `     Email: ${lead.email}\n` +
          `     Phone: ${lead.phone}\n` +
          `     City: ${lead.city || "N/A"}\n` +
          `     AgentId: ${lead.assignedAgentId || "Unassigned"}\n` +
          `     Meta createdAt: ${lead.metaCreatedAt}\n`
        );
      });
    }
    console.log(`========== [MetaSync] END - inserted: ${inserted} | updated: ${updated} | assigned: ${assigned} | skipped: ${skipped} | totalFetched: ${totalFetched} ==========\n`);

    const [usersSignup, usersMetaSources] = await Promise.all([
      User.countDocuments({ source: "signup" }),
      User.countDocuments({
        $or: [
          {
            source: {
              $in: [
                "Meta Lead",
                "Meta Leads",
                "Meta",
                "bulk-upload",
                "manual-upload",
                "csv-import",
                "excel-import",
              ],
            },
          },
          { leadTags: "metaleads" },
        ],
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Leads synced, WhatsApp + Tata AutoDial done",
      stats: {
        pagesFetched,
        totalFetched,
        inserted,
        updated,
        assigned,
        skipped,
        todayInsertedCount: todayInserted.length,
        todayInsertedLeads: todayInserted,        // ← API response mein bhi milega
        usersInDbSignup: usersSignup,
        usersInDbBulkUpload: usersMetaSources,
      },
    });

  } catch (err) {
    console.error("[MetaSync] FATAL ERROR:", err.message, err.stack);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
