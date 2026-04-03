// app/api/webhook/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

// =============================
// 🔗 MONGODB CONNECT (lazy — only on first request)
// =============================
function ensureMongoConnection() {
  if (!global._mongooseConnection) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");
    global._mongooseConnection = mongoose.connect(mongooseConnectionUri(MONGODB_URI), {
      bufferCommands: false,
    });
  }
  return global._mongooseConnection;
}

// =============================
// 📌 SCHEMA + MODEL (Same File)
// =============================
const fbLeadsSchema = new mongoose.Schema(
  {
    type: String, // leadgen | whatsapp
    leadId: String,
    formId: String,
    messageFrom: String,
    messageText: String,
    payload: Object,
  },
  { timestamps: true }
);

const FbLeadsData =
  mongoose.models.fbLeadsData ||
  mongoose.model("fbLeadsData", fbLeadsSchema);

// =============================
// 🔐 VERIFY TOKEN
// =============================
const VERIFY_TOKEN = "limbu123";

// =============================
// GET → Facebook Webhook Verification
// =============================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Invalid verify token", { status: 403 });
}

// =============================
// POST → Save Leads / WhatsApp
// =============================
export async function POST(req) {
  try {
    await ensureMongoConnection(); // ensure DB connected
    const body = await req.json();

    console.log("WEBHOOK EVENT:", JSON.stringify(body, null, 2));

    if (body.entry?.length > 0) {
      const entry = body.entry[0];
      const change = entry.changes?.[0];

      // ------------------------------
      // CASE 1 → Facebook LeadGen
      // ------------------------------
      if (change?.field === "leadgen") {
        const data = change.value;

        await FbLeadsData.create({
          type: "leadgen",
          leadId: data.leadgen_id,
          formId: data.form_id,
          payload: data,
        });

        console.log("✔ Lead saved:", data.leadgen_id);
      }

      // ------------------------------
      // CASE 2 → WhatsApp Messages
      // ------------------------------
      else if (change?.field === "messages") {
        const msg = change.value.messages?.[0];

        await FbLeadsData.create({
          type: "whatsapp",
          messageFrom: msg?.from,
          messageText: msg?.text?.body || "[Media]",
          payload: msg,
        });

        console.log("✔ WhatsApp saved:", msg?.from);
      }

      // ------------------------------
      // ALT WhatsApp Structure
      // ------------------------------
      else if (body.object === "whatsapp_business_account") {
        const msg = entry.chchanges?.[0]?.value?.messages?.[0];

        await FbLeadsData.create({
          type: "whatsapp",
          messageFrom: msg?.from,
          messageText: msg?.text?.body || "[Media]",
          payload: msg,
        });

        console.log("✔ WhatsApp ALT saved:", msg?.from);
      }
    }

    return NextResponse.json({ success: true, message: "EVENT_RECEIVED" });
  } catch (err) {
    console.log("Webhook Error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
