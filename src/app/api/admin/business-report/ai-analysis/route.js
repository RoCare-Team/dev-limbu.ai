import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import BusinessDetails, {
  buildBusinessDetailsDoc,
} from "@/models/BusinessDetails";

const MODEL = "gpt-4o-mini";
const PROMPT_VERSION = "v2-hinglish";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Trims the stored place data down to what the model actually needs. */
function buildAnalysisInput(b) {
  return {
    businessName: b.displayName || b.searchedBusinessName,
    city: b.searchedCity,
    category: b.primaryTypeDisplayName || b.primaryType,
    types: b.types?.slice(0, 8) || [],
    businessStatus: b.businessStatus,
    address: b.formattedAddress,
    phone: b.nationalPhoneNumber || b.internationalPhoneNumber || "none",
    website: b.websiteUri || "none",
    rating: b.rating,
    reviewCount: b.userRatingCount,
    photoCount: b.photoCount,
    hasOpeningHours: b.signals?.hasOpeningHours,
    weekdayHours: b.weekdayDescriptions?.slice(0, 7) || [],
    editorialSummary: b.editorialSummary,
    priceLevel: b.priceLevel,
    profileCompleteness: b.signals?.profileCompleteness,
    signals: b.signals,
    recentReviews: (b.reviews || []).slice(0, 5).map((r) => ({
      rating: r?.rating,
      text: r?.text?.text || r?.originalText?.text || "",
    })),
  };
}

function buildPrompt(input) {
  return `You are a senior B2B sales analyst for Limbu, an Indian digital-marketing
company selling Google Business Profile management, social media posting, website
building, reviews management and local SEO to small and medium businesses.

Analyse this business's Google profile and produce a sales brief for the agent
who will call them. Be specific and reference the actual data — never generic.

*** LANGUAGE RULE — VERY IMPORTANT ***
Saara output HINGLISH mein likhna hai — Hindi bola jaata hai lekin likha English
(Roman) script mein. Pure English mein mat likhna, aur Devanagari script bhi mat
use karna.
- Sahi: "Inki Google rating 3.2 hai jo kaafi kam hai, isliye reviews management
  sabse pehle bechna chahiye."
- Galat (pure English): "Their Google rating is 3.2 which is quite low."
- Galat (Devanagari): "इनकी गूगल रेटिंग 3.2 है।"
Business terms jaise "Google Business Profile", "rating", "reviews", "website",
"SEO", "photos" English mein hi rehne do — wahi natural lagta hai.
Ye rule HAR text field pe lagta hai: summary, strengths, weaknesses,
opportunities, painPoints, talkingPoints, objectionHandling, recommendedServices
ke reason, pitchAngle, suggestedOpeningLine, suggestedWhatsAppMessage,
nextBestAction, businessCategory, estimatedMonthlyBudget.
Sirf ye fields fixed English values rakhenge (enum hain, translate mat karna):
leadTemperature (Hot/Warm/Cold), businessSize (Micro/Small/Medium/Large),
priority (High/Medium/Low), aur "service" ka naam.

BUSINESS DATA:
${JSON.stringify(input, null, 2)}

Scoring rules:
- overallScore: how attractive this lead is for Limbu (0-100). Weak online
  presence + real business = HIGH score (more to sell). Already perfect profile
  = LOW score.
- leadTemperature: "Hot" (>=70), "Warm" (40-69), "Cold" (<40).
- conversionLikelihood: realistic chance they buy (0-100).

Return ONLY valid JSON in exactly this shape (saari text values Hinglish mein):
{
  "overallScore": 0-100,
  "leadTemperature": "Hot|Warm|Cold",
  "conversionLikelihood": 0-100,
  "summary": "2-3 line brief for the agent, Hinglish mein",
  "scores": {
    "onlinePresence": 0-100,
    "reputation": 0-100,
    "profileCompleteness": 0-100,
    "contentQuality": 0-100,
    "competitiveness": 0-100
  },
  "businessCategory": "category Hinglish mein, e.g. 'Mobile shop'",
  "businessSize": "Micro|Small|Medium|Large",
  "estimatedMonthlyBudget": "e.g. 'Rs 5,000 - Rs 15,000 mahina'",
  "strengths": ["Hinglish points"],
  "weaknesses": ["Hinglish points"],
  "opportunities": ["Hinglish points"],
  "painPoints": ["Hinglish points"],
  "talkingPoints": ["4-6 baatein jo agent ko bolni chahiye, Hinglish mein"],
  "objectionHandling": [
    { "objection": "customer kya bolega, Hinglish", "response": "jawab, Hinglish" }
  ],
  "recommendedServices": [
    {
      "service": "service ka naam (English)",
      "priority": "High|Medium|Low",
      "reason": "kyun, Hinglish mein"
    }
  ],
  "pitchAngle": "is call ki strategy ek line mein, Hinglish",
  "suggestedOpeningLine": "agent sabse pehle kya bolega, Hinglish",
  "suggestedWhatsAppMessage": "chhota WhatsApp intro, Hinglish, 60 words se kam",
  "nextBestAction": "agla ek kadam, Hinglish"
}`;
}

/** Clamps a value into the 0-100 range the schema expects. */
const score = (v) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(100, Math.round(v)))
    : null;

const strList = (v) =>
  Array.isArray(v) ? v.filter((s) => typeof s === "string" && s.trim()) : [];

/** Maps the model's JSON onto the aiAnalysis sub-schema. */
function normaliseAnalysis(ai, { tokensUsed, generatedBy }) {
  const temp = ["Hot", "Warm", "Cold"].includes(ai?.leadTemperature)
    ? ai.leadTemperature
    : "";
  const size = ["Micro", "Small", "Medium", "Large"].includes(ai?.businessSize)
    ? ai.businessSize
    : "";

  return {
    overallScore: score(ai?.overallScore),
    leadTemperature: temp,
    conversionLikelihood: score(ai?.conversionLikelihood),
    summary: ai?.summary || "",
    scores: {
      onlinePresence: score(ai?.scores?.onlinePresence),
      reputation: score(ai?.scores?.reputation),
      profileCompleteness: score(ai?.scores?.profileCompleteness),
      contentQuality: score(ai?.scores?.contentQuality),
      competitiveness: score(ai?.scores?.competitiveness),
    },
    businessCategory: ai?.businessCategory || "",
    businessSize: size,
    estimatedMonthlyBudget: ai?.estimatedMonthlyBudget || "",
    strengths: strList(ai?.strengths),
    weaknesses: strList(ai?.weaknesses),
    opportunities: strList(ai?.opportunities),
    painPoints: strList(ai?.painPoints),
    talkingPoints: strList(ai?.talkingPoints),
    objectionHandling: Array.isArray(ai?.objectionHandling)
      ? ai.objectionHandling
          .filter((o) => o?.objection)
          .map((o) => ({
            objection: o.objection || "",
            response: o.response || "",
          }))
      : [],
    recommendedServices: Array.isArray(ai?.recommendedServices)
      ? ai.recommendedServices
          .filter((s) => s?.service)
          .map((s) => ({
            service: s.service || "",
            priority: ["High", "Medium", "Low"].includes(s.priority)
              ? s.priority
              : "",
            reason: s.reason || "",
          }))
      : [],
    pitchAngle: ai?.pitchAngle || "",
    suggestedOpeningLine: ai?.suggestedOpeningLine || "",
    suggestedWhatsAppMessage: ai?.suggestedWhatsAppMessage || "",
    nextBestAction: ai?.nextBestAction || "",
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    tokensUsed: tokensUsed ?? null,
    generatedBy: generatedBy || "",
    raw: ai,
  };
}

/**
 * Runs the AI sales analysis on a stored BusinessDetails record and saves it.
 * Body: { userId, placeId?, force?, adminEmail? }
 */
export async function POST(req) {
  let business = null;

  try {
    await dbConnect();

    const { userId, placeId, force, adminEmail, place, businessName, city } =
      await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    // A `place` in the body means the admin picked a business in the modal but
    // may not have generated the PDF yet — upsert it so analysis can run.
    if (place && typeof place === "object") {
      const user = await User.findOne({ userId });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }
      const doc = buildBusinessDetailsDoc({ user, place, businessName, city });
      business = await BusinessDetails.findOneAndUpdate(
        { userId: doc.userId, placeId: doc.placeId },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } else {
      // Newest business for this user unless a specific place is requested.
      business = placeId
        ? await BusinessDetails.findOne({ userId, placeId })
        : await BusinessDetails.findOne({ userId }).sort({ updatedAt: -1 });
    }

    if (!business) {
      return NextResponse.json(
        { success: false, error: "No business details found for this user" },
        { status: 404 },
      );
    }

    // Reuse an analysis younger than 7 days unless forced.
    const analysedAt = business.aiAnalysedAt
      ? new Date(business.aiAnalysedAt).getTime()
      : 0;
    if (
      !force &&
      business.aiAnalysis &&
      analysedAt &&
      Date.now() - analysedAt < SEVEN_DAYS_MS
    ) {
      return NextResponse.json({
        success: true,
        cached: true,
        aiAnalysis: business.aiAnalysis,
        aiAnalysedAt: business.aiAnalysedAt,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY not configured in .env.local" },
        { status: 500 },
      );
    }

    business.aiAnalysisStatus = "processing";
    await business.save();

    const prompt = buildPrompt(buildAnalysisInput(business));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const analysis = normaliseAnalysis(parsed, {
      tokensUsed: data.usage?.total_tokens ?? null,
      generatedBy: adminEmail || "",
    });

    const saved = await BusinessDetails.saveAiAnalysis(
      { userId: business.userId, placeId: business.placeId },
      analysis,
    );

    return NextResponse.json({
      success: true,
      cached: false,
      aiAnalysis: saved?.aiAnalysis || analysis,
      aiAnalysedAt: saved?.aiAnalysedAt || new Date(),
    });
  } catch (error) {
    console.error("business-report/ai-analysis error:", error);

    if (business) {
      business.aiAnalysisStatus = "failed";
      business.aiAnalysisError = error.message?.slice(0, 500) || "Unknown error";
      await business.save().catch(() => {});
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/** Reads the stored analysis without triggering a new run. */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const placeId = searchParams.get("placeId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 },
      );
    }

    const query = placeId ? { userId, placeId } : { userId };
    const business = await BusinessDetails.findOne(query)
      .sort({ updatedAt: -1 })
      .lean();

    if (!business) {
      return NextResponse.json(
        { success: false, error: "No business details found for this user" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      business,
      aiAnalysis: business.aiAnalysis || null,
      aiAnalysedAt: business.aiAnalysedAt || null,
      aiAnalysisStatus: business.aiAnalysisStatus,
    });
  } catch (error) {
    console.error("business-report/ai-analysis GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
