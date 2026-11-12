/**
 * Step-by-step guide for every service in the header "Services" menu
 * (lib/siteServices.js). Rendered by /guide (index) and /guide/[slug], and
 * listed in the header "Guide" menu. `key` matches SITE_SERVICES.key.
 *
 * Step `icon` is a lucide-react icon name (mapped in components/guide/GuideIcon.jsx).
 */
import { whatsappHref } from "@/lib/seoTools";

const talk = (text) => ({ label: "Talk to us on WhatsApp", href: whatsappHref(text), external: true });

export const SERVICE_GUIDES = [
  {
    key: "gmb",
    slug: "google-business-profile",
    name: "GMB Management",
    menuSub: "Connect, post, reviews and QR",
    title: "How to Grow Your Google Business Profile with Limbu AI",
    intro:
      "Connect your Google Business Profile once. Limbu AI then posts updates, replies to reviews and shows how many calls, visits and searches you get.",
    steps: [
      {
        icon: "BadgeCheck",
        title: "Choose a GMB plan",
        text: "Open Google Business Profile on the home page and pick Basic, Professional or Premium. Yearly is the cheapest per month; quarterly is also available.",
        action: { label: "See GMB plans", href: "/#tools-gbp" },
      },
      {
        icon: "LogIn",
        title: "Log in and open your dashboard",
        text: "Log in with your mobile number and OTP. As soon as the payment goes through your plan is active and the dashboard opens.",
      },
      {
        icon: "Link",
        title: "Connect your Google Business Profile",
        text: "On the dashboard click Connect, sign in with the Google account that manages your business and pick the location to manage.",
        action: { label: "Connection guide", href: "/how-to-connect-gmb" },
      },
      {
        icon: "PenSquare",
        title: "Post updates with AI",
        text: "Open Post Management. Limbu AI writes posts with images for your business; publish now, schedule them, or let them go out automatically.",
        action: { label: "Create post guide", href: "/how-to-create-post" },
      },
      {
        icon: "MessageSquare",
        title: "Reply to every review",
        text: "Open Review Management and switch to AI Auto. Every new Google review gets a polite, personal reply within seconds.",
        action: { label: "Review reply guide", href: "/how-to-reply-review" },
      },
      {
        icon: "QrCode",
        title: "Get more reviews with Magic QR",
        text: "Create a Magic QR and place it at your counter. Customers scan it and leave a Google review in a few taps.",
        action: { label: "Magic QR guide", href: "/how-to-generate-magic-qr" },
      },
      {
        icon: "BarChart3",
        title: "Track your growth",
        text: "GMB Insights shows calls, website clicks and direction requests. GMB Health, Keyword Planner and Competitor Analysis show what to improve next.",
      },
    ],
    more: [
      { label: "How to connect GBP", href: "/how-to-connect-gmb" },
      { label: "Create an AI post", href: "/how-to-create-post" },
      { label: "Post on GBP", href: "/how-to-post-on-gmb" },
      { label: "Reply to reviews", href: "/how-to-reply-review" },
      { label: "Generate Magic QR", href: "/how-to-generate-magic-qr" },
    ],
    cta: { label: "See GMB plans", href: "/#tools-gbp" },
  },
  {
    key: "social",
    slug: "social-media",
    name: "Social Media Management",
    menuSub: "Connect accounts, post and reels",
    title: "How to Manage Your Social Media with Limbu AI",
    intro:
      "Connect Facebook, Instagram, LinkedIn, YouTube and Pinterest once, then post and publish reels to all of them from one place.",
    steps: [
      {
        icon: "BadgeCheck",
        title: "Choose a Social Media plan",
        text: "Pick Social Starter, Growth or Pro in the Social Media section of the home page. Each plan includes a number of reels and posts every month.",
        action: { label: "See social plans", href: "/#tools-social_media" },
      },
      {
        icon: "Share2",
        title: "Open Social Media",
        text: "After login, click Social Media in the sidebar. You will see every platform and whether it is connected.",
        action: { label: "Open Social Media", href: "/social-media" },
      },
      {
        icon: "Plus",
        title: "Connect your accounts",
        text: "Click Connect on a platform, sign in and allow access to your page or profile. Repeat for each platform you use.",
      },
      {
        icon: "Settings2",
        title: "Manage a platform",
        text: "Click Manage on a connected platform to see its pages, add another page, or disconnect one or all of them.",
      },
      {
        icon: "PenSquare",
        title: "Create and publish posts",
        text: "Click Create Post on a page. Write the post or let AI write it, choose the platforms and publish now or schedule it.",
      },
      {
        icon: "Clapperboard",
        title: "Make reels",
        text: "Click Make a Reel to turn text, photos or an AI avatar into a short video, then post it to your connected accounts.",
        action: { label: "Make a reel", href: "/video-generation" },
      },
    ],
    cta: { label: "See social plans", href: "/#tools-social_media" },
  },
  {
    key: "ai",
    slug: "create-video",
    name: "Create Video",
    menuSub: "AI reels, videos and posts",
    title: "How to Create Videos with Limbu AI",
    intro:
      "Turn a line of text, a product photo or an AI avatar into a ready-to-post video. Videos are paid with coins, so you only pay for what you make.",
    steps: [
      {
        icon: "Coins",
        title: "Add coins to your wallet",
        text: "Log in and click the + coins button at the top, or open Wallet, to top up. Every video type shows its coin cost before you start.",
        action: { label: "Open wallet", href: "/wallet" },
      },
      {
        icon: "Clapperboard",
        title: "Pick a video type",
        text: "Text to Video, Image to Video, CGI Product Video, AI Avatar Video or an AI post. Choose the one that fits what you want to show.",
        action: { label: "Create a video", href: "/video-generation" },
      },
      {
        icon: "Type",
        title: "Describe your video",
        text: "Write what the video should say, upload a product photo, or choose an avatar and script. Simple, specific prompts give the best results.",
      },
      {
        icon: "Sparkles",
        title: "Generate",
        text: "Click generate. The video is made in the background; the coins are used only for the video you create.",
      },
      {
        icon: "Download",
        title: "Download or post",
        text: "Download the video, or post it straight to your connected social accounts as a reel.",
      },
    ],
    cta: { label: "Create a video", href: "/video-generation" },
  },
  {
    key: "outreach",
    slug: "outreach",
    name: "Outreach & Engage",
    menuSub: "Email and WhatsApp campaigns",
    title: "How to Reach Your Customers with Email and WhatsApp",
    intro:
      "Bring customers back with email campaigns and WhatsApp automation: upload your customer list once and send offers, reminders and updates.",
    steps: [
      {
        icon: "BadgeCheck",
        title: "Choose an outreach plan",
        text: "Open Outreach & Engage on the home page and pick the Emailer Plan or the WhatsApp Automation Plan, billed yearly or quarterly.",
        action: { label: "See outreach plans", href: "/#tools-outreach" },
      },
      {
        icon: "Upload",
        title: "Add your customers",
        text: "Upload your customer list (names, emails or phone numbers) so your campaigns know who to reach.",
      },
      {
        icon: "MessageCircle",
        title: "Connect WhatsApp",
        text: "For WhatsApp Automation, open the WhatsApp tab and connect your WhatsApp Business number with the guided sign-up.",
        action: { label: "Open WhatsApp", href: "/dashboard?tab=whatsapp" },
      },
      {
        icon: "Mail",
        title: "Write your campaign",
        text: "Write the message yourself or let AI write the email or WhatsApp text, then send now or schedule it.",
      },
      {
        icon: "BarChart3",
        title: "Check the results",
        text: "See who opened and clicked your emails, and use it to plan your next offer.",
      },
    ],
    cta: { label: "See outreach plans", href: "/#tools-outreach" },
  },
  {
    key: "seo",
    slug: "website-seo",
    name: "Website SEO",
    menuSub: "Free audit, then rank higher",
    title: "How to Improve Your Website's Google Ranking",
    intro:
      "Start with a free website audit to see what is holding your site back, then let our SEO team fix it and build your rankings month by month.",
    steps: [
      {
        icon: "Gauge",
        title: "Run a free Website Audit",
        text: "Enter your website address and run the audit. It checks about 50 things Google looks at: SEO, speed, security, mobile and local signals.",
        action: { label: "Run free audit", href: "/seo-tools/website-audit" },
      },
      {
        icon: "ListChecks",
        title: "Read your score and fix list",
        text: "You get a score out of 100 and a fix list, most important first. Download it as a PDF to share with your developer.",
      },
      {
        icon: "BadgeCheck",
        title: "Choose an SEO plan",
        text: "Pick Basic, Standard or Advanced SEO. Monthly and yearly billing are available; yearly is 20% cheaper.",
        action: { label: "See SEO plans", href: "/#tools-website_seo" },
      },
      {
        icon: "Wrench",
        title: "We optimise your site",
        text: "Our team handles on-page, technical and off-page SEO, content and backlinks for the keywords that bring you customers.",
      },
      {
        icon: "TrendingUp",
        title: "Track your rankings",
        text: "Follow your keyword positions with Local Rank Tracker and Keyword Research as your site moves up.",
      },
    ],
    cta: { label: "Run free audit", href: "/seo-tools/website-audit" },
  },
  {
    key: "ads",
    slug: "paid-ads",
    name: "Paid Ads",
    menuSub: "Google, Meta and LinkedIn ads",
    title: "How to Start Paid Ads with Limbu AI",
    intro:
      "We set up your ad account properly (campaigns, tracking and targeting) on Google, YouTube, Facebook, Instagram or LinkedIn so your budget brings leads.",
    steps: [
      {
        icon: "Target",
        title: "Pick a platform",
        text: "Open Paid Ads on the home page and choose Google, YouTube, Facebook, Instagram or LinkedIn ads. Each has its own page explaining what is included.",
        action: { label: "See ad services", href: "/#tools-paid_ads" },
      },
      {
        icon: "BadgeCheck",
        title: "Choose the account setup plan",
        text: "Ad account setup is a one-time payment. Your ad budget is paid directly to Google or Meta and stays in your control.",
      },
      {
        icon: "ClipboardList",
        title: "Share your business details",
        text: "Tell us your services, area, target customers and monthly budget. We use it to plan the campaigns and targeting.",
      },
      {
        icon: "Rocket",
        title: "Your ads go live",
        text: "We build the campaigns and tracking. Ads usually go live within 2 to 3 working days after the platform approves them.",
      },
      {
        icon: "PhoneCall",
        title: "Get calls and leads",
        text: "Enquiries come to your phone, WhatsApp or website. We help you read the results and improve the ads.",
      },
    ],
    cta: { label: "See ad services", href: "/#tools-paid_ads" },
  },
  {
    key: "web",
    slug: "website-development",
    name: "Website Development",
    menuSub: "From plan to live website",
    title: "How to Get Your Business Website with Limbu AI",
    intro:
      "A fast, mobile-friendly website that brings enquiries, from a simple business site to a full online store.",
    steps: [
      {
        icon: "LayoutTemplate",
        title: "Choose a website package",
        text: "Open Website Development and pick Starter, Business or E-commerce. Every package is a one-time price.",
        action: { label: "See website packages", href: "/website-development" },
      },
      {
        icon: "ClipboardList",
        title: "Share your content",
        text: "Send your logo, photos, services, contact details and any sites you like. We can write the text for you.",
      },
      {
        icon: "Palette",
        title: "Review the design",
        text: "We design the pages and share them with you. Ask for changes until it looks right.",
      },
      {
        icon: "Rocket",
        title: "Go live",
        text: "We connect your domain, set up SEO basics and launch. Add-ons such as a payment gateway, admin panel and maintenance are available.",
      },
    ],
    cta: { label: "See website packages", href: "/website-development" },
  },
  {
    key: "crm",
    slug: "custom-crm",
    name: "Custom CRM",
    menuSub: "Leads, pipeline and follow-ups",
    title: "How to Get a Custom CRM for Your Business",
    intro:
      "A CRM built around how you sell: every lead in one place, a clear pipeline, and automatic follow-ups so no enquiry goes cold.",
    steps: [
      {
        icon: "MessageCircle",
        title: "Tell us what you need",
        text: "Message us on WhatsApp with how you get leads today and what you want to track: leads, pipeline, follow-ups, team or reports.",
        action: talk("Hi Limbu AI, I want a custom CRM for my business."),
      },
      {
        icon: "ClipboardList",
        title: "Free consultation and quote",
        text: "We understand your sales process and share a plan with features, timeline and price.",
      },
      {
        icon: "Wrench",
        title: "We build and set it up",
        text: "We build the CRM, connect your lead sources (Google, Meta, website, WhatsApp) and set up roles for your team.",
      },
      {
        icon: "GraduationCap",
        title: "Training and support",
        text: "We train your team and stay available for changes and support after launch.",
      },
    ],
    cta: talk("Hi Limbu AI, I want a custom CRM for my business."),
  },
  {
    key: "app",
    slug: "custom-app",
    name: "Custom App",
    menuSub: "Android and iPhone apps",
    title: "How to Get a Mobile App for Your Business",
    intro:
      "Your own Android and iPhone app, with an admin panel and push notifications, published on the Play Store and App Store.",
    steps: [
      {
        icon: "MessageCircle",
        title: "Share your app idea",
        text: "Message us on WhatsApp with what the app should do, who will use it and which phones it should run on.",
        action: talk("Hi Limbu AI, I want a mobile app for my business."),
      },
      {
        icon: "ClipboardList",
        title: "Plan and quote",
        text: "We suggest the right approach (Android, iOS or one cross-platform app) and share the features, timeline and price.",
      },
      {
        icon: "Palette",
        title: "Design and build",
        text: "You review the screens first, then we build the app and its admin panel and share test versions with you.",
      },
      {
        icon: "Rocket",
        title: "Publish on the stores",
        text: "We handle the Play Store and App Store listings and approval, then support you after launch.",
      },
    ],
    cta: talk("Hi Limbu AI, I want a mobile app for my business."),
  },
];

export const guidePath = (guide) => `/guide/${guide.slug}`;

export const guideBySlug = (slug) => SERVICE_GUIDES.find((g) => g.slug === slug) || null;
