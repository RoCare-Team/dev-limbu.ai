// Social media plans sold from the home page Social Media section, billed yearly.
// Same plans as the pricing page: yearly = 20% off the monthly rate, reels × 12.

const SOCIAL_BASE_FEATURES = [
  "Reel Scripting & Editing",
  "Captions & Hashtags",
  "Post Insights / Analytics",
  "Comments Management",
  "DM Automation",
];

export const SOCIAL_TIERS = [
  {
    key: "social-starter",
    title: "Social Starter",
    tagline: "For brands starting out on Instagram & Facebook",
    perMonth: 2400,
    listPerMonth: 3000,
    features: ["48 Reels", ...SOCIAL_BASE_FEATURES],
    addon: "Unlock all social media tools",
  },
  {
    key: "social-growth",
    title: "Social Growth",
    tagline: "For brands posting consistently every week",
    perMonth: 4800,
    listPerMonth: 6000,
    popular: true,
    features: ["108 Reels", ...SOCIAL_BASE_FEATURES],
    addon: "Unlock all social media tools",
  },
  {
    key: "social-pro",
    title: "Social Pro",
    tagline: "For brands that need daily short-form content",
    perMonth: 9600,
    listPerMonth: 12000,
    features: ["240 Reels", ...SOCIAL_BASE_FEATURES],
    addon: "Unlock all social media tools",
  },
];

// Played from the Social Media section; replace with a social-specific video when ready.
export const SOCIAL_DEMO_VIDEO_ID = "eQUd6u36w3g";
