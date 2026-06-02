import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import JobApplication from "@/models/JobApplication";

export async function GET() {
  try {
    await dbConnect();

    const applications = await JobApplication.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID is required",
        },
        { status: 400 }
      );
    }

    await JobApplication.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Application deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}