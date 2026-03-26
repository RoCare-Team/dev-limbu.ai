import { NextResponse } from "next/server";
import mongoose from "mongoose";

/* ================= MONGODB CONNECTION ================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

/* ================= SCHEMA ================= */

const CallSchema = new mongoose.Schema(
  {
    mobile_no: String,
    agent_mobile: String,
    answered_agent_number: String,
    did_number: String,
    call_status: String,
    uuid: String,
    caller_id_number: String,
    duration: String,
    recording_url: String,
    customer_no_with_prefix: String,
    hangup_cause: String,
    direction: String,
    action_date_time: String,
    call_id: String,
    call_date: String,
    api_page_name: String,
    digit_pressed: String,
    billing_circle: Object,
    campaign_id: String,
    campaign_name: String,
    whatsapp_sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Call =
  mongoose.models.Call ||
  mongoose.model("Call", CallSchema, "dialer_call_status_tatas");

/* ================= AISENSY CONFIG ================= */

const AISENSY_URL =
  "https://backend.aisensy.com/campaign/t1/api/v2";

const CAMPAIGN_CONFIG = {
  session4pm_new: {
    mediaUrl:
      "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  },
  session530pm_new: {
    mediaUrl:
      "https://limbuai.s3.ap-south-1.amazonaws.com/2WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  },
};

/* ================= HELPERS ================= */

const normalizeNumber = (num) => {
  if (!num) return null;

  let n = num.toString().replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;

  return n.length === 12 ? n : null;
};

async function sendWhatsApp(number, campaignName, userName = "User") {
  const destination = normalizeNumber(number);
  if (!destination) return false;

  if (!CAMPAIGN_CONFIG[campaignName]) return false;

  try {
    const payload = {
      apiKey: process.env.AISENSY_API_KEY,
      campaignName,
      destination,
      userName: "LimbuAI",

      templateParams: [
        "https://us06web.zoom.us/meeting/register/GdVk9iYlRgWL4Y1wC721_A",
        "883 7574 4050",
        "916645",
      ],

      source: "incoming-ivr",

      media: {
        url: CAMPAIGN_CONFIG[campaignName].mediaUrl,
        filename: "session_image",
      },

      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},

      paramsFallbackValue: {
        FirstName: userName,
      },
    };

    const res = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    return json?.success === true || json?.success === "true";
  } catch (error) {
    console.error("WhatsApp Error:", error);
    return false;
  }
}

/* ================= POST WEBHOOK ================= */

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      uuid = "",
      call_to_number = "",
      caller_id_number = "",
      answered_agent_number = "",
      call_status = "",
      duration = "",
      recording_url = "",
      customer_no_with_prefix = "",
      hangup_cause = "",
      direction = "inbound",
      call_id = "",
      digit_pressed = "",
      billing_circle = "",
      campaign_id = "",
      campaign_name = "",
      userName = "User", // ✅ frontend se aayega
    } = body;

    let did_number = "";
    let customer_number = "";
    let agent_mobile = "";

    if (direction === "inbound") {
      did_number = call_to_number;
      customer_number = caller_id_number;
      agent_mobile = answered_agent_number;
    } else {
      did_number = caller_id_number;
      customer_number = call_to_number;
      agent_mobile = answered_agent_number;
    }

    const now = new Date();
    const action_date_time = now
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const call_date = now.toISOString().split("T")[0];

    /* ================= SAVE DATA ================= */

    const savedCall = await Call.create({
      mobile_no: customer_number,
      agent_mobile,
      answered_agent_number,
      did_number,
      call_status,
      uuid,
      caller_id_number,
      duration,
      recording_url,
      customer_no_with_prefix,
      hangup_cause,
      direction,
      action_date_time,
      call_id,
      call_date,
      api_page_name: "incoming_ivr_api",
      digit_pressed,
      billing_circle,
      campaign_id,
      campaign_name,
    });

    /* ================= WHATSAPP TRIGGER ================= */

    if (digit_pressed === "1" && !savedCall.whatsapp_sent) {
      const sent = await sendWhatsApp(
        customer_no_with_prefix,
        "session4pm_new",
        userName // ✅ frontend name
      );

      if (sent) {
        savedCall.whatsapp_sent = true;
        await savedCall.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Call stored & WhatsApp triggered",
    });
  } catch (error) {
    console.error("Webhook Error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ================= GET API ================= */

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // ✅ FILTERS
    const search = searchParams.get("search");
    const mobile_no = searchParams.get("mobile_no");
    const digit_pressed = searchParams.get("digit_pressed");
    const campaign_name = searchParams.get("campaign_name");
    const direction = searchParams.get("direction");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    // ✅ GLOBAL SEARCH
    if (search) {
      query.$or = [
        { mobile_no: { $regex: search, $options: "i" } },
        { customer_no_with_prefix: { $regex: search, $options: "i" } },
        { campaign_name: { $regex: search, $options: "i" } },
        { call_id: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ INDIVIDUAL FILTERS
    if (mobile_no) {
      query.mobile_no = mobile_no;
    }

    if (digit_pressed) {
      query.digit_pressed = digit_pressed;
    }

    if (campaign_name) {
      query.campaign_name = campaign_name;
    }

    if (direction) {
      query.direction = direction;
    }

    // ✅ DATE FILTER (IMPORTANT FIX 🔥)
    if (start_date && end_date) {
      query.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    // ✅ FETCH DATA
    const total = await Call.countDocuments(query);

    const data = await Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // 🔥 performance boost

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      data,
    });

  } catch (error) {
    console.error("GET API ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}