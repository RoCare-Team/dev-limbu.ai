import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const {
      email,
      customerName,
      planName,
      amount,
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

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Limbu AI - Service Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Limbu AI!</h2>

          <p>Dear ${customerName},</p>

          <p>Your service has been successfully booked.</p>

          <table border="1" cellpadding="10" cellspacing="0">
            <tr>
              <td><b>Plan</b></td>
              <td>${planName}</td>
            </tr>
            <tr>
              <td><b>Amount</b></td>
              <td>₹${amount}</td>
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
      { status: 500 }
    );
  }
}