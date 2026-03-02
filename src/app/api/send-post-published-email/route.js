import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, platform, businessName, postUrl, locationName } = body;

    // Validate required fields
    if (!userId || !platform) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userId and platform are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch user details
    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userEmail = user.email;
    const userFullName = user.fullName || "User";

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "User email not found" },
        { status: 400 }
      );
    }

    // Generate email subject and body
    const emailSubject = `Your Post Has Been Successfully Published`;
    
const emailContent = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:50px 0;">
<tr>
<td align="center">

<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#4CAF50,#2e7d32);padding:40px;text-align:center;color:#ffffff;">
<h1 style="margin:0;font-size:28px;">🚀 Your Post is Live!</h1>
<p style="margin-top:10px;font-size:15px;opacity:0.9;">
Your brand just took another step forward.
</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:45px;color:#333;font-size:15px;line-height:1.7;">

<h2 style="margin-top:0;color:#2e7d32;">Hello ${userFullName},</h2>

<p>
Great news! Your latest post has been successfully published and is now reaching your audience.
Consistency builds trust — and trust builds business.
</p>

<div style="margin:30px 0;padding:20px;background:#f9fbfd;border-radius:10px;border:1px solid #e6edf5;">
<p style="margin:0 0 15px 0;"><strong>📌 Post Details</strong></p>

<table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
<tr>
<td width="40%" style="color:#808080;">Platform</td>
<td><strong>${platform}</strong></td>
</tr>
<tr>
<td style="color:#808080;">Business Name</td>
<td><strong>${businessName || locationName || 'N/A'}</strong></td>
</tr>
<tr>
<td style="color:#808080;">Published On</td>
<td><strong>${new Date().toLocaleDateString()}</strong></td>
</tr>
</table>
</div>

<div style="text-align:center;margin:45px 0;">
<a href="${postUrl || '#'}"
style="background:#4CAF50;color:#ffffff;padding:18px 42px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:16px;display:inline-block;box-shadow:0 6px 15px rgba(76,175,80,0.3);">
👉 View Your Live Post
</a>
</div>

<p>
With Limbu.ai automation, your online presence stays active, consistent, and growth-focused — even when you're busy running your business.
</p>

<p style="margin-top:20px;">
Want to schedule more posts, update content, or optimize performance?
We're ready when you are.
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="background:#1f2937;padding:35px 25px;">

<div style="margin-bottom:15px;">
<img src="https://limbuai.s3.ap-south-1.amazonaws.com/replicate-prediction-32j5gxbj8hrm80ct7t9vrb4pt4.jpg.jpeg"
     width="120"
     alt="Limbu AI Logo"
     style="display:block;margin:auto;" />
</div>

<p style="color:#9ca3af;font-size:12px;margin:6px 0;">
© ${new Date().getFullYear()} Limbu.ai. All Rights Reserved.
</p>

<p style="color:#9ca3af;font-size:12px;margin:6px 0;">
AI-Powered Business Growth Platform
</p>

</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`;

    const payload = {
      sender: { name: "LimbuAI", email: "info@limbu.ai" },
      to: [{ email: userEmail, name: userFullName }],
      subject: emailSubject,
      htmlContent: emailContent,
    };

    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Brevo API Error (Post Published Email):", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { success: false, message: "Failed to send email", error: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: "Email sent successfully", data });
  } catch (error) {
    console.error("Post Published Email API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
