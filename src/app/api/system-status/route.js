import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SystemConfig from "@/models/SystemConfig";

const KEY = "global";

export async function GET() {
  try {
    await dbConnect();
    const config = await SystemConfig.findOne({ key: KEY });
    return NextResponse.json({
      success: true,
      maintenanceMode: !!config?.maintenanceMode,
      maintenanceMessage:
        config?.maintenanceMessage ||
        "We are performing scheduled maintenance. Please check back shortly.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        maintenanceMode: false,
        maintenanceMessage: "Temporary issue loading status.",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
