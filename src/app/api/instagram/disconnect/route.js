import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

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

    // Body se igId ya igIds lo
    const body = await req.json().catch(() => ({}));
    const { igId, igIds } = body;

    let result;

    // Case 1: Sab pages disconnect karo (sirf userId)
    if (!igId && (!igIds || igIds.length === 0)) {
      result = await InstagramPage.deleteMany({ userId });

      return NextResponse.json({
        success: true,
        message: `All Instagram profiles disconnected`,
        deletedCount: result.deletedCount,
      });
    }

    // Case 2: Multiple specific pages disconnect karo
    if (igIds && igIds.length > 0) {
      result = await InstagramPage.deleteMany({
        userId,
        igId: { $in: igIds },
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: "No matching Instagram profiles found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} Instagram profile(s) disconnected`,
        deletedCount: result.deletedCount,
      });
    }

    // Case 3: Single page disconnect karo (original behavior)
    const deletedProfile = await InstagramPage.findOneAndDelete({
      userId,
      igId,
    });

    if (!deletedProfile) {
      return NextResponse.json(
        { success: false, error: "Instagram profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instagram profile disconnected successfully",
      deletedCount: 1,
    });

  } catch (error) {
    console.error("Instagram Disconnect Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}