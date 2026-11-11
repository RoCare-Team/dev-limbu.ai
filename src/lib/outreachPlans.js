// Outreach plans sold from the home page "Reach & Engage" section, billed yearly.
// WhatsApp plan matches the pricing page (₹15,000 a year).

export const OUTREACH_TIERS = [
  {
    key: "emailer",
    title: "Emailer Plan",
    tagline: "Email campaigns that bring customers back",
    perMonth: 500,
    listPerMonth: null,
    features: [
      "Email campaigns",
      "AI-written emails",
      "Customer list upload",
      "Open & click reports",
      "Scheduled sending",
    ],
    addon: "Unlock all outreach tools",
  },
  {
    key: "whatsapp",
    title: "WhatsApp Automation Plan",
    tagline: "Complete WhatsApp automation for your business",
    perMonth: 1250,
    listPerMonth: null,
    popular: true,
    features: [
      "Unlimited AI Agents",
      "No Setup Cost",
      "No Markup on Utility / Marketing Messages",
      "Flow Builder",
      "Lead Scrapper (500 leads / month)",
      "Webhooks / API",
    ],
    addon: "Unlock all outreach tools",
  },
];

// Tiles that open the plans modal (and the tool once unlocked); the rest are "Soon".
export const OUTREACH_LIVE_TOOLS = ["emailer", "whatsapp_automation"];

// Played from the outreach modal; replace with an outreach-specific video when ready.
export const OUTREACH_DEMO_VIDEO_ID = "eQUd6u36w3g";
