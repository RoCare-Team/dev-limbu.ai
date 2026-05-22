import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // webhook se aane wala data
    const body = await req.json();

    console.log("Webhook Data:", body);

    // yaha apna logic likho
    // database save, message send, etc.

    return NextResponse.json({
      success: true,
      message: "Webhook received successfully",
      data: body,
    });

  } catch (error) {
    console.log("Webhook Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}