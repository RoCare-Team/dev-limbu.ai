// Headline (dark title + yellow highlight) and "how it works" steps per section.
// The API only has title/subtitle, so this is the marketing copy for the website.
export const SECTION_COPY = {
  gbp: {
    title: "Grow Your Local Business",
    highlight: "with Limbu AI",
    text: "Rank higher on Google Maps and turn searches into calls, visits and 5-star reviews. 9 AI tools, one simple monthly plan.",
    steps: [
      "Connect your Google Business Profile in one click",
      "AI posts weekly updates and replies to every review",
      "Watch your calls, views and direction requests grow",
    ],
  },
  social_media: {
    title: "Grow Your Social Media",
    highlight: "with Limbu AI",
    text: "Post, reply and grow your audience on autopilot.",
    steps: [
      "Link Facebook, Instagram and more",
      "AI creates the post image and caption",
      "Comments and DMs get instant AI replies",
    ],
    // Plays from the section's "Watch" button and the phone screen.
    // Built-in animated demo (art/SocialDemo.jsx): plays in the phone and in a modal.
    video: {
      demo: "social",
      title: "How to grow your social presence",
      duration: "20-sec demo",
    },
  },
  ai_tools: {
    title: "Create Reels & Videos",
    highlight: "with Limbu AI",
    text: "Type your offer, pick a style and length, and pay only for what you create.",
    steps: [
      "Type your offer or upload a photo",
      "Choose video type and length (10 to 60 sec)",
      "Download or post the ready reel",
    ],
  },
  outreach: {
    title: "Reach & Engage Customers",
    highlight: "with Limbu AI",
    text: "WhatsApp, SMS, RCS, voice call and email campaigns that bring customers back.",
    steps: [
      "Upload or sync your customer list",
      "Pick a message or let AI write one",
      "Send on WhatsApp, SMS, RCS or email automatically",
    ],
  },
  website_seo: {
    title: "Rank Higher on Google",
    highlight: "with Limbu AI",
    text: "On-page, technical and local SEO handled for you.",
    steps: [
      "We audit your website and keywords",
      "Fix speed, content and backlinks",
      "Watch your Google ranking climb",
    ],
  },
  website_development: {
    title: "Get a Website That Sells",
    highlight: "with Limbu AI",
    text: "Fast, mobile-friendly websites built for local businesses, from ₹9,999.",
    steps: [
      "Pick a plan and share your business details",
      "We design and build your website",
      "Go live with SEO, analytics and support",
    ],
  },
  custom_crm: {
    title: "Manage Every Lead",
    highlight: "with a Custom CRM",
    text: "A CRM built around your business: every lead, follow-up and sale in one place.",
    steps: [
      "Tell us how your sales process works",
      "We build your CRM with your leads, team and workflows",
      "Track every lead and follow-up from one dashboard",
    ],
    cta: { label: "Get a Free CRM Quote", whatsapp: "Hi Limbu AI, I want a custom CRM for my business." },
  },
  mobile_app: {
    title: "Launch Your Own",
    highlight: "Mobile App",
    text: "Android and iPhone apps for your business, built, published and supported by our team.",
    steps: [
      "Share your idea and features",
      "We design and build the app with an admin panel",
      "Go live on the Play Store and App Store",
    ],
    cta: { label: "Get a Free App Quote", whatsapp: "Hi Limbu AI, I want a mobile app for my business." },
  },
  paid_ads: {
    title: "Get More Leads from Ads",
    highlight: "with Limbu AI",
    text: "Google, YouTube, Meta and LinkedIn campaigns managed by experts.",
    steps: [
      "Choose a platform and budget",
      "Experts build and target your ads",
      "Get calls and leads, with clear reports",
    ],
  },
};

/** Copy for a section key; falls back to the API title/subtitle for new sections. */
const baseCopy = (section) =>
  SECTION_COPY[section.key] || {
    title: section.title,
    highlight: "with Limbu AI",
    text: section.subtitle,
    steps: [],
  };

/**
 * Copy for a section; falls back to the API title/subtitle for new sections.
 * With `city` (city landing pages) the headline names the city, and the top
 * (GBP) section speaks to businesses there.
 */
export function copyFor(section, city = null) {
  const copy = baseCopy(section);
  if (!city) return copy;
  if (section.key === "gbp") {
    return {
      ...copy,
      title: `Grow Your Business in ${city}`,
      text: `Rank higher on Google Maps in ${city} and turn local searches into calls, visits and 5-star reviews. 9 AI tools, one simple plan.`,
    };
  }
  return { ...copy, title: `${copy.title} in ${city}` };
}
