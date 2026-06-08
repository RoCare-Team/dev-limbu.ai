import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { revenueId } = await req.json();

    const revenue = await FranchiseRevenue.findById(revenueId);

    // console.log("Revenue Type:", revenue.type);
    // console.log("Revenue Plan:", revenue.plan);

    if (!revenue) {
      return NextResponse.json(
        { success: false, message: "Revenue not found" },
        { status: 404 },
      );
    }

    const user = await User.findOne({
      userId: revenue.leadId,
    });

    if (!user?.email) {
      return NextResponse.json(
        { success: false, message: "Customer email not found" },
        { status: 400 },
      );
    }

    // SAME PDF API KO HIT KARO
    const pdfResponse = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/invoice-tax?id=${revenueId}`
);

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemType = revenue.type === "service" ? "service" : "package";

    

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `${revenue.plan} Invoice #${revenueId}`,

      html: `
<div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
  <h3 style="margin:0 0 15px 0;">
    Limbu AI Tax Invoice  
  </h3>

  <p>Hello ${user.fullName || user.name},</p>

  <p>
   Your invoice for the <b>${revenue.plan}</b> ${itemType} is ready.
  </p>

  <p>
    Please find the attached PDF invoice. <br>

    Thank you for choosing Limbu AI.

  </p>

</div>
`,

      attachments: [
        {
          filename: `Invoice-${revenueId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
