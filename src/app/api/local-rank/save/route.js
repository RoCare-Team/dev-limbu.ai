import dbConnect from "@/lib/dbConnect";
import LocalRankResult from "@/models/LocalRankResult";

/**
 * POST — save one Local Rank Tracker audit snapshot.
 * Body: { userId, keyword, city, businessName, locationId, gridSize, points, summary, rawResponse }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userId,
      email,
      fullName,
      phone,
      plan,
      keyword,
      city,
      businessName,
      locationId,
      gridSize,
      points,
      summary,
      rawResponse,
    } = body || {};

    if (!userId) {
      return Response.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }
    if (!keyword) {
      return Response.json(
        { success: false, message: "keyword is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(points) || points.length === 0) {
      return Response.json(
        { success: false, message: "No grid data to save" },
        { status: 400 },
      );
    }

    await dbConnect();

    // 15-day duplicate guard: don't allow saving the SAME keyword + grid +
    // business again if one was already saved within the last 15 days.
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const fifteenDaysAgo = new Date(Date.now() - FIFTEEN_DAYS_MS);

    const existing = await LocalRankResult.findOne({
      userId,
      keyword,
      gridSize: gridSize || "",
      businessName: businessName || "",
      createdAt: { $gte: fifteenDaysAgo },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existing) {
      const nextEligible = new Date(
        new Date(existing.createdAt).getTime() + FIFTEEN_DAYS_MS,
      );
      return Response.json(
        {
          success: false,
          code: "DUPLICATE_WITHIN_15_DAYS",
          message: `Already saved for this keyword & grid in the last 15 days. You can save again after ${nextEligible.toLocaleDateString(
            "en-IN",
            { day: "numeric", month: "short", year: "numeric" },
          )}.`,
          lastSavedAt: existing.createdAt,
          nextEligibleAt: nextEligible,
        },
        { status: 409 },
      );
    }

    const saved = await LocalRankResult.create({
      userId,
      email: email || "",
      fullName: fullName || "",
      phone: phone || "",
      plan: plan || "",
      keyword,
      city: city || "",
      businessName: businessName || "",
      locationId: locationId || "",
      gridSize: gridSize || "",
      points,
      summary: summary || {},
      rawResponse: rawResponse ?? null,
    });

    return Response.json({ success: true, data: saved });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET — list saved audit snapshots for comparison.
 * Query: userId (required), keyword, businessName, gridSize (all optional filters)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const keyword = searchParams.get("keyword");
    const businessName = searchParams.get("businessName");
    const gridSize = searchParams.get("gridSize");

    if (!userId) {
      return Response.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const query = { userId };
    if (keyword) query.keyword = keyword;
    if (businessName) query.businessName = businessName;
    if (gridSize) query.gridSize = gridSize;

    const results = await LocalRankResult.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json({ success: true, data: results });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
