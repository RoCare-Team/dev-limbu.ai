import { NextResponse } from "next/server";
import mongoose from "mongoose";
import FranchiseIvrCall from "@/models/FranchiseIvrCall";
import Lead from "@/models/MetaLeadFranchises";
import { markLeadsIvrInterestedForPhone } from "@/lib/syncFranchiseIvrInterest";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

/* ================= MONGODB CONNECTION ================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(mongooseConnectionUri(MONGODB_URI), {
      bufferCommands: false,
    });
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}
/* ================= AISENSY CONFIG ================= */

const AISENSY_URL =
  "https://backend.aisensy.com/campaign/t1/api/v2";

const MEDIA = {
  session4pm:
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  demo_session_confirmation1:
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-04+at+12.14.21+PM.jpeg",
};

const normalizeNumber = (num) => {
  if (!num) return null;
  let n = num.replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n.length === 12 ? n : null;
};

// async function sendWhatsApp(number, campaignName) {
//   const destination = normalizeNumber(number);
//   if (!destination) return false;

//   const res = await fetch(AISENSY_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzZhOWFjMTNhNjFmMGQ3YjExYmQ1NCIsIm5hbWUiOiJMaW1idUFJIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY2NjhhNWZmYTNhMzhjNTJhMDVmZDYzOCIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NjUxOTAwNjB9.Xps-oRJ5QqgkCs5BaBuPd1KS9Yxnv4D2PCYB-g5zgr4",
//       campaignName,
//       destination,
//       userName: "LimbuAI",
//       templateParams: [],
//       source: "incoming-ivr-franchise",
//       media: {
//         url: MEDIA[campaignName],
//         filename: "session",
//       },
//     }),
//   });

//   const json = await res.json();
//   return json?.success === "true";
// }

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
    const action_date_time = now.toISOString().slice(0, 19).replace("T", " ");
    const call_date = now.toISOString().split("T")[0];

    // ✅ SAVE DATA
    const savedCall = await FranchiseIvrCall.create({
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

    await markLeadsIvrInterestedForPhone(did_number, Lead, now);
    await markLeadsIvrInterestedForPhone(customer_number, Lead, now);

    // ✅ REAL-TIME WHATSAPP TRIGGER
    // if (digit_pressed === "1" && !savedCall.whatsapp_sent) {
    //   const sent = await sendWhatsApp(
    //     customer_no_with_prefix,
    //     "session4pm"
    //   );

    //   if (sent) {
    //     savedCall.whatsapp_sent = true;
    //     await savedCall.save();
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: "Call stored",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const mobile_no = searchParams.get("mobile_no");
    const digit_pressed = searchParams.get("digit_pressed");
    const campaign_name = searchParams.get("campaign_name");
    const direction = searchParams.get("direction");

    // ✅ DATE RANGE
    const start_date = searchParams.get("start_date"); // yyyy-mm-dd
    const end_date = searchParams.get("end_date");     // yyyy-mm-dd

    // Pagination
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    /* ================= MAIN SEARCH (searches across multiple fields) ================= */
    if (search) {
      query.$or = [
        { customer_no_with_prefix: { $regex: search, $options: "i" } },
        { mobile_no: { $regex: search, $options: "i" } },
        { campaign_name: { $regex: search, $options: "i" } },
      ];
    }

    if (mobile_no) {
      query.mobile_no = { $regex: mobile_no, $options: "i" };
    }

    if (digit_pressed) {
      query.digit_pressed = digit_pressed;
    }

    if (campaign_name) {
      query.campaign_name = {
        $regex: campaign_name,
        $options: "i",
      };
    }

    if (direction) {
      query.direction = direction;
    }

    /* ================= DATE RANGE FILTER (FIX) ================= */
    if (start_date && end_date) {
      const start = new Date(start_date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const total = await FranchiseIvrCall.countDocuments(query);

    const data = await FranchiseIvrCall.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
