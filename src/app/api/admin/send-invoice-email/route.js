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

<div style="
background:#f5f5f5;
padding:40px 20px;
font-family:Arial,sans-serif;
">

<div style="
max-width:650px;
margin:auto;
background:#ffffff;
border-radius:16px;
padding:40px;
">

<a href="https://limbu.ai">
<img
src="https://limbu.ai/images/bg-logo.png"
alt="Limbu AI"
style="
width:80px;
display:block;
margin-bottom:20px;
"
/>
</a>

<h1 style="
margin:0;
font-size:27  px;
line-height:1.2;
font-weight:800;
color:#111827;
">
Your Invoice Is Ready
</h1>

<p style="
margin-top:30px;
font-size:16px;
line-height:1.8;
color:#374151;
">
Hello <strong>${user.fullName || user.name}</strong>,
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
Thank you for choosing <strong>Limbu AI</strong>.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
Your tax invoice for the
<strong>${revenue.plan}</strong>
${itemType}
has been generated successfully.
</p>

<div style="
background:#f9fafb;
border:1px solid #e5e7eb;
border-radius:12px;
padding:20px;
margin:30px 0;
">

<p style="margin:0 0 10px 0;">
<strong>Plan:</strong> ${revenue.plan}
</p>

<p style="margin:0 0 10px 0;">
<strong>Type:</strong> ${itemType}
</p>

<p style="margin:0;">
<strong>Status:</strong>
<span >
Invoice Generated
</span>
</p>

</div>

<div style="
background:#eff6ff;
border-left:4px solid #2563eb;
padding:16px;
border-radius:10px;
margin-bottom:25px;
">

<p style="
margin:0;
color:#1e40af;
font-weight:600;
">
📄 Your PDF invoice is attached with this email.
</p>

</div>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
Please keep this invoice for your records. If you have any billing questions, simply reply to this email and our support team will assist you.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
We appreciate your trust in Limbu AI and look forward to serving you again.
</p>

<div style="
margin-top:35px;
padding-top:25px;
border-top:1px solid #e5e7eb;
">

<p style="
margin:0;
color:#374151;
">
Best Regards,
</p>

<p style="
margin:8px 0 0;
font-size:18px;
font-weight:700;
color:#111827;
">
Limbu AI Team
</p>

<p style="
margin:8px 0 0;
color:#2563eb;
">
info@limbu.ai
</p>

<p style="
margin:5px 0 0;
color:#2563eb;
">
https://limbu.ai
</p>

</div>

</div>

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
