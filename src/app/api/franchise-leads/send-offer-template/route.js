import { NextResponse } from "next/server";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const API_KEY = "ws_fca30eb07595f51089b57a862ecac20c12947558b56f1a70";

const CAMPAIGN_NAME = "franchiese_off_new_template";

/** Franchise offer: base price and discount used to compute the savings amount. */
const OFFER_BASE_AMOUNT = 500000;
const OFFER_DISCOUNT_PERCENT = 20;

const MAX_RECIPIENTS = 100;

function normalizeNumber(num) {
  if (!num) return null;

  let n = String(num).replace(/\D/g, "");

  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = `91${n}`;

  if (n.length !== 12 || !n.startsWith("91")) {
    return null;
  }

  return n;
}

/** Accepts dd-mm-yyyy or yyyy-mm-dd (input[type=date]) → dd-mm-yyyy. */
function normalizeValidDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  let m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return isRealDate(dd, mm, yyyy) ? `${dd}-${mm}-${yyyy}` : null;
  }

  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, yyyy, mm, dd] = m;
    return isRealDate(dd, mm, yyyy) ? `${dd}-${mm}-${yyyy}` : null;
  }

  return null;
}

/** Calendar-only check (no timezone involved) — rejects 31-02-2026 etc. */
function isRealDate(dd, mm, yyyy) {
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/** 20% of 5,00,000 → "1,00,000" (Indian grouping). */
function getSavingsAmount() {
  const saved = Math.round((OFFER_BASE_AMOUNT * OFFER_DISCOUNT_PERCENT) / 100);
  return saved.toLocaleString("en-IN");
}

async function sendOfferTemplate({ destination, firstName, validTill, savings }) {
  const payload = {
    apiKey: API_KEY,
    campaignName: CAMPAIGN_NAME,
    destination,
    userName: "YOUR_BRAND_NAME",
    templateParams: [firstName, savings, validTill],
    source: "api",
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstName,
      LastName: savings,
      Phone: validTill,
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

  const ok =
    res.ok &&
    (json?.success === true ||
      String(json?.success).toLowerCase() === "true" ||
      json?.success === undefined);

  return { ok, status: res.status, json };
}

/**
 * POST {
 *   validTill: "dd-mm-yyyy" | "yyyy-mm-dd",
 *   recipients: { phone: string, firstName?: string }[]
 *   // or single: { phone, firstName }
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const validTill = normalizeValidDate(body.validTill);
    if (!validTill) {
      return NextResponse.json(
        {
          success: false,
          message: "validTill is required in dd-mm-yyyy format",
        },
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

    const savings = getSavingsAmount();
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
        String(r.firstName || "").trim().split(" ")[0] || "firstname";

      const { ok, status, json } = await sendOfferTemplate({
        destination,
        firstName,
        validTill,
        savings,
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

    return NextResponse.json({
      success: failed === 0,
      sent,
      failed,
      savings,
      validTill,
      results,
    });
  } catch (error) {
    console.error("send-offer-template:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send offer template",
      },
      { status: 500 },
    );
  }
}
