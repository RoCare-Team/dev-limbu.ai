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
      switch (remark) {
        case "call_not_picked":
          emailSubject = "We tried calling you - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>We tried calling you regarding your enquiry (${otherParams.enquiryId || 'N/A'}) but couldn't connect.</p>
              <p>Our executive <strong>${otherParams.executiveName || 'Team'}</strong> will try to reach you again shortly.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "not_interested":
          emailSubject = "Update on your enquiry - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>We have noted that you are not interested at the moment regarding enquiry ${otherParams.enquiryId || 'N/A'}.</p>
              <p>If you change your mind, feel free to contact us.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "interested":
          emailSubject = "Thank you for your interest - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>Thank you for your interest! We are excited to help you.</p>
              <p>Our executive <strong>${otherParams.executiveName || 'Team'}</strong> will be in touch with you shortly to take this forward.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "call_back":
          emailSubject = "We will call you back - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>As requested, we have scheduled a call back for your enquiry ${otherParams.enquiryId || 'N/A'}.</p>
              <p>Our executive will contact you soon.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "wrong_number":
          emailSubject = "Wrong Number Update - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear User,</p>
              <p>We have marked this number as a wrong number for enquiry ${otherParams.enquiryId || 'N/A'}.</p>
              <p>If this is a mistake, please reply to this email.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "switch_off":
          emailSubject = "Unable to reach you - LimbuAI";
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>We tried calling you but your phone was switched off/not reachable.</p>
              <p>We will attempt to contact you again later.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>`;
          break;
        case "meeting_scheduled_online":
          emailSubject = "Meeting Scheduled Successfully - LimbuAI";
          const [date, time] = (otherParams.meetingDate || "").split("T");
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Hi ${recipientName},</p>
              <p>Your meeting has been scheduled successfully.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${date} ${time || ""}</p>
                <p style="margin: 5px 0;"><strong>🔗 Meeting Link:</strong> <a href="${otherParams.meetingLink}">${otherParams.meetingLink}</a></p>
                <p style="margin: 5px 0;"><strong>🆔 Meeting ID:</strong> ${otherParams.meetingId || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>🔑 Passcode:</strong> ${otherParams.passcode || "N/A"}</p>
              </div>
              <p>If you have any questions, please contact us.</p>
              <p>See you soon.</p>
              <p>Regards,<br>LimbuAI Team</p>
            </div>
          `;
          break;
        default:
          emailContent = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p>Dear ${recipientName},</p>
              <p>There is an update on your enquiry (${otherParams.enquiryId || 'N/A'}):</p>
              <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 10px 0; color: #555;">
                ${rawRemark || rawRemarks || "No specific details provided."}
              </blockquote>
              <p>Regards,<br>LimbuAI Team</p>
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