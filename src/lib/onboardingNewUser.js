import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { computeWebinarAssignment } from "@/lib/webinarScheduleIST";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

const DEMO_MEDIA = {
  url:
    process.env.ONBOARDING_WEBINAR_MEDIA_URL ||
    "https://limbuai.s3.ap-south-1.amazonaws.com/2WhatsApp+Image+2026-02-04+at+12.14.20+PM.jpeg",
  filename: "session_image",
};

const ZOOM = {
  registrationUrl:
    process.env.ONBOARDING_ZOOM_REGISTRATION_URL ||
    "https://us06web.zoom.us/webinar/register/WN_25C3HlkaSq2GBhwyxvW73w",
  meetingId: process.env.ONBOARDING_ZOOM_MEETING_ID || "864 3594 1427",
  passcode: process.env.ONBOARDING_ZOOM_PASSCODE || "800770",
};

function normalizeIndiaWhatsApp(num) {
  if (!num) return null;
  let n = String(num).replace(/\D/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10) n = "91" + n;
  return n.length === 12 ? n : null;
}

async function aisensySend({
  campaignName,
  destination,
  templateParams,
  media,
}) {
  const apiKey = process.env.AISENSY_API_KEY;
  if (!apiKey) {
    console.warn("onboardingNewUser: AISENSY_API_KEY missing, skip WhatsApp");
    return { skipped: true };
  }

  const res = await fetch(AISENSY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      campaignName,
      destination,
      userName: "LimbuAI",
      templateParams,
      source: "onboarding-automation",
      media: media || {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: { FirstName: "User" },
    }),
  });

  const data = await res.json().catch(() => ({}));
  const ok = res.ok && String(data?.success) === "true";
  return { ok, data };
}

async function sendBrevoOnboardingEmail({ toEmail, name, sessionLabel }) {
  const key = process.env.BREVO_API_KEY;
  if (!key || !toEmail) return { skipped: true, sent: false };

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear ${name || "User"},</p>
      <p>Welcome to <strong>Limbu.ai</strong> — your bonus and onboarding details are on the way on WhatsApp (if your mobile was shared).</p>
      <p><strong>Upcoming live webinar:</strong> ${sessionLabel}</p>
      <p>We’ll send you a reminder 15 minutes before the session.</p>
      <p style="margin-top:16px"><a href="https://limbu.ai/dashboard">Open your dashboard</a></p>
      <p>Regards,<br/>Team Limbu.ai</p>
    </div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "LimbuAI", email: "info@limbu.ai" },
      to: [{ email: toEmail, name: name || "User" }],
      subject: "Welcome to Limbu.ai — webinar & bonus",
      htmlContent: html,
    }),
  });
  return { sent: res.ok };
}

/**
 * Fire after User is created with source `signup` or a Meta lead source.
 * Idempotent: skips if onboarding web session already stored.
 */
export async function runNewUserOnboarding(userId) {
  await dbConnect();

  const user = await User.findOne({ userId });
  if (!user) return { ok: false, reason: "user_not_found" };

  const source = user.source || "signup";
  if (
    source !== "signup" &&
    source !== "Meta Lead" &&
    source !== "Real estate leads" &&
    source !== "bulk-upload"
  ) {
    return { ok: false, reason: "source_skipped" };
  }

  const destEarly = normalizeIndiaWhatsApp(user.phone);
  const emailDone = !user.email || user.onboardingWelcomeEmailSent;
  const whatsappComplete =
    !destEarly ||
    (user.onboardingWelcomeWhatsAppSent &&
      user.onboardingWebinarInviteWhatsAppSent);
  if (whatsappComplete && emailDone) {
    return { ok: false, reason: "already_sent" };
  }

  let sessionUtc;
  let reminderUtc;
  let sessionLabel;

  if (!user.onboardingWebinarSessionAt) {
    let assignment;
    try {
      assignment = computeWebinarAssignment(user.createdAt || new Date());
    } catch (e) {
      console.error("computeWebinarAssignment", e);
      return { ok: false, reason: "schedule_error" };
    }
    sessionUtc = assignment.sessionUtc;
    reminderUtc = assignment.reminderUtc;
    sessionLabel = assignment.sessionLabel;

    user.onboardingWebinarSessionAt = sessionUtc;
    user.onboardingWebinarReminderAt = reminderUtc;
    user.onboardingWebinarSessionLabel = sessionLabel;
    await user.save();
  } else {
    sessionUtc = user.onboardingWebinarSessionAt;
    reminderUtc = user.onboardingWebinarReminderAt;
    sessionLabel = user.onboardingWebinarSessionLabel || "";
  }

  const firstName =
    user.fullName?.trim()?.split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "User";

  const dest = normalizeIndiaWhatsApp(user.phone);

  /* 1) welcome_onboard_new — same automation as manager-assignment */
  if (dest && !user.onboardingWelcomeWhatsAppSent) {
    const r1 = await aisensySend({
      campaignName: "welcome_onboard_new",
      destination: dest,
      templateParams: [
        firstName,
        user.subscription?.plan || "Free",
        user.packageStartDate
          ? new Date(user.packageStartDate).toLocaleDateString("en-IN")
          : "",
        user.packageExpiryDate
          ? new Date(user.packageExpiryDate).toLocaleDateString("en-IN")
          : "",
        "https://limbu.ai/dashboard",
      ],
    });
    if (r1.ok) {
      user.onboardingWelcomeWhatsAppSent = true;
    }
  }

  /* 2) demo session / webinar — same template family as Tata Dialer bulk WhatsApp */
  if (dest && !user.onboardingWebinarInviteWhatsAppSent) {
    const r2 = await aisensySend({
      campaignName: "demo_session_confirmation1",
      destination: dest,
      templateParams: [
        sessionLabel,
        ZOOM.registrationUrl,
        ZOOM.meetingId,
        ZOOM.passcode,
      ],
      media: DEMO_MEDIA,
    });
    if (r2.ok) {
      user.onboardingWebinarInviteWhatsAppSent = true;
    }
  }

  if (user.email && !user.onboardingWelcomeEmailSent) {
    try {
      const em = await sendBrevoOnboardingEmail({
        toEmail: user.email,
        name: user.fullName,
        sessionLabel,
      });
      if (em.sent) {
        user.onboardingWelcomeEmailSent = true;
      }
    } catch (e) {
      console.error("onboarding email", e);
    }
  }

  await user.save();

  return {
    ok: true,
    sessionLabel,
    sessionUtc: sessionUtc.toISOString(),
  };
}

/** Cron: send same demo_session_confirmation1 ~15 min before session. */
export async function sendWebinarReminderForUser(user) {
  const dest = normalizeIndiaWhatsApp(user.phone);
  if (!dest) return { ok: false, reason: "no_phone" };

  const label =
    user.onboardingWebinarSessionLabel ||
    (user.onboardingWebinarSessionAt
      ? new Date(user.onboardingWebinarSessionAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      : "");

  const r = await aisensySend({
    campaignName: "demo_session_confirmation1",
    destination: dest,
    templateParams: [
      label,
      ZOOM.registrationUrl,
      ZOOM.meetingId,
      ZOOM.passcode,
    ],
    media: DEMO_MEDIA,
  });

  return { ok: !!r.ok, data: r.data };
}
