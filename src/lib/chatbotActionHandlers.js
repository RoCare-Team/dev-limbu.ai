/**
 * chatbotActionHandlers.js
 *
 * Handles asynchronous processing for each chatbot action type.
 * Reuses existing platform services — no new logic is introduced.
 *
 * Supported actions:
 *   health_score  → n8n GMB health-score webhook + server-side PDF (pdfkit) + text summary
 *   magic_qr      → QR code generation (qrcode) + S3 upload (same as /api/magic-qr/upload-s3)
 *   website       → AI website builder (same as /api/ai-genrated-website)
 *   insights      → GMB Business Profile Performance API + formatted text summary
 *
 * Future scalability: swap processAction() callers to a BullMQ/Redis worker
 * without changing this file — the function signature is queue-job-compatible.
 */

import OpenAI from "openai";
import QRCode from "qrcode";

import dbConnect from "@/lib/dbConnect";
import GmbUser from "@/models/GmbUser";
import Site from "@/models/Site";
import MagicQR from "@/models/MagicQR";
import ChatbotAction from "@/models/ChatbotAction";

import { fetchLocationInsights } from "@/lib/gmb-api";
import { calculateMetrics } from "@/lib/performanceInsightsUtils";
import { uploadToS3 } from "@/utils/s3Config";
import { notifyActionComplete } from "@/lib/chatbotActionWebhook";
import {
  generateHealthScorePdf,
  buildHealthScoreText,
} from "@/lib/chatbotHealthPdfGenerator";

// ── ID normalisation helpers ─────────────────────────────────────────────────

/** Ensure locationId has the "locations/" prefix used by the GMB API. */
export function toFullLocationId(locationId) {
  if (!locationId) return "";
  return locationId.startsWith("locations/") ? locationId : `locations/${locationId}`;
}

/** Strip the "locations/" prefix to get the bare numeric / alphanumeric ID. */
export function toShortLocationId(locationId) {
  return (locationId || "").replace(/^locations\//, "");
}

// ── Token management ─────────────────────────────────────────────────────────

/**
 * Load the most-recently-updated Google OAuth tokens for a user from GmbUser.
 * Returns null if no record is found.
 *
 * @param {string} email - user email (case-insensitive)
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>}
 */
export async function getBusinessTokens(email) {
  await dbConnect();

  const gmbUser = await GmbUser.findOne({
    email: email.toLowerCase().trim(),
  }).lean();

  if (!gmbUser?.projects?.length) {
    console.warn(`[chatbotAction] No GmbUser projects found for email: ${email}`);
    return null;
  }

  // Pick the project updated most recently (single-account users have exactly one)
  const sorted = [...gmbUser.projects].sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  );

  const { accessToken, refreshToken } = sorted[0];
  return { accessToken: accessToken || "", refreshToken: refreshToken || "" };
}

/**
 * Exchange a refresh token for a fresh Google access token.
 * Mirrors the logic in /api/refresh-token/route.js.
 *
 * @param {string} refreshToken
 * @returns {Promise<string>} new access token
 */
export async function refreshGoogleAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Google token refresh failed (${res.status})`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── Slug generation helper (mirrors ai-genrated-website logic) ───────────────

function makeSlug(title = "", locality = "") {
  const base = `${title}${locality ? `-${locality}` : ""}`;
  return base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── ACTION: website ──────────────────────────────────────────────────────────

/**
 * Generate an AI website for the business and persist it to the Site collection.
 * Mirrors /api/ai-genrated-website/route.js logic.
 *
 * @returns {{ url: string, slug: string, siteId: string }}
 */
async function handleWebsite({ location, email, locationId, accessToken }) {
  const title = location.title || "Business";
  const addressParts = (location.address || "").split(",");
  const locality = addressParts[0]?.trim() || "";
  const primaryCategory =
    Array.isArray(location.categories) && location.categories[0]
      ? location.categories[0]
      : "Business";
  const additionalCategories = Array.isArray(location.categories)
    ? location.categories.slice(1)
    : [];
  const accountId = location.accountId || "";
  const shortId = toShortLocationId(locationId);

  // Fetch GMB media images for the website (best-effort, non-fatal)
  let mediaImages = [];
  if (accountId && shortId && accessToken) {
    try {
      const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${shortId}/media`;
      const mediaRes = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        mediaImages =
          mediaData.mediaItems
            ?.filter((item) => item.mediaFormat === "PHOTO")
            ?.map((item) => item.googleUrl || item.sourceUrl)
            ?.filter(Boolean)
            ?.slice(0, 10) ?? [];
      }
    } catch (mediaErr) {
      console.warn("[chatbotAction:website] Media fetch skipped:", mediaErr?.message);
    }
  }

  // Build AI content via OpenAI (same model + prompt as the existing route)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `
Create a COMPLETE professional business website landing page in JSON format.

Business Name: ${title}
Location: ${locality}
Primary Category: ${primaryCategory}
Additional Categories: ${additionalCategories.join(", ")}

Return ONLY valid JSON with this structure:
{
  "theme": { "primaryColor": "", "secondaryColor": "", "font": "" },
  "hero": {
    "headline": "", "subheadline": "",
    "ctaPrimary": "", "ctaSecondary": "",
    "backgroundImageKeyword": ""
  },
  "about": { "title": "", "content": "" },
  "services": [{ "title": "", "description": "", "iconKeyword": "", "imageKeyword": "" }],
  "features": ["", "", ""],
  "whyChooseUs": ["", "", ""],
  "testimonials": [{ "name": "", "review": "" }],
  "faq": [{ "question": "", "answer": "" }],
  "ctaSection": { "headline": "", "subheadline": "", "buttonText": "" },
  "meta": { "title": "", "description": "" },
  "imageKeywords": ["", "", ""]
}
Return ONLY valid JSON.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a senior website copywriter and conversion expert. Return valid structured JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 1500,
  });

  let raw = completion.choices[0].message.content || "";
  raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const aiContent = JSON.parse(raw);

  // Generate a unique slug (same dedup loop as the existing route)
  await dbConnect();
  const baseSlug = makeSlug(title, locality);
  let finalSlug = baseSlug;
  let counter = 0;

  while (await Site.findOne({ slug: finalSlug }).lean()) {
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  const site = await Site.create({
    slug: finalSlug,
    userId: email,
    locationId: shortId,
    business: { title, locality, primaryCategory, additionalCategories },
    aiContent,
    mediaImages,
    isPublished: true,
    updatedAt: new Date(),
  });

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.limbu.ai").replace(/\/$/, "");
  const siteUrl = `${baseUrl}/site/${finalSlug}`;

  console.log(`[chatbotAction:website] Created site slug=${finalSlug} for email=${email}`);

  return {
    url: siteUrl,
    slug: finalSlug,
    siteId: site._id.toString(),
  };
}

// ── ACTION: health_score ─────────────────────────────────────────────────────

/** n8n webhook URL — same as used in /api/location-search/route.js */
const HEALTH_SCORE_N8N_URL =
  process.env.HEALTH_SCORE_N8N_URL ||
  "https://n8n.limbutech.in/webhook/89c34fc8-2a74-4d91-a3d9-4d8468bd25e0";

/**
 * Fetch GMB health score via the internal n8n automation, then:
 *   1. Generate a server-side PDF report (pdfkit)
 *   2. Upload the PDF to S3
 *   3. Build a plain-text summary for chatbot display
 *
 * Webhook result shape:
 * {
 *   score:    number | null,
 *   text:     string,        ← WhatsApp / chatbot message
 *   pdf_url:  string,        ← S3 URL of the PDF
 *   data:     object         ← raw n8n response
 * }
 */
async function handleHealthScore({ location, email }) {
  const businessName = location.title || "Business";
  const address      = location.address || "";

  // ── Step 1: Call n8n health score automation ────────────────────────────
  const res = await fetch(HEALTH_SCORE_N8N_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      { "business-name": businessName, location: address },
    ]),
  });

  if (!res.ok) {
    throw new Error(`Health score service responded with status ${res.status}`);
  }

  const responseData = await res.json();
  const raw   = Array.isArray(responseData) ? responseData[0] : responseData;
  const score = raw?.score ?? raw?.healthScore ?? raw?.health_score ?? null;

  console.log(`[chatbotAction:health_score] score=${score} business="${businessName}"`);

  // ── Step 2: Generate PDF report (server-side, pdfkit) ──────────────────
  const generatedAt = new Date().toISOString();

  const pdfBuffer = await generateHealthScorePdf({
    businessName,
    address,
    score,
    rawData: raw ?? {},
    generatedAt,
  });

  // ── Step 3: Upload PDF to S3 ────────────────────────────────────────────
  const slugify   = (t) =>
    (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const dateStr   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const folder    = `health-reports/${slugify(businessName)}`;
  const fileName  = `gmb-health-${dateStr}.pdf`;

  const s3Result = await uploadToS3(pdfBuffer, fileName, "application/pdf", folder);
  if (!s3Result.success) {
    throw new Error(`PDF S3 upload failed: ${s3Result.error}`);
  }

  const pdfUrl = s3Result.url;
  console.log(`[chatbotAction:health_score] PDF uploaded → ${pdfUrl}`);

  // ── Step 4: Build plain-text summary ───────────────────────────────────
  const text = buildHealthScoreText({
    businessName,
    score,
    rawData: raw ?? {},
  });

  return {
    score,
    text,
    pdf_url: pdfUrl,
    message: `Health score report generated for ${businessName}`,
    data:    raw ?? {},
  };
}

// ── ACTION: magic_qr ─────────────────────────────────────────────────────────

/**
 * Generate a Magic QR code that links to the Google Maps search for the business.
 * Mirrors /api/magic-qr/upload-s3/route.js (QR buffer → S3 → MagicQR record).
 *
 * @returns {{ url: string, qrTargetUrl: string }}
 */
async function handleMagicQr({ location, email, locationId }) {
  const businessTitle = location.title || "Business";
  const addressStr = location.address || "";
  const locality = addressStr.split(",")[0]?.trim() || "HQ";

  // Build the target URL encoded in the QR (Google Maps business search)
  const mapQuery = encodeURIComponent(`${businessTitle} ${addressStr}`.trim());
  const qrTargetUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // Generate QR as a PNG buffer using the qrcode package
  const buffer = await QRCode.toBuffer(qrTargetUrl, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  // Upload to S3 (same helper as magic-qr/upload-s3)
  const slugify = (t) =>
    (t || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const customFolder = `magic-qrs/${slugify(businessTitle)}`;
  const fileName = `${slugify(locality)}-qr.png`;

  const s3Result = await uploadToS3(buffer, fileName, "image/png", customFolder);
  if (!s3Result.success) {
    throw new Error(`S3 upload failed: ${s3Result.error}`);
  }

  // Upsert MagicQR record (same pattern as the upload-s3 route)
  await dbConnect();
  const shortId = toShortLocationId(locationId);

  await MagicQR.findOneAndUpdate(
    { locationId: shortId },
    {
      userEmail: email,
      businessTitle,
      locality,
      locationId: shortId,
      s3ImageUrl: s3Result.url,
      status: "generated",
    },
    { upsert: true, new: true }
  );

  console.log(`[chatbotAction:magic_qr] QR generated url=${s3Result.url} location=${shortId}`);

  return {
    url: s3Result.url,
    qrTargetUrl,
    message: `QR code generated for ${businessTitle}`,
  };
}

// ── ACTION: insights ─────────────────────────────────────────────────────────

/**
 * Fetch last-30-day GMB performance insights for the location.
 * Reuses fetchLocationInsights from lib/gmb-api.js and calculateMetrics from
 * lib/performanceInsightsUtils.js.
 *
 * Returns both structured metrics and a chatbot-ready text summary.
 *
 * @returns {{ metrics, dateRange, text, message, data }}
 */
async function handleInsights({ accessToken, locationId, location }) {
  const shortId      = toShortLocationId(toFullLocationId(locationId));
  const businessName = location?.title || "Your Business";

  // Build a 30-day window ending today
  const today     = new Date();
  const endDate   = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  const insightsData = await fetchLocationInsights(
    accessToken,
    shortId,
    startDate,
    endDate
  );

  const metrics = calculateMetrics(insightsData);

  console.log(
    `[chatbotAction:insights] location=${shortId}` +
      ` calls=${metrics.totalCalls} directions=${metrics.totalDirections}`
  );

  const startLabel = startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const endLabel   = endDate.toLocaleDateString("en-IN",   { day: "2-digit", month: "short", year: "numeric" });

  // Build chatbot-ready text summary
  const text = [
    `📈 *GMB Insights — ${businessName}*`,
    `📅 Period: ${startLabel} → ${endLabel} (last 30 days)`,
    ``,
    `📞 Phone Calls:         ${metrics.totalCalls ?? 0}`,
    `🗺️  Direction Requests:  ${metrics.totalDirections ?? 0}`,
    `🌐 Website Clicks:      ${metrics.totalWebsiteClicks ?? 0}`,
    `🔍 Search Impressions:  ${metrics.totalSearchImpressions ?? 0}`,
    `📍 Maps Impressions:    ${metrics.totalMapsImpressions ?? 0}`,
    ``,
    `💡 Tip: ${pickInsightTip(metrics)}`,
  ].join("\n");

  return {
    metrics,
    text,
    dateRange: {
      startDate: startDate.toISOString().split("T")[0],
      endDate:   endDate.toISOString().split("T")[0],
    },
    message: `Insights fetched for ${businessName} (last 30 days)`,
    data: insightsData,
  };
}

/** Pick a contextual tip based on the weakest metric. */
function pickInsightTip(metrics) {
  if ((metrics.totalCalls ?? 0) < 5)
    return "Add your phone number to your profile and run a Google call ad to boost calls.";
  if ((metrics.totalDirections ?? 0) < 5)
    return "Ensure your map pin is accurately placed — customers may not find you.";
  if ((metrics.totalWebsiteClicks ?? 0) < 5)
    return "Link your website on your Google Business Profile to drive traffic.";
  if ((metrics.totalSearchImpressions ?? 0) < 50)
    return "Add more keywords to your business description to improve search visibility.";
  return "Keep responding to reviews and posting updates to maintain strong visibility.";
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function markFailed(actionId, phone, session_id, action, errorMessage) {
  const result = { message: errorMessage };

  await ChatbotAction.findByIdAndUpdate(actionId, {
    status: "failed",
    result,
    updatedAt: new Date(),
  }).catch((err) =>
    console.error("[chatbotAction] DB update (failed) error:", err?.message)
  );

  await notifyActionComplete({ phone, session_id, action, status: "failed", result });
}

// ── Main processor ────────────────────────────────────────────────────────────

/**
 * Process a single chatbot action end-to-end:
 *   1. Resolve location from the GMB session
 *   2. Get / refresh OAuth tokens
 *   3. Call the appropriate service handler
 *   4. Update the ChatbotAction record
 *   5. Fire the completion webhook
 *
 * This function is intentionally self-contained so it can be dropped into a
 * BullMQ job processor with no changes to its signature or internals.
 *
 * @param {object} actionDoc  - Plain object from ChatbotAction (lean or toObject())
 * @param {object} sessionDoc - Plain object from GMBConnection (lean)
 */
export async function processAction(actionDoc, sessionDoc) {
  const { _id, action, locationId, email } = actionDoc;

  // Phone is the primary identifier; session_id kept for backward compat logging
  const phone      = actionDoc.phone      || sessionDoc.phone      || "";
  const session_id = actionDoc.session_id || sessionDoc.sessionId  || "";

  console.log(
    `[chatbotAction] Processing action=${action}` +
      ` phone=${phone || "—"} session=${session_id || "—"} location=${locationId}`
  );

  // 1. Resolve the location inside this session
  const fullId   = toFullLocationId(locationId);
  const location = (sessionDoc.locationsData || []).find(
    (l) => l.locationResourceName === fullId || l.locationResourceName === locationId
  );

  if (!location) {
    console.warn(
      `[chatbotAction] Location "${locationId}" not found in session for phone="${phone}"`
    );
    await markFailed(_id, phone, session_id, action, "Location not found in connected business session");
    return;
  }

  // Prefer email from session doc (guaranteed fresh), fall back to stored value
  const resolvedEmail = (sessionDoc.userEmail || email || "").toLowerCase();

  // 2. Load and refresh OAuth tokens
  const tokens = await getBusinessTokens(resolvedEmail).catch(() => null);
  if (!tokens) {
    await markFailed(
      _id, phone, session_id, action,
      "GMB tokens not found — please reconnect Google Business"
    );
    return;
  }

  let { accessToken, refreshToken } = tokens;
  try {
    accessToken = await refreshGoogleAccessToken(refreshToken);
  } catch (refreshErr) {
    console.warn("[chatbotAction] Token refresh failed, using stored token:", refreshErr?.message);
  }

  // 3. Dispatch to the correct service handler
  let result;
  try {
    switch (action) {
      case "website":
        result = await handleWebsite({ location, email: resolvedEmail, locationId, accessToken });
        break;

      case "health_score":
        result = await handleHealthScore({ location, email: resolvedEmail });
        break;

      case "magic_qr":
        result = await handleMagicQr({ location, email: resolvedEmail, locationId });
        break;

      case "insights":
        result = await handleInsights({ accessToken, locationId, location });
        break;

      default:
        throw new Error(`Unknown action type: "${action}"`);
    }

    // 4. Persist success
    await ChatbotAction.findByIdAndUpdate(_id, {
      status: "success",
      result,
      updatedAt: new Date(),
    });

    // 5. Fire completion webhook (phone included)
    await notifyActionComplete({ phone, session_id, action, status: "success", result });

    console.log(
      `[chatbotAction] Completed action=${action} phone=${phone || "—"}`
    );
  } catch (err) {
    const msg = err?.message || "Unexpected error during action processing";
    console.error(`[chatbotAction] action=${action} phone=${phone || "—"} error:`, msg);
    await markFailed(_id, phone, session_id, action, msg);
  }
}
