import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

export async function POST(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { pageId, pageIds } = body;

    let result;

    // Case 1: Sab pages disconnect (empty body)
    if (!pageId && (!pageIds || pageIds.length === 0)) {
      result = await FacebookPage.deleteMany({ userId });

      return NextResponse.json({
        success: true,
        message: "All Facebook pages disconnected",
        deletedCount: result.deletedCount,
      });
    }

    // Case 2: Multiple specific pages
    if (pageIds && pageIds.length > 0) {
      result = await FacebookPage.deleteMany({
        userId,
        pageId: { $in: pageIds },
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: "No matching Facebook pages found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} Facebook page(s) disconnected`,
        deletedCount: result.deletedCount,
      });
    }

    // Case 3: Single page (original behavior)
    const deletedPage = await FacebookPage.findOneAndDelete({ userId, pageId });

    if (!deletedPage) {
      return NextResponse.json(
        { success: false, error: "Facebook page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Facebook page disconnected successfully",
      deletedCount: 1,
    });

  } catch (error) {
    console.error("Disconnect Facebook Error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}