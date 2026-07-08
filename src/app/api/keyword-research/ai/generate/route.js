import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert SEO and local business keyword researcher specializing in Google Business Profile optimization.

Given ONLY a business name, you must:
1. Infer the most likely business category, services, industry, and customer search intent
2. Never ask for more information — always make intelligent assumptions
3. Generate exactly 20-25 highly relevant SEO keywords

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "inferredCategory": "string",
  "inferredServices": ["service1", "service2"],
  "industry": "string",
  "searchIntent": "brief description of primary search intent",
  "aiSummary": "2-3 sentence strategic summary of the keyword research and how to use these keywords",
  "keywords": [
    {
      "keyword": "string",
      "type": "primary|long-tail|local|commercial|gbp",
      "volume": number,
      "competition": "LOW|MEDIUM|HIGH",
      "intent": "informational|transactional|navigational|local"
    }
  ]
}

Keyword mix requirements:
- 4-6 primary keywords
- 5-7 long-tail keywords
- 4-5 local keywords (include city/area modifiers when location context is provided)
- 3-4 commercial intent keywords (buy, hire, near me, best, affordable, etc.)
- 3-4 Google Business Profile (GBP) keywords optimized for local map pack

Volume should be realistic estimated monthly searches (100-500000 range).
Competition should reflect realistic SEO difficulty.`;

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenAI is not configured (OPENAI_API_KEY)." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { userId, businessName, slug, locationName } = body;

    if (!userId || !businessName?.trim()) {
      return NextResponse.json(
        { success: false, error: "userId and businessName are required" },
        { status: 400 }
      );
    }

    const locationContext = locationName
      ? `\nLocation context: ${locationName} — include local keywords for this area.`
      : "";

    const userPrompt = `Business name: "${businessName.trim()}"${locationContext}

Analyze this business and generate 20-25 SEO keywords. If the name is ambiguous, infer the most common/likely business type.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    const aiData = await res.json();
    if (!res.ok) {
      console.error("[ai-keyword-generate]", aiData);
      return NextResponse.json(
        { success: false, error: aiData.error?.message || "OpenAI request failed" },
        { status: 502 }
      );
    }

    const raw = aiData.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 502 }
      );
    }

    const keywords = (parsed.keywords || []).map((k) => ({
      keyword: String(k.keyword || "").trim(),
      type: k.type || "primary",
      volume: Number(k.volume) || Math.floor(Math.random() * 5000) + 100,
      competition: ["LOW", "MEDIUM", "HIGH"].includes(k.competition)
        ? k.competition
        : "MEDIUM",
      intent: k.intent || "",
    })).filter((k) => k.keyword);

    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "AI did not return any keywords" },
        { status: 502 }
      );
    }

    await dbConnect();

    const report = await KeywordResearchReport.create({
      userId,
      businessName: businessName.trim(),
      slug: slug || "",
      locationName: locationName || "",
      inferredCategory: parsed.inferredCategory || "",
      inferredServices: parsed.inferredServices || [],
      industry: parsed.industry || "",
      searchIntent: parsed.searchIntent || "",
      aiSummary: parsed.aiSummary || "",
      keywords,
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        businessName: report.businessName,
        inferredCategory: report.inferredCategory,
        inferredServices: report.inferredServices,
        industry: report.industry,
        searchIntent: report.searchIntent,
        aiSummary: report.aiSummary,
        keywords: report.keywords,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    console.error("[ai-keyword-generate]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
