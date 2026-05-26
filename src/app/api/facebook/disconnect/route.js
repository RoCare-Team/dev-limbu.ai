import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

export async function POST(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const pageId = searchParams.get("pageId");

    if (!userId || !pageId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId and pageId required",
        },
        { status: 400 }
      );
    }

    // Delete only selected page
    const deletedPage = await FacebookPage.findOneAndDelete({
      userId,
      pageId,
    });

    if (!deletedPage) {
      return NextResponse.json(
        {
          success: false,
          error: "Facebook page not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Facebook page disconnected successfully",
    });

  } catch (error) {
    console.error("Disconnect Facebook Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}