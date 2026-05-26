import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";

export async function POST(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const igId = searchParams.get("igId");

    if (!userId || !igId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId and igId are required",
        },
        { status: 400 },
      );
    }

    // Delete selected Instagram profile
    const deletedProfile = await InstagramPage.findOneAndDelete({
      userId,
      igId,
    });

    if (!deletedProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Instagram profile not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instagram profile disconnected successfully",
    });
  } catch (error) {
    console.error("Instagram Disconnect Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
