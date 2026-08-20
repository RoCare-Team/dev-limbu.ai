import { NextResponse } from "next/server";
import {
  FRANCHISE_WEBINAR_JOIN_LINK,
  formatWebinarDateTime,
} from "@/lib/webinarInvite";

/**
 * Franchise leads → Webinar invite WhatsApp template.
 *
 * Template variables:
 *   {{1}} → lead ka naam
 *   {{2}} → webinar date & time (admin send se pehle choose karta hai)
 *   {{3}} → webinar join link
 */

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const CAMPAIGN_NAME =
  process.env.FRANCHISE_WEBINAR_CAMPAIGN || "limbu_ai_franchise_webinar";

/** Template ke saath jaane wala banner image. */
const WEBINAR_MEDIA = {
  url:
    process.env.FRANCHISE_WEBINAR_MEDIA_URL ||
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Image+2026-08-20+at+2.28.34+PM.jpeg",
  filename: "webinar_banner",
};

const MAX_RECIPIENTS = 1000;

function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;

  if (n.length !== 12 || !n.startsWith("91")) return null;

  return n;
}

async function sendWebinarTemplate({ apiKey, destination, firstName, dateTime }) {
  const payload = {
    apiKey,
    campaignName: CAMPAIGN_NAME,
    destination,
    userName: "YOUR_BRAND_NAME",
    templateParams: [firstName, dateTime, FRANCHISE_WEBINAR_JOIN_LINK],
    source: "api",
    media: WEBINAR_MEDIA,
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName,
      LastName: dateTime,
      Phone: FRANCHISE_WEBINAR_JOIN_LINK,
    },
  };

  const res = await fetch(AISENSY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  // Kuch responses me success flag hota hai, kuch me sirf 200 — dono handle.
  const ok =
    res.ok &&
    (json?.success === true ||
      String(json?.success).toLowerCase() === "true" ||
      json?.success === undefined);

  return { ok, status: res.status, json };
}

/**
 * POST {
 *   recipients: { phone: string, firstName?: string }[],
 *   webinarDateTime: "2026-08-20T16:00"
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const webinarDateTime = String(body.webinarDateTime || "").trim();
    if (!webinarDateTime) {
      return NextResponse.json(
        { success: false, message: "Webinar date & time is required" },
        { status: 400 },
      );
    }

    const raw = Array.isArray(body.recipients)
      ? body.recipients
      : body.phone
        ? [{ phone: body.phone, firstName: body.firstName }]
        : [];

    if (raw.length === 0) {
      return NextResponse.json(
        { success: false, message: "recipients array is required" },
        { status: 400 },
      );
    }

    if (raw.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        {
          success: false,
          message: `At most ${MAX_RECIPIENTS} recipients per request`,
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIMBU_AI_WHATSAPP_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "WhatsApp API key not configured" },
        { status: 500 },
      );
    }

    const dateTime = formatWebinarDateTime(webinarDateTime);

    const seen = new Set();
    const results = [];

    for (const r of raw) {
      const destination = normalizeNumber(r.phone ?? r.destination);

      if (!destination) {
        results.push({
          phone: r.phone ?? "",
          success: false,
          error: "Invalid phone number",
        });
        continue;
      }
      if (seen.has(destination)) {
        results.push({
          phone: destination,
          success: false,
          error: "Duplicate in batch",
          skipped: true,
        });
        continue;
      }
      seen.add(destination);

      const firstName =
        String(r.firstName || r.name || "").trim().split(" ")[0] || "there";

      const { ok, status, json } = await sendWebinarTemplate({
        apiKey,
        destination,
        firstName,
        dateTime,
      });

      results.push({
        phone: destination,
        success: ok,
        status,
        aisensy: json,
        error: ok ? undefined : json?.message || json?.error || "Send failed",
      });
    }

    const sent = results.filter((x) => x.success).length;
    const failed = results.length - sent;

    if (sent === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No messages were sent",
          sent,
          failed,
          dateTime,
          joinLink: FRANCHISE_WEBINAR_JOIN_LINK,
          results,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: failed === 0,
      message: `Webinar invite sent to ${sent} recipient(s)`,
      sent,
      failed,
      dateTime,
      joinLink: FRANCHISE_WEBINAR_JOIN_LINK,
      results,
    });
  } catch (error) {
    console.error("send-webinar-template:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send webinar template",
      },
      { status: 500 },
    );
  }
}
