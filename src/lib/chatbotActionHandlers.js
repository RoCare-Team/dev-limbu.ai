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

import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import MagicQR from "@/models/MagicQR";
import ChatbotAction from "@/models/ChatbotAction";

import { fetchLocationInsights } from "@/lib/gmb-api";
import {
  calculateMetrics,
  calculateMetricsInRange,
  getPerformanceInsightsWindows,
  metricHasObservationsInRange,
  toYmd,
} from "@/lib/performanceInsightsUtils";
import { uploadToS3 } from "@/utils/s3Config";
import { notifyActionComplete } from "@/lib/chatbotActionWebhook";
import {
  generateHealthScorePdf,
  buildHealthScoreText,
} from "@/lib/chatbotHealthPdfGenerator";
import { getTokensByPhone, updateTokensByPhone } from "@/lib/gmbSessionStore";
import { generateMagicQrCard } from "@/lib/magicQrCardGenerator";
import { generateInsightsPdf } from "@/lib/chatbotInsightsPdfGenerator";
import { generateSlug } from "../../utils/generateSlug";

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
 * Refresh Google access token using the stored refresh token.
 * Updates the refreshed token back into GMBConnection so it stays fresh.
 *
 * @param {string} phone        - user's phone (to update DB after refresh)
 * @param {string} refreshToken - current refresh token
 * @returns {Promise<string>}   - new access token
 */
async function refreshAndSaveAccessToken(phone, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Token refresh failed (${res.status})`);
  }

  const data = await res.json();
  const newAccessToken = data.access_token;

  // Persist refreshed token back to GMBConnection
  if (phone && newAccessToken) {
    await updateTokensByPhone(phone, newAccessToken, refreshToken).catch((e) =>
      console.warn("[chatbotAction] Token DB update failed:", e?.message)
    );
  }

  return newAccessToken;
}

// makeSlug is replaced by the shared generateSlug utility (utils/generateSlug.js)

// ── ACTION: website ──────────────────────────────────────────────────────────

/**
 * Generate an AI website for the business and persist it to the Site collection.
 * Mirrors /api/ai-genrated-website/route.js logic.
 *
 * @returns {{ url: string, slug: string, siteId: string }}
 */
async function handleWebsite({ location, email, locationId, accessToken }) {
  const title = location.title || "Business";

  // ── locality: use storefrontAddress.locality (same as build-website page) ──
  // location.locality was added to locationsData schema alongside addressLine fix.
  // Fallback for old sessions without the field: skip (produces title-only slug).
  const locality = location.locality || "";

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

  // ── Slug: use shared generateSlug (same as /api/ai-genrated-website + GoLiveButton) ──
  await dbConnect();
  const baseSlug = generateSlug(title, locality);
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

  // ── URL: subdomain format — same as GoLiveButton.jsx on production ──────────
  // GoLiveButton: `https://${finalSlug}.${ROOT_DOMAIN}` where ROOT_DOMAIN = NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai"
  const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const siteUrl = `https://${finalSlug}.${ROOT_DOMAIN}`;

  console.log(`[chatbotAction:website] Created site slug=${finalSlug} url=${siteUrl} for email=${email}`);

  return {
    url: siteUrl,
    slug: finalSlug,
    siteId: site._id.toString(),
  };
}

// ── ACTION: health_score ─────────────────────────────────────────────────────

/**
 * Same n8n webhook used by the dashboard's handleGenerateReport().
 * Override via HEALTH_SCORE_N8N_URL env var.
 */
const HEALTH_SCORE_N8N_URL =
  process.env.HEALTH_SCORE_N8N_URL ||
  "https://n8n.limbutech.in/webhook/10d9cd54-46a7-4c3b-9c61-0ce9cf666eac";

/**
 * Fetch GMB health score via the n8n automation (mirrors handleGenerateReport),
 * then generate a PDF + text summary and upload to S3.
 *
 * Payload: [{ location_id, account_id, token }]  ← exact same shape as dashboard
 *
 * Returns:
 * {
 *   score:    number | null,
 *   text:     string,      ← WhatsApp-ready message
 *   pdf_url:  string,      ← S3 URL
 *   data:     object       ← raw audit data from n8n
 * }
 */
async function handleHealthScore({ location, email, accessToken }) {
  const businessName = location.title   || "Business";
  const address      = location.address || "";
  const locationId   = toShortLocationId(location.locationResourceName || "");
  const accountId    = location.accountId || "";

  console.log(`[hs] Step 1 — calling n8n  location=${locationId} account=${accountId}`);

  // ── Step 1: Call n8n (exact same payload as dashboard handleGenerateReport) ─
  const payload = [{ location_id: locationId, account_id: accountId, token: accessToken }];

  const res = await fetch(HEALTH_SCORE_N8N_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  console.log(`[hs] n8n responded status=${res.status}`);

  if (!res.ok) {
    throw new Error(`Health score service responded with status ${res.status}`);
  }

  const rawText = await res.text();
  console.log(`[hs] raw response length=${rawText?.length ?? 0} preview="${String(rawText).slice(0, 120)}"`);

  if (!rawText?.trim()) {
    throw new Error("Health score service returned an empty response");
  }

  const responseData = JSON.parse(rawText);

  // Mirror the dashboard's normalisation logic exactly
  let raw = Array.isArray(responseData) && responseData.length > 0
    ? responseData[0]
    : responseData;

  // Handle the case where the audit is nested under an empty-string key: data[0][""]
  if (raw && typeof raw === "object" && "" in raw) {
    raw = raw[""];
  }

  // Mirror GBPAuditCard: read totalScore first (the primary key from n8n)
  const innerAudit = (raw && typeof raw === "object" && "" in raw) ? raw[""] : raw;
  const score = innerAudit?.totalScore ?? innerAudit?.score ?? innerAudit?.healthScore ?? innerAudit?.health_score ?? null;

  console.log(`[hs] Step 1 done — score=${score} business="${businessName}" keys=${Object.keys(raw ?? {}).slice(0,10).join(",")}`);
  console.log(`[hs] Step 2 — generating PDF`);

  // ── Step 2: Generate PDF report (server-side, pdfkit) ──────────────────
  const generatedAt = new Date().toISOString();

  const pdfBuffer = await generateHealthScorePdf({
    businessName,
    address,
    score,
    rawData: raw ?? {},
    generatedAt,
  });

  console.log(`[hs] Step 2 done — PDF buffer size=${pdfBuffer?.length ?? 0} bytes`);
  console.log(`[hs] Step 3 — uploading PDF to S3`);

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
  console.log(`[hs] Step 3 done — PDF uploaded → ${pdfUrl}`);

  // ── Step 4: Build plain-text summary ───────────────────────────────────
  console.log(`[hs] Step 4 — building text summary`);

  const text = buildHealthScoreText({
    businessName,
    score,
    rawData: raw ?? {},
  });

  console.log(`[hs] All steps done — score=${score} pdf=${pdfUrl}`);

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
 * Build the review page slug — mirrors useMagicQR.js reviewUrl logic exactly.
 * URL: https://limbu.ai/reviews/<slug>
 */
function buildReviewUrl(title = "", locality = "", address = "") {
  const streetLine = String(address || "")
    .split(",")[0]
    .trim();
  const slug = `${title}${locality ? `-${locality}` : ""}${streetLine ? `-${streetLine}` : ""}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.limbu.ai").replace(/\/$/, "");
  return `${base}/reviews/${slug}`;
}

/**
 * Generate the EXACT same styled Magic QR card shown on /get-magic-qr (QRPreviewCard.jsx):
 *   - 4 Google color quadrants (yellow/red/green/blue corners)
 *   - White rounded inner card
 *   - Multicolor "Google" text, 5 gold stars
 *   - "Scan to Rate Us on Google"
 *   - Business name
 *   - QR code (from api.qrserver.com, encodes the review URL)
 *   - Corner accents on QR box (matching the CSS border accents)
 *   - "Powered by LimbuAI" footer
 *
 * Priority:
 *   1. Existing MagicQR in DB (if dashboard already saved styled image → reuse it).
 *   2. Generate styled card server-side with sharp → upload to S3.
 *
 * @returns {{ url: string, reviewUrl: string, message: string }}
 */
async function handleMagicQr({ location, email, locationId }) {
  await dbConnect();

  const businessTitle = location.title || "Business";
  const shortId       = toShortLocationId(locationId);

  const slugify = (t) =>
    (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  // ── Mirror useMagicQR.js exactly ─────────────────────────────────────────
  // locality → storefrontAddress.locality  (e.g. "Ahmedabad")  stored as location.locality
  // address  → storefrontAddress.addressLines (street only)    stored as location.addressLine
  // Fallback for sessions stored before this field was added:
  //   try to strip locality/region/postal from the end of the full address string.
  const locality = location.locality || "";
  const addressLine =
    location.addressLine ||
    location.storefrontAddress?.addressLines?.[0] ||
    (location.address || "").split(",")[0]?.trim() ||
    "";

  // Build review URL — exact same logic as useMagicQR.js
  const reviewUrl = buildReviewUrl(businessTitle, locality, addressLine);

  console.log(`[qr] location=${shortId} reviewUrl=${reviewUrl}`);

  // ── Step 1: Reuse existing styled QR only if its reviewUrl still matches ──
  // (old records may have been generated with a different/wrong URL; regenerate
  //  if the stored reviewUrl differs from the one we just computed)
  const existing = await MagicQR.findOne({ locationId: shortId }).lean();
  const existingHasManualStyledCard = Boolean(existing?.s3ImageUrl);
  const existingReviewMatches = existing?.reviewUrl === reviewUrl;
  const existingReviewMissing = !existing?.reviewUrl;
  if (existingHasManualStyledCard && (existingReviewMatches || existingReviewMissing)) {
    console.log(
      `[qr] Reusing saved styled QR: ${existing.s3ImageUrl}` +
      (existingReviewMissing ? " (reviewUrl missing in legacy record)" : "")
    );
    return {
      url:      existing.s3ImageUrl,
      reviewUrl,
      message:  `QR code ready for ${businessTitle}`,
    };
  }
  if (existing?.s3ImageUrl && existing?.reviewUrl !== reviewUrl) {
    console.log(`[qr] Stored reviewUrl mismatch — regenerating. old=${existing.reviewUrl} new=${reviewUrl}`);
  }

  // ── Step 2: Generate styled card (same visual as QRPreviewCard.jsx) ───────
  console.log(`[qr] Generating styled card for "${businessTitle}"`);
  const cardBuffer = await generateMagicQrCard(businessTitle, reviewUrl);
  console.log(`[qr] Card PNG size=${cardBuffer.length} bytes`);

  // ── Step 3: Upload PNG to S3 ───────────────────────────────────────────────
  const folder   = `magic-qrs/${slugify(businessTitle)}`;
  const fileName = `${slugify(locality || "hq")}-qr-card.png`;

  const s3Result = await uploadToS3(cardBuffer, fileName, "image/png", folder);
  if (!s3Result.success) {
    throw new Error(`S3 upload failed: ${s3Result.error}`);
  }
  console.log(`[qr] Uploaded → ${s3Result.url}`);

  // ── Step 4: Upsert MagicQR DB record ──────────────────────────────────────
  await MagicQR.findOneAndUpdate(
    { locationId: shortId },
    { userEmail: email, businessTitle, locality, locationId: shortId, s3ImageUrl: s3Result.url, reviewUrl, status: "generated" },
    { upsert: true, new: true }
  );

  return {
    url:      s3Result.url,
    reviewUrl,
    message:  `QR code generated for ${businessTitle}`,
  };
}

// ── ACTION: insights ─────────────────────────────────────────────────────────

/**
 * Fetch GMB performance insights — mirrors the manual /gmb-insights page exactly.
 *
 * Uses the same double-period fetch (current + equal-length previous period) so
 * we can show delta badges, plus a separate search-keywords call, matching what
 * PerformanceInsightsReport.jsx shows in the dashboard.
 *
 * @returns {{ metrics, prevMetrics, keywords, dateRange, text, message, data }}
 */
async function handleInsights({ accessToken, locationId, location }) {
  const shortId      = toShortLocationId(toFullLocationId(locationId));
  const businessName = location?.title || "Your Business";

  // ── 1. Date windows (identical to handleViewInsights in gmb-insights/page.jsx)
  const today = new Date();
  const reportEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const reportStart = new Date(reportEnd);
  reportStart.setDate(reportStart.getDate() - 30); // default: today − 30 days

  // getPerformanceInsightsWindows widens the fetch to include the prior period
  const { fetchStart, prevStart, prevEnd, reportStart: rs, reportEnd: re } =
    getPerformanceInsightsWindows(reportStart, reportEnd);

  // ── 2. Fetch wider series (current + prev period) — same as manual page
  const insightsData = await fetchLocationInsights(
    accessToken,
    shortId,
    fetchStart,
    re
  );

  // ── 3. Slice metrics for current and previous windows — same as PerformanceInsightsReport
  const metrics     = calculateMetricsInRange(insightsData, rs, re);
  const prevMetrics = calculateMetricsInRange(insightsData, prevStart, prevEnd);

  // Check if prior period has any data (same guard as prevHasData in the dashboard)
  const prevHasData = [
    "CALL_CLICKS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  ].some((t) => metricHasObservationsInRange(insightsData, t, toYmd(prevStart), toYmd(prevEnd)));

  // ── 4. Search keywords — same 3-month window as manual page
  let keywords = [];
  try {
    const currentDate = new Date();
    const endMonth = {
      year:  currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,   // 1-based
    };
    const startMonth = {
      year:  currentDate.getFullYear(),
      month: currentDate.getMonth() - 3,   // 3 months back
    };
    if (startMonth.month <= 0) {
      startMonth.month += 12;
      startMonth.year  -= 1;
    }

    const kwUrl =
      `https://businessprofileperformance.googleapis.com/v1/locations/${shortId}` +
      `/searchkeywords/impressions/monthly` +
      `?monthlyRange.start_month.year=${startMonth.year}` +
      `&monthlyRange.start_month.month=${startMonth.month}` +
      `&monthlyRange.end_month.year=${endMonth.year}` +
      `&monthlyRange.end_month.month=${endMonth.month}`;

    const kwRes = await fetch(kwUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (kwRes.ok) {
      const kwData = await kwRes.json();
      // kwData.searchKeywordsCounts is the array used in PerformanceInsightsReport
      keywords = kwData.searchKeywordsCounts || [];
    }
  } catch (e) {
    console.warn("[chatbotAction:insights] keywords fetch failed:", e.message);
  }

  console.log(
    `[chatbotAction:insights] location=${shortId}` +
    ` impressions=${metrics.totalImpressions}` +
    ` calls=${metrics.totalCalls} directions=${metrics.totalDirections}`
  );

  // ── 5. Generate PDF + upload to S3 (same as performancePdfGenerator.js flow)
  let pdfUrl = null;
  try {
    const monthName = re.toLocaleDateString("en-US", { month: "long" });
    const year      = re.getFullYear();
    const slugBiz   = businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase();

    const pdfBuffer = await generateInsightsPdf({
      businessName,
      locationName: location?.title || businessName,
      city:         location?.locality || "",
      dateRange:    { startDate: rs.toISOString(), endDate: re.toISOString() },
      metrics,
      prevMetrics,
      prevHasData,
      insightsData,
      keywords,
    });

    const fileName = `performance_report_${slugBiz}_${monthName}_${year}.pdf`;
    const s3Result = await uploadToS3(pdfBuffer, fileName, "application/pdf", "insights-reports");
    if (s3Result.success) {
      pdfUrl = s3Result.url;
      console.log(`[chatbotAction:insights] PDF uploaded → ${pdfUrl}`);
    } else {
      console.warn(`[chatbotAction:insights] PDF S3 upload failed: ${s3Result.error}`);
    }
  } catch (pdfErr) {
    console.warn(`[chatbotAction:insights] PDF generation failed: ${pdfErr.message}`);
  }

  // ── 6. Format labels
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const reportWindowLabel = `${fmt(rs)} – ${fmt(re)}`;
  const prevWindowLabel   = `${fmt(prevStart)} – ${fmt(prevEnd)}`;

  // Delta helper (same formula as dashboard)
  const delta = (cur, prev) => {
    if (!prevHasData) return null;
    const pct = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    return { pct, arrow: pct >= 0 ? "▲" : "▼", sign: pct >= 0 ? "+" : "" };
  };

  const fmtDelta = (cur, prev) => {
    const d = delta(cur, prev);
    if (!d) return "";
    return ` (${d.arrow} ${d.sign}${d.pct}%)`;
  };

  // ── 6. Build WhatsApp-ready text — same 5 KPI cards as PerformanceInsightsReport
  const lines = [
    `📈 *GMB Insights — ${businessName}*`,
    `📅 Report Window: ${reportWindowLabel}`,
    prevHasData ? `🔁 Previous Period: ${prevWindowLabel}` : "",
    ``,
    `*📊 Performance Overview*`,
    ``,
    `👁️  Impressions:    ${metrics.totalImpressions}${fmtDelta(metrics.totalImpressions, prevMetrics.totalImpressions)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalImpressions : "—"}`,
    ``,
    `🗺️  Maps Views:     ${metrics.totalMapsImpressions}${fmtDelta(metrics.totalMapsImpressions, prevMetrics.totalMapsImpressions)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalMapsImpressions : "—"}`,
    ``,
    `🔍 Search Views:   ${metrics.totalSearchImpressions}${fmtDelta(metrics.totalSearchImpressions, prevMetrics.totalSearchImpressions)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalSearchImpressions : "—"}`,
    ``,
    `📞 Phone Calls:    ${metrics.totalCalls}${fmtDelta(metrics.totalCalls, prevMetrics.totalCalls)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalCalls : "—"}`,
    ``,
    `🌐 Web Clicks:     ${metrics.totalWebsiteClicks}${fmtDelta(metrics.totalWebsiteClicks, prevMetrics.totalWebsiteClicks)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalWebsiteClicks : "—"}`,
    ``,
    `🧭 Directions:     ${metrics.totalDirections}${fmtDelta(metrics.totalDirections, prevMetrics.totalDirections)}`,
    `   Previous: ${prevHasData ? prevMetrics.totalDirections : "—"}`,
  ];

  // Top keywords (same top-10 as dashboard)
  if (keywords.length > 0) {
    lines.push(``, `*🔑 Top Search Keywords:*`);
    keywords.slice(0, 10).forEach((kw, i) => {
      const term   = kw.searchKeyword || kw.keyword || "—";
      const count  = kw.insightsValue?.value ?? kw.count ?? "";
      lines.push(`  ${i + 1}. ${term}${count ? ` (${count})` : ""}`);
    });
  }

  lines.push(``, `💡 Tip: ${pickInsightTip(metrics)}`);
  if (pdfUrl) {
    lines.push(``, `📄 Full Report (PDF): ${pdfUrl}`);
  }

  const text = lines.filter((l) => l !== null && l !== undefined).join("\n");

  return {
    metrics,
    prevMetrics,
    keywords,
    pdfUrl,
    text,
    dateRange: {
      startDate: rs.toISOString().split("T")[0],
      endDate:   re.toISOString().split("T")[0],
    },
    message: `Insights fetched for ${businessName}`,
    data:    insightsData,
  };
}

// ── ACTION: keyword_planner ──────────────────────────────────────────────────

/** Same n8n webhook used by /api/keyword-research/route.js GET handler */
const KEYWORD_N8N_URL =
  process.env.KEYWORD_PLANNER_N8N_URL ||
  "https://n8n.limbutech.in/webhook/4dc0fc39-0e04-4d74-a189-1c4f09bd6894";

/**
 * Fetch at least 10 SEO/GMB keywords for the business's primary category
 * using the existing keyword-research n8n automation.
 *
 * Returns:
 * {
 *   category:  string,       ← primary category used as seed keyword
 *   keywords:  string[],     ← 10+ keywords
 *   text:      string,       ← WhatsApp-ready formatted list
 *   message:   string,
 *   data:      object        ← raw n8n response
 * }
 */
async function handleKeywordPlanner({ location }) {
  const businessTitle   = location.title || "Business";
  const primaryCategory = (Array.isArray(location.categories) && location.categories[0])
    ? location.categories[0]
    : businessTitle;

  console.log(`[kw] Fetching keywords for category="${primaryCategory}"`);

  const res = await fetch(KEYWORD_N8N_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ keyword: primaryCategory }),
  });

  if (!res.ok) {
    throw new Error(`Keyword planner service responded with status ${res.status}`);
  }

  const rawText = await res.text();
  if (!rawText?.trim()) {
    throw new Error("Keyword planner service returned an empty response");
  }

  console.log(`[kw] n8n responded length=${rawText.length} preview="${rawText.slice(0, 120)}"`);

  const responseData = JSON.parse(rawText);

  // Normalise various n8n response shapes into a flat keywords array
  let keywords = [];
  const raw = Array.isArray(responseData) ? responseData[0] : responseData;

  if (Array.isArray(raw?.keywords))        keywords = raw.keywords.map(String);
  else if (Array.isArray(raw?.data))       keywords = raw.data.map((k) => k?.keyword || k?.word || String(k));
  else if (Array.isArray(raw))             keywords = raw.map((k) => k?.keyword || k?.word || String(k));
  else if (typeof raw === "object" && raw) {
    // Try common field names
    const kf = raw.keywords || raw.data || raw.results || raw.terms || raw.words || [];
    keywords = Array.isArray(kf) ? kf.map((k) => k?.keyword || k?.word || String(k)) : [];
  }

  // Clean and deduplicate
  keywords = [...new Set(keywords.map((k) => String(k).trim()).filter(Boolean))];

  // If n8n returned fewer than 10, pad with category-based suggestions
  if (keywords.length < 10) {
    const fallbacks = [
      `${primaryCategory} near me`,
      `best ${primaryCategory}`,
      `${primaryCategory} services`,
      `top ${primaryCategory}`,
      `${primaryCategory} reviews`,
      `${primaryCategory} price`,
      `affordable ${primaryCategory}`,
      `${primaryCategory} in ${location.address?.split(",")[0] || "India"}`,
      `${primaryCategory} specialist`,
      `${primaryCategory} online`,
    ];
    for (const fb of fallbacks) {
      if (!keywords.includes(fb)) keywords.push(fb);
      if (keywords.length >= 10) break;
    }
  }

  console.log(`[kw] Total keywords=${keywords.length}`);

  // Build chatbot-ready text
  const text = [
    `🔍 *Keyword Planner — ${businessTitle}*`,
    `📂 Category: ${primaryCategory}`,
    ``,
    `💡 *Top Keywords for Your Business:*`,
    ...keywords.slice(0, 15).map((kw, i) => `  ${i + 1}. ${kw}`),
    ``,
    `✅ Use these keywords in your Google Business description, posts, and Q&A section to improve search visibility.`,
  ].join("\n");

  return {
    category: primaryCategory,
    keywords,
    text,
    message: `${keywords.length} keywords found for "${primaryCategory}"`,
    data:    raw,
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

async function markFailed(actionId, phone, action, errorMessage) {
  const result = { message: errorMessage };

  await ChatbotAction.findByIdAndUpdate(actionId, {
    status: "failed",
    result,
    updatedAt: new Date(),
  }).catch((err) =>
    console.error("[chatbotAction] DB update (failed) error:", err?.message)
  );

  await notifyActionComplete({ phone, action, status: "failed", result });
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
  const { _id, action, locationId } = actionDoc;
  const phone = actionDoc.phone || sessionDoc.phone || "";
  const email = (sessionDoc.userEmail || actionDoc.email || "").toLowerCase();

  console.log(
    `[chatbotAction] Processing action=${action} phone=${phone} location=${locationId}`
  );

  // 1. Resolve the specific location from session
  const fullId   = toFullLocationId(locationId);
  const location = (sessionDoc.locationsData || []).find(
    (l) => l.locationResourceName === fullId || l.locationResourceName === locationId
  );
  if (!location) {
    await markFailed(_id, phone, action, "Location not found in connected business session");
    return;
  }

  // 2. Load tokens from GMBConnection (saved at connect time — no GmbUser lookup needed)
  const tokens = await getTokensByPhone(phone).catch(() => null);
  if (!tokens?.accessToken) {
    await markFailed(
      _id, phone, action,
      "Tokens not found. Please reconnect Google Business."
    );
    return;
  }

  // 3. Refresh access token (keeps it fresh, saves back to DB)
  let { accessToken, refreshToken } = tokens;
  try {
    accessToken = await refreshAndSaveAccessToken(phone, refreshToken);
  } catch (refreshErr) {
    console.warn("[chatbotAction] Token refresh failed, using stored token:", refreshErr?.message);
  }

  // 4. Dispatch to the correct service handler
  let result;
  try {
    switch (action) {
      case "website":
        result = await handleWebsite({ location, email, locationId, accessToken });
        break;

      case "health_score":
        result = await handleHealthScore({ location, email, accessToken });
        break;

      case "magic_qr":
        result = await handleMagicQr({ location, email, locationId });
        break;

      case "insights":
        result = await handleInsights({ accessToken, locationId, location });
        break;

      case "keyword_planner":
        result = await handleKeywordPlanner({ location });
        break;

      default:
        throw new Error(`Unknown action type: "${action}"`);
    }

    // 5. Persist success
    await ChatbotAction.findByIdAndUpdate(_id, {
      status: "success",
      result,
      updatedAt: new Date(),
    });

    // 6. Fire completion webhook
    await notifyActionComplete({ phone, action, status: "success", result });

    console.log(`[chatbotAction] Completed action=${action} phone=${phone}`);
  } catch (err) {
    const msg = err?.message || "Unexpected error during action processing";
    console.error(`[chatbotAction] action=${action} phone=${phone} error:`, msg);
    await markFailed(_id, phone, action, msg);
  }
}
