import { NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, name, userName, subject: customSubject, htmlContent: customHtml, remark: rawRemark, remarks: rawRemarks, sender, ...otherParams } = body;

    // Handle both 'remark' and 'remarks'
    const remark = typeof rawRemark === 'string' ? rawRemark.toLowerCase().trim() : (typeof rawRemarks === 'string' ? rawRemarks.toLowerCase().trim() : "");

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Missing required field: email" },
        { status: 400 }
      );
    }

    const recipientName = name || userName || "User";
    let emailSubject = customSubject || "Update regarding your enquiry - LimbuAI";
    let emailContent = customHtml;

    // If no custom HTML is provided, generate based on remark
    if (!emailContent) {
      const execMobile = otherParams.executiveMobile || "";
      const execName = otherParams.executiveName || "Team";
      const enquiryId = otherParams.enquiryId || "N/A";

      const commonFooter = `
        <br>
        <p>Regards,<br><strong>Limbu.ai Team</strong></p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <a href="https://limbu.ai" style="color: #007bff; text-decoration: none; font-weight: bold;">🌐 Visit Limbu.ai</a> 
            &nbsp;|&nbsp; 
            <a href="https://www.youtube.com/watch?v=eQUd6u36w3g" style="color: #d93025; text-decoration: none; font-weight: bold;">📺 Watch Demo</a>
          </p>
        </div>
      `;

      switch (remark) {
        case "call_not_picked":
          emailSubject = "We tried calling you - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>We tried calling you regarding your enquiry (ID: <strong>${enquiryId}</strong>) but couldn't connect.</p>
              <p>Our executive <strong>${execName}</strong> will try to reach you again shortly.</p>
              ${execMobile ? `<p>You can contact our executive at: <strong>${execMobile}</strong></p>` : ""}
              ${commonFooter}
            </div>`;
          break;
        case "not_interested":
          emailSubject = "Update on your enquiry - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>We have noted that you are not interested at the moment regarding enquiry (ID: <strong>${enquiryId}</strong>).</p>
              <p>If you change your mind, feel free to contact us.</p>
              ${commonFooter}
            </div>`;
          break;
        case "interested":
          emailSubject = "Thank you for your interest - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>Thank you for your interest! We are excited to help you.</p>
              <p>Our executive <strong>${execName}</strong> will be in touch with you shortly to take this forward.</p>
              ${execMobile ? `<p>Contact Executive: <strong>${execMobile}</strong></p>` : ""}
              ${commonFooter}
            </div>`;
          break;
        case "call_back":
          emailSubject = "We will call you back - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>As requested, we have scheduled a call back for your enquiry (ID: <strong>${enquiryId}</strong>).</p>
              <p>Our executive will contact you soon.</p>
              ${execMobile ? `<p>Executive Contact: <strong>${execMobile}</strong></p>` : ""}
              ${commonFooter}
            </div>`;
          break;
        case "wrong_number":
          emailSubject = "Wrong Number Update - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear User,</p>
              <p>We have marked this number as a wrong number for enquiry (ID: <strong>${enquiryId}</strong>).</p>
              <p>If this is a mistake, please reply to this email.</p>
              ${commonFooter}
            </div>`;
          break;
        case "switch_off":
          emailSubject = "Unable to reach you - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>We tried calling you but your phone was switched off/not reachable.</p>
              <p>We will attempt to contact you again later.</p>
              ${execMobile ? `<p>You can call us back at: <strong>${execMobile}</strong></p>` : ""}
              ${commonFooter}
            </div>`;
          break;
        case "meeting_scheduled_online":
          emailSubject = "Meeting Scheduled Successfully - LimbuAI";
          const [date, time] = (otherParams.meetingDate || "").split("T");
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Hi ${recipientName},</p>
              <p>Your meeting has been scheduled successfully.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date} ${time || ""}</p>
                <p style="margin: 5px 0;"><strong>🔗 Meeting Link:</strong> <a href="${otherParams.meetingLink}">${otherParams.meetingLink}</a></p>
                <p style="margin: 5px 0;"><strong>🆔 Meeting ID:</strong> ${otherParams.meetingId || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>🔑 Passcode:</strong> ${otherParams.passcode || "N/A"}</p>
              </div>
              <p>If you have any questions, please contact us.</p>
              ${execMobile ? `<p>Executive Contact: <strong>${execMobile}</strong></p>` : ""}
              <p>See you soon.</p>
              ${commonFooter}
            </div>
          `;
          break;
        default:
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
              <p>Dear ${recipientName},</p>
              <p>There is an update on your enquiry (ID: <strong>${enquiryId}</strong>):</p>
              <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 10px 0; color: #555;">
                ${rawRemark || rawRemarks || "No specific details provided."}
              </blockquote>
              ${commonFooter}
            </div>`;
          break;
      }
    }

    const payload = {
      sender: sender || { name: "LimbuAI", email: "info@limbu.ai" },
      to: [{ email: email, name: recipientName }],
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
      console.error("❌ Brevo API Error (Send Remarks):", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { success: false, message: "Failed to send email", error: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: "Email sent successfully", data });
  } catch (error) {
    console.error("Email Send API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}