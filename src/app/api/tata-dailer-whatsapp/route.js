import { NextResponse } from "next/server";

const AISENSY_URL =
  "https://backend.aisensy.com/campaign/t1/api/v2";

const MEDIA = {
  session4pm:
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  session530pm:
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-02-04+at+12.14.21+PM.jpeg",
};

const normalizeNumber = (num) => {
  if (!num) return null;

  let n = num.replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;

  return n.length === 12 ? n : null;
};

export async function POST(req) {
  try {
    const { users, campaignName } = await req.json();

    if (!users?.length) {
      return NextResponse.json({
        success: false,
        message: "No users provided",
      });
    }

    let sent = 0;
    const messageIds = [];

    for (const u of users) {
      const destination = normalizeNumber(
        u.customer_no_with_prefix
      );
      if (!destination) continue;

      const res = await fetch(AISENSY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.AISENSY_API_KEY,
          campaignName,
          destination,
          userName: "LimbuAI",
          templateParams: [],
          source: "incoming-ivr",
          media: {
            url: MEDIA[campaignName],
            filename: "session",
          },
          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {},
          paramsFallbackValue: {},
        }),
      });

      const json = await res.json();

      if (json?.success === "true") {
        sent++;
        if (json.submitted_message_id) {
          messageIds.push(json.submitted_message_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      message: `WhatsApp successfully sent to ${sent} users`,
      messageIds,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message,
    });
  }
}
