/**
 * Email templates used by the user-management bulk email sender.
 *
 * Shared by the admin modal (preview) and the send API route (actual html),
 * so the client never posts raw html for a built-in template — it only posts
 * a templateId and the server resolves the markup from here.
 *
 * `{{name|there}}` is a merge tag supported by mail.limbutech.in.
 */

export const APP_URL = "https://limbu.ai";

/** Shared branded email shell — also used by the franchise templates. */
export const wrapper = ({
  accent,
  badge,
  heading,
  intro,
  bullets = [],
  ctaLabel,
  ctaUrl = APP_URL,
  outro = "",
}) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:${accent};padding:28px 32px;">
                <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Limbu AI</p>
                <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:1.2px;">${badge}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:15px;color:#475569;">Hi {{name|there}},</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a;">${heading}</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">${intro}</p>
                ${
                  bullets.length
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  ${bullets
                    .map(
                      (b) => `<tr>
                    <td style="padding:8px 0;font-size:15px;line-height:1.6;color:#334155;border-bottom:1px solid #f1f5f9;">${b}</td>
                  </tr>`,
                    )
                    .join("")}
                </table>`
                    : ""
                }
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:${accent};border-radius:10px;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
                ${
                  outro
                    ? `<p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">${outro}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:22px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Team Limbu AI &middot; Google Business Profile growth on autopilot</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  You are receiving this because you signed up on <a href="${APP_URL}" style="color:#64748b;">limbu.ai</a>.
                  Reply with "STOP" to opt out of these emails.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const EMAIL_TEMPLATE_GROUPS = [
  {
    id: "subscription",
    title: "Subscription & Plans",
    subtitle: "Renewals, upgrades and expiry reminders",
    icon: "creditCard",
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "new_features",
    title: "New Features",
    subtitle: "Announce what just launched on Limbu AI",
    icon: "sparkles",
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "onboarding",
    title: "Welcome & Onboarding",
    subtitle: "Greet new signups and get them started",
    icon: "handshake",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "growth_tools",
    title: "Growth Tools",
    subtitle: "GMB Health, Magic QR, Website, Insights",
    icon: "trending",
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    id: "offers",
    title: "Offers & Campaigns",
    subtitle: "Festive offers, demo invites and re-engagement",
    icon: "gift",
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: "custom",
    title: "Custom Email",
    subtitle: "Write your own subject and message",
    icon: "pencil",
    border: "border-rose-200",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
];

export const EMAIL_TEMPLATES = [
  /* ------------------------------ subscription ----------------------------- */
  {
    id: "subscription_activated",
    groupId: "subscription",
    title: "Subscription Activated",
    subtitle: "Confirm a newly activated Limbu AI plan",
    campaignName: "Subscription Activated",
    subject: "Your Limbu AI subscription is active 🎉",
    html: wrapper({
      accent: "#2563eb",
      badge: "Subscription",
      heading: "Your subscription is now active",
      intro:
        "Your Limbu AI plan is live. Everything below is unlocked on your account right away — no extra setup needed.",
      bullets: [
        "✅ Unlimited GMB Health Checks",
        "✅ Magic Review QR for walk-in customers",
        "✅ Free business website with your GMB data",
        "✅ Automated review replies and posts",
      ],
      ctaLabel: "Open my dashboard",
      ctaUrl: `${APP_URL}/dashboard`,
      outro:
        "Need help getting started? Just reply to this email and our team will walk you through it.",
    }),
  },
  {
    id: "subscription_expiring",
    groupId: "subscription",
    title: "Subscription Expiring Soon",
    subtitle: "Nudge users before their plan lapses",
    campaignName: "Subscription Expiring",
    subject: "Your Limbu AI plan expires soon — renew to stay visible",
    html: wrapper({
      accent: "#dc2626",
      badge: "Renewal reminder",
      heading: "Your plan is about to expire",
      intro:
        "Your Limbu AI subscription is ending shortly. Once it lapses, automated posts, review replies and your GMB insights will pause.",
      bullets: [
        "⚠️ Auto review replies stop",
        "⚠️ Weekly GMB Health reports stop",
        "⚠️ Magic QR review collection pauses",
      ],
      ctaLabel: "Renew my plan",
      ctaUrl: `${APP_URL}/pricing`,
      outro:
        "Renew in under a minute and keep your Google Business Profile working around the clock.",
    }),
  },
  {
    id: "subscription_upgrade",
    groupId: "subscription",
    title: "Upgrade Your Plan",
    subtitle: "Push free users towards a paid plan",
    campaignName: "Plan Upgrade",
    subject: "Unlock more customers with a Limbu AI upgrade",
    html: wrapper({
      accent: "#7c3aed",
      badge: "Upgrade",
      heading: "Ready for more reach?",
      intro:
        "You are already using Limbu AI's free tools. Upgrading unlocks the automation that keeps your profile ranking every single day.",
      bullets: [
        "🚀 Daily automated GMB posts",
        "🚀 AI review replies in your brand voice",
        "🚀 Keyword insights and rank tracking",
        "🚀 Priority support from a dedicated manager",
      ],
      ctaLabel: "See plans",
      ctaUrl: `${APP_URL}/pricing`,
    }),
  },

  /* ------------------------------ new features ----------------------------- */
  {
    id: "feature_launch",
    groupId: "new_features",
    title: "New Feature Launch",
    subtitle: "Announce a brand new Limbu AI feature",
    campaignName: "New Feature Launch",
    subject: "New on Limbu AI: features built to get you more customers",
    html: wrapper({
      accent: "#7c3aed",
      badge: "Just launched",
      heading: "Something new just landed on Limbu AI",
      intro:
        "We have shipped a fresh set of tools to help your business get discovered faster on Google. All of them are live in your dashboard right now.",
      bullets: [
        "✨ <b>AI Business Report</b> — a full profile audit in one click",
        "✨ <b>Magic Review QR</b> — turn walk-ins into 5-star reviews",
        "✨ <b>Auto Review Reply</b> — every review answered within minutes",
        "✨ <b>Free Business Website</b> — built from your GMB data",
      ],
      ctaLabel: "Try the new features",
      ctaUrl: `${APP_URL}/dashboard`,
      outro: "Tell us what you think — we read every reply.",
    }),
  },
  {
    id: "feature_ai_website",
    groupId: "new_features",
    title: "AI Website Builder Launch",
    subtitle: "Announce the free AI website builder",
    campaignName: "AI Website Launch",
    subject: "Your business website — built by AI, free",
    html: wrapper({
      accent: "#0891b2",
      badge: "New feature",
      heading: "Get a business website without lifting a finger",
      intro:
        "Our new AI Website Builder reads your Google Business Profile and builds a complete, mobile-ready website for your business in seconds.",
      bullets: [
        "🌐 Services, photos and timings pulled from your GMB",
        "🌐 Google-friendly pages that help you rank locally",
        "🌐 Free to generate, live in under a minute",
      ],
      ctaLabel: "Build my website",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },
  {
    id: "feature_review_automation",
    groupId: "new_features",
    title: "Review Automation Launch",
    subtitle: "Announce AI review reply automation",
    campaignName: "Review Automation Launch",
    subject: "Never miss a Google review again",
    html: wrapper({
      accent: "#e11d48",
      badge: "New feature",
      heading: "AI now replies to your Google reviews",
      intro:
        "Reviews left unanswered cost you customers. Limbu AI now writes and posts replies for you, in your tone, within minutes of a review landing.",
      bullets: [
        "💬 Instant replies to new reviews, 24×7",
        "💬 Negative reviews flagged to you before posting",
        "💬 Higher engagement means better local ranking",
      ],
      ctaLabel: "Turn on review automation",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },

  /* ------------------------------- onboarding ------------------------------ */
  {
    id: "welcome_signup",
    groupId: "onboarding",
    title: "Welcome to Limbu AI",
    subtitle: "First email after signup",
    campaignName: "Welcome Email",
    subject: "Welcome to Limbu AI 👋 here is how to start",
    html: wrapper({
      accent: "#059669",
      badge: "Welcome",
      heading: "Welcome to Limbu AI",
      intro:
        "Thanks for signing up. Connect your Google Business Profile and we will start improving your local visibility from day one.",
      bullets: [
        "1️⃣ Connect your Google Business Profile",
        "2️⃣ Run a free GMB Health Check",
        "3️⃣ Generate your Magic Review QR",
        "4️⃣ Publish your free business website",
      ],
      ctaLabel: "Connect my GMB",
      ctaUrl: `${APP_URL}/dashboard`,
      outro: "Your dedicated support manager is one reply away.",
    }),
  },
  {
    id: "connect_gmb_reminder",
    groupId: "onboarding",
    title: "Connect GMB Reminder",
    subtitle: "For signups who never connected their profile",
    campaignName: "Connect GMB Reminder",
    subject: "You are one step away from your free GMB report",
    html: wrapper({
      accent: "#0d9488",
      badge: "Action needed",
      heading: "Your account is waiting on one step",
      intro:
        "You signed up but have not connected your Google Business Profile yet. It takes about 30 seconds, and unlocks your free health report instantly.",
      bullets: [
        "🔍 See exactly what is holding your ranking back",
        "🔍 Compare your profile against local competitors",
        "🔍 Get a fix-list you can action the same day",
      ],
      ctaLabel: "Connect now",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },

  /* ------------------------------ growth tools ----------------------------- */
  {
    id: "gmb_health_report",
    groupId: "growth_tools",
    title: "GMB Health Report Ready",
    subtitle: "Send when a health report is generated",
    campaignName: "GMB Health Report",
    subject: "Your GMB Health Report is ready",
    html: wrapper({
      accent: "#2563eb",
      badge: "Health report",
      heading: "Your GMB Health Report is ready",
      intro:
        "We analysed your Google Business Profile across visibility, engagement, reviews and completeness. Your full report is waiting in the dashboard.",
      bullets: [
        "📊 Profile completeness score",
        "📊 Review and rating trends",
        "📊 Search visibility and customer actions",
        "📊 A prioritised list of fixes",
      ],
      ctaLabel: "View my report",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },
  {
    id: "magic_qr_ready",
    groupId: "growth_tools",
    title: "Magic Review QR Ready",
    subtitle: "Send when the Magic QR is created",
    campaignName: "Magic QR Ready",
    subject: "Your Magic Review QR is ready to print",
    html: wrapper({
      accent: "#059669",
      badge: "Magic QR",
      heading: "Collect 5-star reviews on the spot",
      intro:
        "Your Smart Magic Review QR has been created. Put it on your counter, bill or packaging — customers scan it and land straight on your Google review page.",
      bullets: [
        "⭐ Happy customers routed to Google instantly",
        "⭐ Feedback captured privately before it goes public",
        "⭐ More reviews means better local ranking",
      ],
      ctaLabel: "Download my QR",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },
  {
    id: "gmb_insights_monthly",
    groupId: "growth_tools",
    title: "Monthly GMB Insights",
    subtitle: "Monthly performance summary",
    campaignName: "Monthly GMB Insights",
    subject: "Your monthly Google Business performance",
    html: wrapper({
      accent: "#4f46e5",
      badge: "Monthly insights",
      heading: "Here is how your business performed",
      intro:
        "Your latest Google Business Profile insights are in — searches, calls, direction requests and how customers are finding you.",
      bullets: [
        "📈 Total searches and profile views",
        "📈 Calls, website clicks and direction requests",
        "📈 Keywords customers used to find you",
      ],
      ctaLabel: "See full insights",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },

  /* --------------------------------- offers -------------------------------- */
  {
    id: "festive_offer",
    groupId: "offers",
    title: "Festive Offer",
    subtitle: "Limited-time discount campaign",
    campaignName: "Festive Offer",
    subject: "Limited time: save big on your Limbu AI plan",
    html: wrapper({
      accent: "#ea580c",
      badge: "Limited time",
      heading: "A festive offer on your growth plan",
      intro:
        "For a limited period, get our full Google Business growth suite at a special price. Same automation, lower cost.",
      bullets: [
        "🎁 Discounted annual plans",
        "🎁 Free onboarding with a dedicated manager",
        "🎁 All premium automations included",
      ],
      ctaLabel: "Claim the offer",
      ctaUrl: `${APP_URL}/pricing`,
      outro: "Offer valid while the campaign is live.",
    }),
  },
  {
    id: "demo_invite",
    groupId: "offers",
    title: "Free Demo Invite",
    subtitle: "Invite leads to a live demo session",
    campaignName: "Demo Invite",
    subject: "Free live demo: get more customers from Google",
    html: wrapper({
      accent: "#0284c7",
      badge: "Live session",
      heading: "Join our free live demo",
      intro:
        "Our team runs a short live session showing exactly how businesses use Limbu AI to rank higher on Google Maps and win more local customers.",
      bullets: [
        "🎥 Live walkthrough of the full platform",
        "🎥 Real ranking case studies",
        "🎥 Open Q&A with our GMB experts",
      ],
      ctaLabel: "Reserve my seat",
      ctaUrl: `${APP_URL}/contact`,
    }),
  },
  {
    id: "reengagement",
    groupId: "offers",
    title: "We Miss You",
    subtitle: "Win back inactive users",
    campaignName: "Re-engagement",
    subject: "Your Google profile misses you",
    html: wrapper({
      accent: "#7c3aed",
      badge: "Come back",
      heading: "It has been a while",
      intro:
        "Your Google Business Profile keeps working only when it stays active. Log back in and pick up right where you left off — plus everything new we shipped since.",
      bullets: [
        "🔄 Fresh GMB Health Check",
        "🔄 New AI website builder",
        "🔄 Automated review replies",
      ],
      ctaLabel: "Take me back",
      ctaUrl: `${APP_URL}/dashboard`,
    }),
  },
];

export const CUSTOM_EMAIL_TEMPLATE_ID = "custom_email";

/** Wrap a plain-text custom message in the standard Limbu AI shell. */
export const buildCustomEmailHtml = (message) =>
  wrapper({
    accent: "#e11d48",
    badge: "Limbu AI",
    heading: "A message from Limbu AI",
    intro: String(message || "")
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, "<br/>"))
      .join('</p><p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">'),
    ctaLabel: "Open Limbu AI",
    ctaUrl: `${APP_URL}/dashboard`,
  });

export const getEmailTemplatesForGroup = (groupId) =>
  EMAIL_TEMPLATES.filter((t) => t.groupId === groupId);

export const getEmailTemplateById = (id) =>
  EMAIL_TEMPLATES.find((t) => t.id === id) || null;
