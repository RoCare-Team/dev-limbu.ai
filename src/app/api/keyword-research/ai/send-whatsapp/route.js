import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";
import User from "@/models/User";
import {
  normalizeWhatsAppPhone,
  sendKeywordResearchWhatsApp,
} from "@/lib/keywordResearchWhatsApp";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { reportId, userId } = await req.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { success: false, error: "reportId and userId are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const report = await KeywordResearchReport.findOne({ _id: reportId, userId });
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    if (!report.pdfUrl || report.pdfStatus !== "generated") {
      return NextResponse.json(
        { success: false, error: "PDF not generated yet. Generate PDF first." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    const destination = normalizeWhatsAppPhone(user.phone || user.mobileNumber);
    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account mobile number is missing or invalid. Update it in profile settings.",
        },
        { status: 400 }
      );
    }

    const nameParts = (user.fullName || "User").trim().split(/\s+/);
    const fName = nameParts[0] || "User";
    const lName = nameParts.slice(1).join(" ") || "";

    await KeywordResearchReport.findByIdAndUpdate(reportId, {
      whatsappStatus: "sending",
      whatsappError: "",
    });

    const safeName = (report.businessName || "Keywords").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);

    const result = await sendKeywordResearchWhatsApp({
      destination,
      firstName: fName,
      lastName: lName,
      pdfUrl: report.pdfUrl,
      pdfFilename: `Keyword_Research_${safeName}`,
    });

    if (!result.ok) {
      await KeywordResearchReport.findByIdAndUpdate(reportId, {
        whatsappStatus: "failed",
        whatsappError: result.error,
      });
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    await KeywordResearchReport.findByIdAndUpdate(reportId, {
      whatsappStatus: "sent",
      whatsappError: "",
    });

    return NextResponse.json({
      success: true,
      message: `Report sent to your WhatsApp (${destination})`,
      data: result.waData,
    });
  } catch (err) {
    console.error("[ai-keyword-whatsapp]", err);
    return NextResponse.json(
      { success: false, error: err.message || "WhatsApp send failed" },
      { status: 500 }
    );
  }
}
