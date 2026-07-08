import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/dbConnect";
import KeywordResearchReport from "@/models/KeywordResearchReport";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let reportId;
  try {
    const body = await req.json();
    reportId = body.reportId;
    const { userId, email } = body;

    if (!reportId || !userId) {
      return NextResponse.json(
        { success: false, error: "reportId and userId are required" },
        { status: 400 }
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { success: false, error: "Email (SMTP) is not configured" },
        { status: 503 }
      );
    }

    await dbConnect();

    const report = await KeywordResearchReport.findOne({ _id: reportId, userId });
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    if (!report.pdfUrl || report.pdfStatus !== "generated") {
      return NextResponse.json(
        { success: false, error: "PDF not generated yet. Generate PDF first." },
        { status: 400 }
      );
    }

    let recipientEmail = email;
    let userName = "User";

    if (!recipientEmail) {
      const user = await User.findOne({ userId });
      recipientEmail = user?.email;
      userName = user?.fullName || "User";
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: "Email address not found. Please add your email in profile settings." },
        { status: 400 }
      );
    }

    await KeywordResearchReport.findByIdAndUpdate(reportId, {
      emailStatus: "sending",
      emailError: "",
    });

    const pdfResponse = await fetch(report.pdfUrl);
    if (!pdfResponse.ok) {
      await KeywordResearchReport.findByIdAndUpdate(reportId, {
        emailStatus: "failed",
        emailError: "Could not fetch PDF for attachment",
      });
      return NextResponse.json(
        { success: false, error: "Could not fetch PDF for attachment" },
        { status: 500 }
      );
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const safeName = report.businessName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const genDate = new Date(report.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Your AI Keyword Research Report — ${report.businessName}`,
      html: `
<div style="background:#f5f5f5;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;padding:40px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#0B0F19;font-size:22px;margin:0;">AI Keyword Research Report</h1>
      <p style="color:#94A3B8;font-size:13px;margin-top:8px;">Generated on ${genDate}</p>
    </div>
    <p style="color:#333;font-size:15px;line-height:1.6;">Hello ${userName},</p>
    <p style="color:#333;font-size:15px;line-height:1.6;">
      Your AI-powered keyword research report for <strong>${report.businessName}</strong> is ready.
      We've identified <strong>${report.keywords.length} high-value keywords</strong> to boost your Google visibility.
    </p>
    ${report.aiSummary ? `<p style="color:#475569;font-size:14px;background:#F8FAFC;padding:16px;border-radius:8px;border-left:4px solid #EAB308;">${report.aiSummary}</p>` : ""}
    <p style="color:#333;font-size:15px;">The full report is attached as a PDF. You can also <a href="${report.pdfUrl}" style="color:#EAB308;">download it here</a>.</p>
    <p style="color:#94A3B8;font-size:12px;margin-top:30px;text-align:center;">Powered by Limbu.ai</p>
  </div>
</div>`,
      attachments: [
        {
          filename: `Keyword_Research_${safeName}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    await KeywordResearchReport.findByIdAndUpdate(reportId, {
      emailStatus: "sent",
      emailError: "",
    });

    return NextResponse.json({
      success: true,
      message: "Keyword research report sent via email",
    });
  } catch (err) {
    console.error("[ai-keyword-email]", err);

    if (reportId) {
      try {
        await dbConnect();
        await KeywordResearchReport.findByIdAndUpdate(reportId, {
          emailStatus: "failed",
          emailError: err.message,
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json(
      { success: false, error: err.message || "Email send failed" },
      { status: 500 }
    );
  }
}
