

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
font-size:25px;
line-height:1.2;
font-weight:800;
color:#111827;
">
Welcome to Limbu AI 
</h1>

<p style="
margin-top:30px;
font-size:16px;
line-height:1.8;
color:#374151;
">
Hello <strong>${customerName}</strong>,
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
Your account has been created successfully.
</p>

<div style="
// background:#ecfdf5;
border-left:4px solid #22c55e;
padding:16px;
border-radius:10px;
margin:25px 0;
">
<p style="
margin:0;
color:#166534;
font-weight:600;
">
✓ Registration completed successfully
</p>
</div>

<div style="
// background:#fffbeb;
border:1px solid #fde68a;
border-radius:12px;
padding:25px;
margin:30px 0;
text-align:center;
">



<p style="
margin:0;
font-size:24px;
font-weight:700;
color:#92400e;
">
Congratulations!
</p>

<p style="
margin-top:12px;
font-size:16px;
line-height:1.8;
color:#92400e;
">
You have received
<strong>500 Free Coins</strong>
in your Limbu AI account.
</p>

</div>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
You can now log in and start exploring all the powerful AI features available on Limbu AI.
</p>

<p style="
font-size:16px;
line-height:1.8;
color:#374151;
">
We're excited to have you with us and look forward to helping you grow with AI.
</p>

<div style="
text-align:center;
margin:35px 0;
">

<a
href="https://limbu.ai/login"
style="
background:#111827;
color:#ffffff;
text-decoration:none;
padding:14px 28px;
border-radius:8px;
display:inline-block;
font-weight:600;
"
>
Login To Your Account
</a>

</div>

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