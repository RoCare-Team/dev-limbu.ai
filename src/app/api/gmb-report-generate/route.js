import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";

// Generate and send GMB report with PDF attachment
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, month = "last" } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.phone) {
      return NextResponse.json(
        { success: false, message: "User phone not found" },
        { status: 400 }
      );
    }

    // Calculate month
    let reportMonth;
    if (month === "current") {
      reportMonth = new Date();
    } else {
      reportMonth = new Date();
      reportMonth.setMonth(reportMonth.getMonth() - 1);
    }

    const monthLabel = reportMonth.toLocaleString("en-IN", { 
      month: "long", 
      year: "numeric" 
    });

    const firstName = user.fullName?.split(" ")[0] || "User";
    const phone = user.phone.replace(/\D/g, "");

    // Dynamic report URL - in production, generate actual PDF
    const reportUrl = `https://limbu.ai/dashboard?report=true&userId=${userId}&month=${month}&date=${reportMonth.toISOString()}`;

    // Send WhatsApp with report URL (PDF attachment)
    const payload = {
      campaignName: "gmb_report",
      phone: `91${phone}`,
      firstName,
      reportUrl,
      month,
    };

    const response = await fetch(`${req.nextUrl.origin}/api/users-whastapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return NextResponse.json({
        success: true,
        message: `GMB Report sent successfully for ${monthLabel}`,
        month: monthLabel,
        sentTo: phone,
        reportUrl,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || "Failed to send WhatsApp",
      });
    }

  } catch (error) {
    console.error("[GMB Report Generate Error]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
