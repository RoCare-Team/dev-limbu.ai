import { NextResponse } from "next/server";
import mongoose from "mongoose";

/* ------------------ */
/* MongoDB Connection */
/* ------------------ */

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

/* ------------------ */
/* Schema             */
/* ------------------ */

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
  },
  { timestamps: true }
);

const Call =
  mongoose.models.dialer_call_status_tata ||
  mongoose.model("dialer_call_status_tata", CallSchema);

/* ------------------ */
/* API Handler        */
/* ------------------ */

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    /* ------------------ */
    /* Normalize Payload  */
    /* ------------------ */

    const data = {
      ...body,
      customer_no_with_prefix:
        body.customer_no_with_prefix ||
        body.customer_number_with_prefix ||
        body["customer_no_with_prefix "], // handle wrong key
    };

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
      date = "",
      campaign_id = "",
      campaign_name = "",
    } = data;

    /* ------------------ */
    /* Direction Logic    */
    /* ------------------ */

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

    /* ------------------ */
    /* Date Handling      */
    /* ------------------ */

    const now = new Date();
    const action_date_time = now.toISOString().slice(0, 19).replace("T", " ");
    const call_date = date || now.toISOString().split("T")[0];

    /* ------------------ */
    /* Save to MongoDB    */
    /* ------------------ */

    await Call.create({
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

    return NextResponse.json({
      success: true,
      message: "Call data stored successfully",
      call_to_number,
    });
  } catch (error) {
    console.error("Webhook Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    // Filters
    const mobile_no = searchParams.get("mobile_no");
    const digit_pressed = searchParams.get("digit_pressed");
    const campaign_name = searchParams.get("campaign_name");
    const direction = searchParams.get("direction");
    const date = searchParams.get("date"); // yyyy-mm-dd

    // Pagination
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    /* ---------------- Build Query ---------------- */
    const query = {};

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

    // ✅ DATE FILTER (REAL FIX)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    /* ---------------- Data ---------------- */
    const total = await Call.countDocuments(query);

    const data = await Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    /* ---------------- digit_pressed = 1 ---------------- */
    const digit_pressed_1_data = await Call.find({
      digit_pressed: "1",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      data,
      digit_pressed_1_data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}