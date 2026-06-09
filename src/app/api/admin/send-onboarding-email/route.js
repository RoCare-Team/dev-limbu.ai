import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      email,
      customerName,
      planName,
      amount,
      type,
      startDate,
      expiryDate,
    } = await req.json();

    // console.log("EMAIL_USER =", process.env.EMAIL_USER);
    // console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "FOUND" : "MISSING");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const bookingMessage =
      type === "package"
        ? "Your package has been successfully activated."
        : "Your service has been successfully booked.";

    const titleText =
      type === "service"
        ? "Your Service Has Been Booked."
        : "Your Package Has Been Activated.";

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Limbu AI - ${bookingMessage}`,

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
font-size:30px;
line-height:1.2;
font-weight:800;
color:#111827;
">
${
  type === "service"
    ? "Your Service Has Been Booked."
    : "Your Package Has Been Activated."
}
</h1>

<p style="
margin-top:30px;
font-size:16px;
line-height:1.8;
color:#374151;
">
Dear <strong>${customerName}</strong>,
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
We are pleased to confirm your booking. Our team has successfully received your request and will begin processing it shortly.
</p>

<div style="
background:#f9fafb;
border:1px solid #e5e7eb;
border-radius:12px;
padding:20px;
margin:30px 0;
">

<p><strong>Plan:</strong> ${planName}</p>

<p><strong>Amount:</strong> ₹${amount}</p>

<p><strong>Start Date:</strong> ${startDate || "-"}</p>

<p><strong>Expiry Date:</strong> ${expiryDate || "-"}</p>

</div>

<h3 style="
margin-bottom:15px;
color:#111827;
">
What Happens Next?
</h3>

<p style="
margin:8px 0;
color:#374151;
">
✔ Our team will review your booking.
</p>

<p style="
margin:8px 0;
color:#374151;
">
✔ You will receive further updates regarding the progress of your request.
</p>

<p style="
margin:8px 0;
color:#374151;
">
✔ If additional information is required, we will contact you using the details provided.
</p>

<h3 style="
margin-top:35px;
margin-bottom:15px;
color:#111827;
">
Need Assistance?
</h3>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
If you have any questions or need support, simply reply to this email and our team will be happy to help.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
Thank you for trusting Limbu AI.
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

`

    });

    console.log("Email sent:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
