

import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, customerName } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Limbu AI",

      html: `
      <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
        
        <h2 style="color:#4f46e5;">
          Welcome to Limbu AI 
        </h2>

        <h2>Hello ${customerName},</h2>

       <p>
  Your account has been created successfully.
</p>

<div
  style="
    background:#eefdf3;
    border:1px solid #22c55e;
    padding:12px 16px;
    border-radius:10px;
    margin:15px 0;
    color:#166534;
    font-weight:600;
  "
>
   Congratulations! You have received
  <b>500 Free Coins</b> in your Limbu AI account.
</div>

<p>
  You can now login and start using Limbu AI.
</p>

        <br/>

        <p>
          Thank you for joining us.
        </p>

        <p>
          Team Limbu AI<br/>
          info@limbu.ai
        </p>

      </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Registration email sent",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}