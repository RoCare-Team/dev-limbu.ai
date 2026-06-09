import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InhousePinterestMapping from "@/models/InhousePinterestMapping";

const SPECIAL_EMAIL = "rocare7@gmail.com";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAllowedEmail(email) {
  return normalizeEmail(email) === SPECIAL_EMAIL;
}

function normalizeText(value) {
  return String(value || "").trim();
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = normalizeEmail(searchParams.get("email"));

    if (!userId || !isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: "This in-house Pinterest feature is not allowed for this user." },
        { status: 403 },
      );
    }

    const mappings = await InhousePinterestMapping.find({ userId, email })
      .sort({ city: 1, locationName: 1 })
      .lean();

    return NextResponse.json({ success: true, mappings });
  } catch (error) {
    console.error("Inhouse Pinterest mapping GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mappings." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const userId = normalizeText(body.userId);
    const email = normalizeEmail(body.email);
    const mappings = Array.isArray(body.mappings) ? body.mappings : [];

    if (!userId || !isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: "This in-house Pinterest feature is not allowed for this user." },
        { status: 403 },
      );
    }

    if (!mappings.length) {
      return NextResponse.json(
        { success: false, error: "At least one mapping is required." },
        { status: 400 },
      );
    }

    const savedMappings = [];

    for (const item of mappings) {
      const locationId = normalizeText(item.locationId || item.id);
      const city = normalizeText(item.city);

      if (!locationId || !city) continue;

      const saved = await InhousePinterestMapping.findOneAndUpdate(
        { userId, locationId },
        {
          userId,
          email,
          locationId,
          accountId: normalizeText(item.accountId),
          locationName: normalizeText(item.locationName || item.name),
          locality: normalizeText(item.locality),
          city,
          websiteUri: normalizeText(item.websiteUri),
          visitUri: normalizeText(item.visitUri),
          pinterestProfileId: normalizeText(item.pinterestProfileId),
          boardId: normalizeText(item.boardId),
          boardName: normalizeText(item.boardName),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      savedMappings.push(saved);
    }

    return NextResponse.json({ success: true, mappings: savedMappings });
  } catch (error) {
    console.error("Inhouse Pinterest mapping POST error:", error.response?.data || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save mappings." },
      { status: 500 },
    );
  }
}
