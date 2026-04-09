import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SystemConfig from "@/models/SystemConfig";
import { logApiRequest } from "@/lib/apiLogger";

const KEY = "global";

export async function GET() {
  const startedAt = Date.now();
  try {
    await dbConnect();
    let config = await SystemConfig.findOne({ key: KEY });
    if (!config) {
      config = await SystemConfig.create({ key: KEY });
    }

    const response = {
      success: true,
      maintenanceMode: !!config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage || "",
      updatedBy: config.updatedBy || "",
      updatedAt: config.updatedAt,
    };
    await logApiRequest({
      path: "/api/admin/system-status",
      method: "GET",
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(response);
  } catch (error) {
    await logApiRequest({
      path: "/api/admin/system-status",
      method: "GET",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Failed to fetch system status",
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  const startedAt = Date.now();
  try {
    await dbConnect();
    const body = await req.json();
    const maintenanceMode = !!body.maintenanceMode;
    const maintenanceMessage =
      body.maintenanceMessage?.trim() ||
      "We are performing scheduled maintenance. Please check back shortly.";
    const updatedBy = body.updatedBy || "admin";

    const config = await SystemConfig.findOneAndUpdate(
      { key: KEY },
      { maintenanceMode, maintenanceMessage, updatedBy },
      { upsert: true, new: true },
    );

    await logApiRequest({
      path: "/api/admin/system-status",
      method: "PUT",
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    await logApiRequest({
      path: "/api/admin/system-status",
      method: "PUT",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Failed to update system status",
    });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
