// Detail pages for the "Paid Ads" tiles on the home page (/ads/<slug>).
// Keyed by the home-section item key, so web.js can point each tile at its page.
// `plan` names the setup plan sold for that platform (AD_PLANS); null = enquiry only.

export const AD_PLANS = [
  {
    title: "Google Ads Account Setup",
    basePrice: 2500,
    description: "Complete Google Ads setup with keywords, tracking, and analytics.",
    staticFeatures: [
      "Account creation",
      "Billing config",
      "Keyword research",
      "Negative keywords",
      "GA4 setup",
      "Conversion tracking",
    ],
  },
  {
    title: "Meta Ads Account Setup",
    basePrice: 3500,
    popular: true,
    description: "Complete Meta (FB & IG) setup with audience research and pixel tracking.",
    staticFeatures: [
      "Business Manager setup",
      "Ad account config",
      "Audience research",
      "Pixel/CAPI setup",
      "Creative strategy",
      "Copywriting",
    ],
  },
  {
    title: "LinkedIn Ads Account Setup",
    basePrice: 4500,
    description: "Complete LinkedIn Campaign Manager setup with B2B audiences and lead gen forms.",
    staticFeatures: [
      "Campaign Manager setup",
      "Company page linking",
      "Job title & industry audience",
      "Lead gen form",
      "Insight tag tracking",
      "Ad copywriting",
    ],
  },
];

const GOOGLE_PLAN = "Google Ads Account Setup";
const META_PLAN = "Meta Ads Account Setup";
const LINKEDIN_PLAN = "LinkedIn Ads Account Setup";

export const AD_SERVICES = {
  google_ads: {
    slug: "google-ads",
    name: "Google Ads",
    plan: GOOGLE_PLAN,
    icon: { type: "brand", value: "google" },
    metaTitle: "Google Ads Management for Local Businesses | Limbu.ai",
    metaDescription:
      "Google Search and Maps ads set up by Limbu.ai experts: keyword research, negative keywords, call and conversion tracking so you pay for leads, not clicks.",
    tagline: "Show up at the top of Google when nearby customers search for what you sell.",
    intro:
      "Google Ads put your business above the free results on Search and Maps, right when someone is ready to call or visit. Our team builds the account, picks the keywords your customers use, blocks the wasted ones and sets up tracking so every rupee can be traced to a call or enquiry.",
    features: [
      { title: "Search & Maps ads", text: "Appear on top for searches like “dentist near me” and on Google Maps." },
      { title: "Keyword research", text: "Keywords with buying intent in your city, with realistic cost per click." },
      { title: "Negative keywords", text: "Stop paying for searches that never turn into customers." },
      { title: "Call & lead tracking", text: "Conversion tracking and GA4 so you see which ads bring calls." },
      { title: "Ad copy that converts", text: "Headlines and extensions written around your offer and location." },
      { title: "Clear reports", text: "Spend, clicks, calls and leads in a simple monthly report." },
    ],
    steps: [
      "Share your business, area and budget",
      "We set up the account, keywords and tracking",
      "Your ads go live and calls start coming in",
    ],
    deliverables: [
      "Google Ads account set up and verified",
      "Keyword and negative keyword list",
      "Search and call ads written",
      "GA4 and conversion tracking",
      "Launch call to walk you through it",
    ],
    whoFor: ["Clinics, salons, gyms and local services", "Businesses that want calls this week", "Anyone wasting money on unmanaged ads"],
    faqs: [
      { q: "How much should I spend on Google Ads?", a: "Most local businesses start with ₹300–₹1,000 per day. We suggest a budget after looking at the keywords and competition in your area." },
      { q: "Is the ad budget included in the setup price?", a: "No. The setup fee is for our work. Your ad spend is paid directly to Google from your own account." },
      { q: "How soon will I get leads?", a: "Ads usually go live within 2–3 working days of approval, and searches can start bringing calls the same day." },
      { q: "Can you run ads on Google Maps?", a: "Yes. With your Google Business Profile linked, your ads can show on Maps with directions and a call button." },
    ],
    cta: { whatsapp: "Hi Limbu AI, I want to run Google Ads for my business." },
  },

  youtube_ads: {
    slug: "youtube-ads",
    name: "YouTube Ads",
    plan: GOOGLE_PLAN,
    icon: { type: "brand", value: "youtube" },
    metaTitle: "YouTube Ads for Local Businesses | Video Ads | Limbu.ai",
    metaDescription:
      "YouTube video ads set up by Limbu.ai: audience targeting by city and interest, short video ads and tracking that turns views into calls and visits.",
    tagline: "Put your business in front of local viewers with short video ads.",
    intro:
      "YouTube Ads run through your Google Ads account and show your video to people in your city before or during the videos they watch. We target by location, interest and search history, and pair the ads with Limbu AI reels so you have a ready video from day one.",
    features: [
      { title: "City-level targeting", text: "Only people in your area see the ad, so the budget is not wasted." },
      { title: "Skippable & Shorts ads", text: "In-stream and YouTube Shorts placements for reach at low cost." },
      { title: "Ready video creative", text: "Turn your offer into a short ad video with Limbu AI reels." },
      { title: "Interest audiences", text: "Reach people who watch, search or shop in your category." },
      { title: "Website & call actions", text: "Buttons that send viewers to call, WhatsApp or your website." },
      { title: "View & lead reports", text: "Views, watch time and actions in one report." },
    ],
    steps: [
      "Share your offer and target area",
      "We set up the campaign and the video ad",
      "Local viewers see your ad and take action",
    ],
    deliverables: [
      "YouTube campaign in your Google Ads account",
      "Audience and location targeting",
      "Video ad placement setup",
      "Conversion tracking",
      "Launch call to walk you through it",
    ],
    whoFor: ["Restaurants, real estate and showrooms", "Brands launching a new offer", "Businesses with a visual product or service"],
    faqs: [
      { q: "Do I need a professional video?", a: "No. A 15–30 second reel made with Limbu AI or on your phone works well for local YouTube ads." },
      { q: "Is this the same setup as Google Ads?", a: "Yes. YouTube ads run inside Google Ads, so they use the Google Ads Account Setup plan." },
      { q: "How much does a YouTube view cost?", a: "Local views often cost well under a rupee each; the exact rate depends on your audience and city." },
    ],
    cta: { whatsapp: "Hi Limbu AI, I want to run YouTube ads for my business." },
  },

  facebook_ads: {
    slug: "facebook-ads",
    name: "Facebook Ads",
    plan: META_PLAN,
    icon: { type: "brand", value: "facebook" },
    metaTitle: "Facebook Ads for Local Businesses | Lead Ads | Limbu.ai",
    metaDescription:
      "Facebook ads set up by Limbu.ai: Business Manager, pixel tracking, local audiences and lead forms that bring enquiries straight to your phone.",
    tagline: "Reach the right people in your city and collect leads on Facebook.",
    intro:
      "Facebook Ads let you reach people by location, age and interests, even before they search for you. We set up Business Manager and the ad account, install pixel tracking, research your audience and build lead or message campaigns that send enquiries straight to you.",
    features: [
      { title: "Lead form ads", text: "Customers share their number without leaving Facebook." },
      { title: "Message ads", text: "Ads that open a WhatsApp or Messenger chat with you." },
      { title: "Local audiences", text: "Target by radius around your shop, age and interests." },
      { title: "Pixel & CAPI tracking", text: "Know which ads bring leads and sales on your website." },
      { title: "Creative strategy", text: "Images, reels and copy planned around your offer." },
      { title: "Retargeting", text: "Show ads again to people who visited or engaged." },
    ],
    steps: [
      "Share your offer, area and budget",
      "We set up Business Manager, pixel and audiences",
      "Leads and messages start coming in",
    ],
    deliverables: [
      "Business Manager and ad account set up",
      "Pixel / Conversions API installed",
      "Audience research for your city",
      "Ad copy and creative plan",
      "Launch call to walk you through it",
    ],
    whoFor: ["Coaching, real estate and clinics", "Shops running offers and events", "Businesses that want WhatsApp enquiries"],
    faqs: [
      { q: "Does the Meta setup cover Instagram too?", a: "Yes. Facebook and Instagram ads run from the same Meta ad account, so one setup covers both." },
      { q: "What budget do I need?", a: "Many local businesses start with ₹300–₹500 per day and scale up what works." },
      { q: "Is ad spend included?", a: "No. The setup fee is for our work; ad spend is paid directly to Meta from your account." },
    ],
    cta: { whatsapp: "Hi Limbu AI, I want to run Facebook ads for my business." },
  },

  instagram_ads: {
    slug: "instagram-ads",
    name: "Instagram Ads",
    plan: META_PLAN,
    icon: { type: "brand", value: "instagram" },
    metaTitle: "Instagram Ads for Local Businesses | Reels Ads | Limbu.ai",
    metaDescription:
      "Instagram reels and story ads set up by Limbu.ai: local audiences, pixel tracking and DM campaigns that turn followers into customers.",
    tagline: "Turn reels and stories into DMs, visits and sales.",
    intro:
      "Instagram Ads show your reels and stories to people nearby who match your customer. We set up the Meta ad account, connect your Instagram profile, build audiences and run campaigns that drive profile visits, DMs and website leads.",
    features: [
      { title: "Reels & story ads", text: "Full-screen video ads where people spend the most time." },
      { title: "DM campaigns", text: "Ads that start an Instagram chat with interested buyers." },
      { title: "Local targeting", text: "Reach people around your area by age and interests." },
      { title: "Boost your best posts", text: "Promote posts that already perform well, the right way." },
      { title: "Pixel tracking", text: "See which ads bring website visits and sales." },
      { title: "Creative plan", text: "Reels, captions and offers planned for each campaign." },
    ],
    steps: [
      "Connect your Instagram and share your offer",
      "We set up audiences, tracking and ads",
      "Get DMs, followers and leads",
    ],
    deliverables: [
      "Meta ad account linked to Instagram",
      "Pixel / Conversions API installed",
      "Audience research for your city",
      "Reels and story ad plan",
      "Launch call to walk you through it",
    ],
    whoFor: ["Salons, cafes, boutiques and gyms", "Brands with a strong visual product", "Businesses growing on reels"],
    faqs: [
      { q: "Do I need a business Instagram account?", a: "Yes, a free business or creator account linked to a Facebook page. We help you switch if needed." },
      { q: "Can I use reels made with Limbu AI?", a: "Yes. Reels made with Limbu AI are ready to use as Instagram ads." },
      { q: "Is this the same plan as Facebook ads?", a: "Yes. Instagram and Facebook ads share one Meta ad account, so the Meta Ads Account Setup covers both." },
    ],
    cta: { whatsapp: "Hi Limbu AI, I want to run Instagram ads for my business." },
  },

  linkedin_ads: {
    slug: "linkedin-ads",
    name: "LinkedIn Ads",
    plan: LINKEDIN_PLAN,
    icon: { type: "brand", value: "linkedin" },
    metaTitle: "LinkedIn Ads for B2B Leads | Limbu.ai",
    metaDescription:
      "LinkedIn ads set up by Limbu.ai: target decision makers by job title, company and industry, with lead gen forms that bring B2B enquiries.",
    tagline: "Reach business owners and decision makers by job title and industry.",
    intro:
      "LinkedIn Ads are the best way to reach professionals: owners, managers and HR or purchase heads at the companies you sell to. We plan the audience, set up the campaign manager and build lead gen campaigns for B2B enquiries.",
    features: [
      { title: "Job title targeting", text: "Reach owners, managers and decision makers directly." },
      { title: "Company & industry filters", text: "Target by company size, industry and location." },
      { title: "Lead gen forms", text: "Pre-filled forms that collect B2B leads in one tap." },
      { title: "Sponsored content", text: "Promote posts and videos in the LinkedIn feed." },
      { title: "Insight tag", text: "Track website visits and conversions from LinkedIn." },
      { title: "Lead reports", text: "Leads, cost per lead and engagement in one report." },
    ],
    steps: [
      "Tell us who you want to reach",
      "We set up Campaign Manager and the audience",
      "Get B2B leads from LinkedIn",
    ],
    deliverables: [
      "Campaign Manager account set up",
      "Audience by job title and industry",
      "Lead gen form campaign",
      "Insight tag tracking",
      "Launch call to walk you through it",
    ],
    whoFor: ["B2B services, software and agencies", "Recruitment and training companies", "Businesses selling to companies, not consumers"],
    faqs: [
      { q: "Is LinkedIn more expensive than Facebook?", a: "Clicks cost more on LinkedIn, but each lead is usually a business decision maker, so it pays off for B2B." },
      { q: "Is ad spend included in the setup price?", a: "No. The setup fee is for our work; ad spend is paid directly to LinkedIn from your own account." },
      { q: "What budget do I need?", a: "LinkedIn needs a higher daily budget than Facebook. We suggest a starting budget after planning your audience." },
    ],
    cta: { whatsapp: "Hi Limbu AI, I want to run LinkedIn ads for my business." },
  },
};

export const AD_SERVICE_LIST = Object.entries(AD_SERVICES).map(([key, s]) => ({ key, ...s }));

export const adServiceBySlug = (slug) => AD_SERVICE_LIST.find((s) => s.slug === slug) || null;

export const adServicePath = (service) => `/ads/${service.slug}`;

export const adPlanByTitle = (title) => AD_PLANS.find((p) => p.title === title) || null;
