import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";

// ------------------
// MongoDB Connection
// ------------------
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

// ------------------
// Schema
// ------------------
const CallSchema = new mongoose.Schema({
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
  billing_circle: String,
});

// Prevent model overwrite error
const Call =
  mongoose.models.dialer_call_status_tata ||
  mongoose.model("dialer_call_status_tata", CallSchema);

// ------------------
// API Handler
// ------------------
export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();

    // Log webhook data
    fs.writeFileSync("response1.log", JSON.stringify(data, null, 2));

    const {
      call_to_number = "",
      caller_id_number = "",
      answered_agent_number = "",
      call_status = "",
      uuid = "",
      duration = "",
      recording_url = "",
      customer_number_with_prefix = "",
      hangup_cause = "",
      direction = "",
      call_id = "",
      digit_pressed = "",
      billing_circle = "",
    } = data;

    let did_number = "";
    let customer_number = "";
    let agentnumber = "";

    if (direction === "inbound") {
      did_number = call_to_number;
      customer_number = caller_id_number;
      agentnumber = answered_agent_number;
    } else {
      did_number = caller_id_number;
      customer_number = call_to_number;
      agentnumber = answered_agent_number;
    }

    const now = new Date();
    const date_time_12_hrs = now.toISOString().slice(0, 19).replace("T", " ");
    const date_main = now.toISOString().split("T")[0];

    // Save to MongoDB
    await Call.create({
      mobile_no: customer_number,
      agent_mobile: agentnumber,
      answered_agent_number,
      did_number,
      call_status,
      uuid,
      caller_id_number,
      duration,
      recording_url,
      customer_no_with_prefix: customer_number_with_prefix,
      hangup_cause,
      direction,
      action_date_time: date_time_12_hrs,
      call_id,
      call_date: date_main,
      api_page_name: "incoming_ivr_api",
      digit_pressed,
      billing_circle,
    });

    return NextResponse.json({
      error: false,
      call: call_to_number,
    });
  } catch (error) {
    console.error("Webhook Error:", error);

    return NextResponse.json(
      { error: true, message: error.message },
      { status: 500 }
    );
  }
}
