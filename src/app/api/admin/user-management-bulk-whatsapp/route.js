import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

/**
 * Batch endpoint — campaign ka naam URL me jaata hai aur ek hi request me
 * saare numbers `messages[]` array ke through bhejte hain.
 */
const aisensyBatchUrl = (campaignName) =>
  `https://whatsapp.limbu.ai/api/campaigns/${encodeURIComponent(
    campaignName,
  )}/send`;

/** Provider ek request me itne messages tak leta hai. */
const BATCH_LIMIT = 5000;

const normalizeNumber = (num) => {
  if (!num) return null;
  let n = num.toString().replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n.length === 12 ? n : null;
};

/** Same template campaign as Tata Dialer WhatsApp. */
const CAMPAIGN_CONFIG = {
  demo_session_confirmation1: {
    mediaUrl:
      "https://limbuai.s3.ap-south-1.amazonaws.com/2WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  },
};

const getSessionDateTime = () => {
  const now = new Date();

  // Find next working day
  const nextDate = new Date(now);

  // If today is Sunday move to Monday
  if (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  const day = nextDate.getDay();

  // Friday => 5:30 PM
  // Monday-Saturday => 4:00 PM
  let hours = 16;
  let minutes = 0;

  if (day === 5) {
    hours = 17;
    minutes = 30;
  }

  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { adminEmail, users, campaignName } = body;

    if (!adminEmail || typeof adminEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "Admin email required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({
      email: adminEmail.trim(),
    }).select("role email");

    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Users array is required" },
        { status: 400 },
      );
    }

    if (!campaignName || !CAMPAIGN_CONFIG[campaignName]) {
      return NextResponse.json(
        { success: false, message: "Invalid campaign name" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIMBU_AI_WHATSAPP_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "WhatsApp API key not configured" },
        { status: 500 },
      );
    }

    const results = [];
    const messages = [];

    for (const user of users) {
      const destination = normalizeNumber(user.customer_no_with_prefix);

      if (!destination) {
        results.push({
          number: user.customer_no_with_prefix,
          status: "Invalid number",
        });
        continue;
      }

      messages.push({
        destination,
        templateParams: [
          getSessionDateTime(),
          "https://us06web.zoom.us/webinar/register/WN_25C3HlkaSq2GBhwyxvW73w",
          "864 3594 1427",
          "800770",
        ],
        media: {
          url: CAMPAIGN_CONFIG[campaignName].mediaUrl,
          filename: "session_image",
        },
      });
    }

    if (!messages.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid phone numbers",
          totalUsers: users.length,
          sent: 0,
          failed: users.length,
          details: results,
        },
        { status: 400 },
      );
    }

    let sent = 0;
    let firstError = "";

    // BATCH_LIMIT se badi selection par chunk karke bhejte hain.
    for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
      const chunk = messages.slice(i, i + BATCH_LIMIT);

      try {
        const response = await fetch(aisensyBatchUrl(campaignName), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, messages: chunk }),
        });

        const json = await response.json().catch(() => ({}));
        const ok = response.ok && json?.success !== false;

        if (ok) {
          sent += chunk.length;
          chunk.forEach((m) =>
            results.push({ number: m.destination, status: "Sent" }),
          );
        } else {
          // Provider ka asli error surface karo. Sabse aam failure yahan
          // "template params ki ginti match nahi hui" hoti hai — sirf
          // "send failed" dikhane se admin ko fix karne ka clue nahi milta.
          const providerError =
            json?.message ||
            json?.error?.message ||
            json?.error ||
            (Array.isArray(json?.errors) && json.errors[0]?.message) ||
            `HTTP ${response.status}`;
          console.error("Bulk campaign failed:", campaignName, json);
          if (!firstError) firstError = String(providerError);
          chunk.forEach((m) =>
            results.push({
              number: m.destination,
              status: "Failed",
              response: providerError,
            }),
          );
        }
      } catch (error) {
        if (!firstError) firstError = error.message;
        chunk.forEach((m) =>
          results.push({
            number: m.destination,
            status: "Error",
            error: error.message,
          }),
        );
      }
    }

    return NextResponse.json({
      success: sent > 0,
      message: sent
        ? "Message processed"
        : firstError
          ? `${campaignName}: ${firstError}`
          : "Message processed",
      totalUsers: users.length,
      sent,
      failed: users.length - sent,
      details: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
