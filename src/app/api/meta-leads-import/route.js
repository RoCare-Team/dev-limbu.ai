import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fetch from "node-fetch";
import User from "@/models/User";
import MetaSync from "@/models/MetaSync";
import Admin from "@/models/Admin";

export const dynamic = "force-dynamic";

const LIMIT = 3000;
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
  await mongoose.connect(MONGODB_URI);
}

/* ================= HELPERS ================= */
function getField(fields = [], name) {
  return fields.find(f => f.name === name)?.values?.[0] || "";
}

function cleanPhone(phone) {
  if (!phone) return "";
  phone = String(phone).replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length === 12) phone = phone.slice(2);
  return phone.length === 10 ? phone : "";
}

/* ================= WHATSAPP ================= */
async function sendWhatsApp(phone, fullName) {
  try {
    await fetch("https://limbu.ai/api/whatsapp-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination: phone,
        templateParams: [fullName, "https://limbu.ai"],
      }),
    });
  } catch (err) {
    console.error("WhatsApp Error:", err.message);
  }
}

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

    // Fetch active agents for Round Robin
    const activeAgents = await Admin.find({ role: "agent", isActive: true }).sort({ createdAt: 1, _id: 1 });

    const { searchParams } = new URL(req.url);
    const formId = process.env.META_FORM_ID || searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "formId required" },
        { status: 400 }
      );
    }

    let sync = await MetaSync.findOne({ formId });
    let after = sync?.lastAfterCursor || null;

    let inserted = 0;
    let skipped = 0;
    let totalFetched = 0;
    let lastCursor = after;

    do {
      let url = `https://graph.facebook.com/v24.0/${formId}/leads?limit=${LIMIT}&access_token=${META_ACCESS_TOKEN}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) break;

      const leads = json.data || [];
      totalFetched += leads.length;

      for (const lead of leads) {
        const fields = lead.field_data || [];

        const fullName = getField(fields, "full_name");
        const email = getField(fields, "email").toLowerCase().trim();
        const phone = cleanPhone(getField(fields, "phone_number"));
        const city = getField(fields, "city");

        if (!email || !phone) {
          skipped++;
          continue;
        }

        const exists = await User.findOne({ $or: [{ email }, { phone }] });
        if (exists) {
          skipped++;
          continue;
        }

        // Round Robin Logic
        let assignedAgentId = null;
        if (activeAgents && activeAgents.length > 0) {
          const RR_KEY = "agentLeadRR";
          const rrDoc = await Setting.findOneAndUpdate(
            { key: RR_KEY },
            { $inc: { value: 1 }, $setOnInsert: { key: RR_KEY, value: -1 } },
            { new: true, upsert: true }
          );

          let rrValue = parseInt(rrDoc?.value, 10);
          if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

          assignedAgentId = activeAgents[rrValue % activeAgents.length]._id;
        }

        await User.create({
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
          whatsappSent: true,
          tataCallSent: true,
          assignedAgentId,
        });

        inserted++;

        // 🔥 AUTOMATION
        await sendWhatsApp(phone, fullName);
        await sendToTataDialer(phone, fullName);
      }

      after = json.paging?.cursors?.after;
      lastCursor = after;

      if (!json.paging?.next) break;

    } while (after);

    await MetaSync.updateOne(
      { formId },
      { lastAfterCursor: lastCursor, lastSyncedAt: new Date() },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Leads synced, WhatsApp + Tata AutoDial done",
      stats: { totalFetched, inserted, skipped },
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
