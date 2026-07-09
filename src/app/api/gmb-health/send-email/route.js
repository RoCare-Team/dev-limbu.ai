import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { userId, businessName, monthLabel, pdfBase64 } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
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

    const user = await User.findOne({ userId });
    if (!user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account email is missing. Update it in profile settings.",
        },
        { status: 400 }
      );
    }

    const safeName = (businessName || "Business").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);

    const attachments = [];
    if (pdfBase64) {
      const base64 = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;
      attachments.push({
        filename: `Business_Health_${safeName}.pdf`,
        content: Buffer.from(base64, "base64"),
        contentType: "application/pdf",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your Business Health Report — ${businessName || "Business"}`,
      html: `
<div style="background:#f5f5f5;padding:40px 20px;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;padding:40px;">
    <h1 style="color:#0B0F19;font-size:22px;">Business Health Report</h1>
    ${monthLabel ? `<p style="color:#94A3B8;font-size:13px;">${monthLabel}</p>` : ""}
    <p style="color:#333;font-size:15px;">Hello ${user.fullName || "User"},</p>
    <p style="color:#333;font-size:15px;">
      Your Google Business Profile health report for <strong>${businessName || "your business"}</strong> ${attachments.length ? "is attached as a PDF" : "is ready"}.
    </p>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:24px;">Powered by Limbu.ai</p>
  </div>
</div>`,
      attachments,
    });

    return NextResponse.json({
      success: true,
      message: `Health report sent to your email (${user.email})`,
    });
  } catch (err) {
    console.error("[gmb-health-send-email]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Email send failed" },
      { status: 500 }
    );
  }
}
