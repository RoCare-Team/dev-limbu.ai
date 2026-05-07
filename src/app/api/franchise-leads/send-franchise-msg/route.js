import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const FRANCHISE_MSG_MEDIA = {
  url: "https://waterpurifierservicecenter.in/webinar_images/post4.jpeg",
  filename: "sample_media",
};

const MAX_RECIPIENTS = 100;

function normalizeDestination(num) {
  if (num == null || num === "") return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  if (n.length === 12 && n.startsWith("91")) return n;
  return null;
}

async function sendFranchiseMsg(apiKey, destination, userName) {
  const payload = {
    apiKey,
    campaignName: "franchise_msg",
    destination,
    userName: userName || "LimbuAI",
    templateParams: [],
    source: "franchise-leads-admin",
    media: { ...FRANCHISE_MSG_MEDIA },
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {},
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

  const ok =
    res.ok &&
    (json?.success === true ||
      json?.success === "true" ||
      String(json?.success).toLowerCase() === "true");

  return { ok, status: res.status, json };
}

/**
 * POST { recipients: { phone: string, name?: string }[] }
 */
export async function POST(req) {
  try {
    const apiKey = process.env.AISENSY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "AISENSY_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const raw = Array.isArray(body.recipients) ? body.recipients : [];

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

    const seen = new Set();
    const results = [];

    for (const r of raw) {
      const phone = r.phone ?? r.destination;
      const destination = normalizeDestination(phone);
      if (!destination) {
        results.push({
          phone: phone ?? "",
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

      const { ok, status, json } = await sendFranchiseMsg(
        apiKey,
        destination,
        r.name,
      );

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

    return NextResponse.json({
      success: failed === 0,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error("send-franchise-msg:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal error" },
      { status: 500 },
    );
  }
}
