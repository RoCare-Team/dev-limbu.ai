import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const call = await client.calls.create({
      url: "http://demo.twilio.com/docs/voice.xml",
      to: "+917740847114", // tumhara test number
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return NextResponse.json({ success: true, sid: call.sid });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}