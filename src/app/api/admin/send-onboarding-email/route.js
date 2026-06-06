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

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Limbu AI - ${bookingMessage}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
         <h style="   color:#4f46e5;  margin-bottom:20px;">
   Welcome to Limbu AI
</h2>

          <p>Dear ${customerName},</p>

          <p  style="font-size:16px; color:#374151; line-height:1.7; ">
  ${bookingMessage}
</p>

        <table
  style="
    width:100%;
    max-width:500px;
    border-collapse:collapse;
    margin-top:15px;
    border-radius:10px;
    overflow:hidden;
    box-shadow:0 2px 10px rgba(0,0,0,0.08);
  "
>
  <tr style="background:#4f46e5;color:white;">
    <th
      style="
        padding:12px;
        text-align:left;
        font-size:14px;
      "
    >
      Details
    </th>
    <th
      style="
        padding:12px;
        text-align:left;
        font-size:14px;
      "
    >
      Information
    </th>
  </tr>

  <tr style="background:#f9fafb;">
    <td style="padding:12px;font-weight:600;">
       Plan
    </td>
    <td style="padding:12px;">
      ${planName}
    </td>
  </tr>

  <tr>
    <td style="padding:12px;font-weight:600;">
       Amount
    </td>
    <td style="padding:12px;">
      ₹${amount}
    </td>
  </tr>

  <tr style="background:#f9fafb;">
    <td style="padding:12px;font-weight:600;">
       Start Date
    </td>
    <td style="padding:12px;">
      ${startDate || "-"}
    </td>
  </tr>

  <tr>
    <td style="padding:12px;font-weight:600;">
       Expiry Date
    </td>
    <td style="padding:12px;">
      ${expiryDate || "-"}
    </td>
  </tr>
</table>

          <br />

          <p>Thank you for choosing us.</p>

         <p>
  Best Regards,<br />
  Team Limbu AI<br />
  info@limbu.ai
</p>
        </div>
      `,
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
