import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ApiRequestLog from "@/models/ApiRequestLog";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || 200);
    const logs = await ApiRequestLog.find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 1000));

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
