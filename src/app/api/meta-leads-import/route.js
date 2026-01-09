import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fetch from "node-fetch";
import User from "@/models/User";
import MetaSync from "@/models/MetaSync";

export const dynamic = "force-dynamic";

const LIMIT = 2000;
const META_ACCESS_TOKEN = "EAAWOiqBorGUBQQD5h0FAtsmhyrdTCG0JiO6YqenXR1IInaUh6Wa7WqfvGc6D6bcqSHUcyRLcUa22JZAs4oKcAxJHqSfwXAqsMVSptToi8oIRmzZAXMAIWDQWuaR3rReSifeGDGLaiorT28OMiF2t54CbEqBdwpBSjJfcCVBZBIJ9qyq7Ht8d3sZCXVw0";
const MONGODB_URI = process.env.MONGODB_URI;

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
  } catch {}
}

/* ================= API ================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const formId = process.env.META_FORM_ID || searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ success: false, error: "formId required" }, { status: 400 });
    }

    // 🔐 GET LAST SYNC
    let sync = await MetaSync.findOne({ formId });
    let after = sync?.lastAfterCursor || null;

    let inserted = 0;
    let skipped = 0;
    let totalFetched = 0;
    let lastCursor = after;

    do {
      let url = `https://graph.facebook.com/v24.0/${formId}/leads?limit=${LIMIT}&access_token=${META_ACCESS_TOKEN}`;
      // if (after) url += `&after=${after}`;

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
        });

        inserted++;
        await sendWhatsApp(phone, fullName);
      }

      after = json.paging?.cursors?.after;
      lastCursor = after;

      if (!json.paging?.next) break;

    } while (after);

    // 🔐 SAVE LAST CURSOR
    await MetaSync.updateOne(
      { formId },
      { lastAfterCursor: lastCursor, lastSyncedAt: new Date() },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Only NEW leads processed",
      stats: { totalFetched, inserted, skipped },
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
