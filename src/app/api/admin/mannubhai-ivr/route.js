import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

const AISENSY_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

const MONGODB_URI = process.env.MONGODB_URI;

/* ================= DB CONNECT ================= */
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(mongooseConnectionUri(MONGODB_URI));
  isConnected = true;
}

/* ================= SCHEMA ================= */
const IvrSchema = new mongoose.Schema({}, { strict: false });

const IvrModel =
  mongoose.models.incoming_ivr_mannubhais ||
  mongoose.model(
    "incoming_ivr_mannubhais",
    IvrSchema,
    "incoming-ivr-mannubhais"
  );

/* ================= NORMALIZE NUMBER ================= */
const normalizeNumber = (num) => {
  if (!num) return null;

  let n = num.toString().replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;

  return n.length === 12 ? n : null;
};

/* ================= POST ================= */
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { campaignName } = body;

    if (!campaignName) {
      return NextResponse.json(
        { success: false, message: "campaignName required" },
        { status: 400 }
      );
    }

    // 🔥 Step 1: Fetch from MongoDB
    const ivrUsers = await IvrModel.find({
      call_status: "answered",
    });

    if (!ivrUsers.length) {
      return NextResponse.json({
        success: false,
        message: "No answered calls found",
      });
    }

    let sent = 0;
    const results = [];

    // 🔥 Step 2: Hit AISensy for each
    for (const user of ivrUsers) {
      const destination = normalizeNumber(
        user.customer_no_with_prefix
      );

      if (!destination) {
        results.push({
          number: user.customer_no_with_prefix,
          status: "Invalid number",
        });
        continue;
      }

      const payload = {
        apiKey: process.env.AISENSY_API_KEY,
        campaignName,
        destination,
        userName: "MannuBhai",

        templateParams: [],

        source: "IVR Campaign",

        media: {
          url: "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-26+at+3.37.30+PM.jpeg",
          filename: "session_image",
        },

        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {},
      };

      try {
        const response = await fetch(AISENSY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json();

        if (json?.success === "true") {
          sent++;
          results.push({
            number: destination,
            status: "Sent",
            messageId: json.submitted_message_id || null,
          });
        } else {
          results.push({
            number: destination,
            status: "Failed",
            response: json,
          });
        }
      } catch (err) {
        results.push({
          number: destination,
          status: "Error",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalFetched: ivrUsers.length,
      sent,
      failed: ivrUsers.length - sent,
      details: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}