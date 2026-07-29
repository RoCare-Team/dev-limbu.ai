import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import BusinessDetails from "@/models/BusinessDetails";

/**
 * Bulk lookup for the user-management table: tells the UI which of the given
 * users already have a saved AI analysis, so it can show the "AI Analysis"
 * button next to "Generate".
 *
 * Body: { userIds: string[] }
 * Returns: { success, data: { [userId]: { overallScore, leadTemperature, aiAnalysedAt } } }
 */
export async function POST(req) {
  try {
    await dbConnect();

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const rows = await BusinessDetails.find({
      userId: { $in: userIds },
      aiAnalysedAt: { $ne: null },
    })
      .select(
        "userId placeId displayName aiAnalysedAt aiAnalysis.overallScore aiAnalysis.leadTemperature",
      )
      .sort({ aiAnalysedAt: -1 })
      .lean();

    // Sorted newest-first, so the first row per user wins.
    const data = {};
    for (const row of rows) {
      if (data[row.userId]) continue;
      data[row.userId] = {
        placeId: row.placeId || "",
        businessName: row.displayName || "",
        overallScore: row.aiAnalysis?.overallScore ?? null,
        leadTemperature: row.aiAnalysis?.leadTemperature || "",
        aiAnalysedAt: row.aiAnalysedAt,
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("business-report/ai-analysis/status error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
