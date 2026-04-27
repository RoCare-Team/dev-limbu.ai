import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Restaurant Marketing Software | Limbu.ai",
  description: "Drive more foot traffic to your restaurant, collect 5-star diner reviews, and auto-post your menus with Limbu AI.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/restaurant-marketing-software" },
};

export default function RestaurantMarketingPage() {
  const benefits = [
    {
      title: "Drive Foot Traffic",
      description: "Rank at the top of Google when hungry locals search for places to eat or drink nearby.",
      icon: "Utensils",
    },
    {
      title: "Filter Bad Reviews",
      description: "Unhappy with the food? Our shield catches bad reviews privately so you can offer a refund or apology directly.",
      icon: "ShieldCheck",
    },
    {
      title: "Auto-Post Specials",
      description: "Let AI generate and publish posts about your daily specials, happy hours, and new menu items automatically.",
      icon: "Share2",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Restaurant Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-volume terms like 'Restaurants near me' or 'Best pizza in town'.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Foodie Content",
      description: "Stop stressing about social media. Limbu AI automatically creates mouth-watering posts about your chef's specials, ambiance, and weekend events.",
      icon: "ChefHat",
    },
    {
      step: "03",
      title: "Capture Table-Side Reviews",
      description: "Diners scan your custom Magic QR code placed on their table tent or receipt to leave a 5-star review while they are still enjoying their meal.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, personalized replies to every food review instantly. It thanks 5-star diners and politely addresses 1-star complaints.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Fill Every Table",
      description: "As your 5-star reviews and daily active posts compound, your restaurant climbs to the #1 spot on Google Maps, driving consistent daily reservations and walk-ins.",
      icon: "Coffee",
    },
  ];

  const restaurantPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776431213/Restorent_iluwvz.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776431290/Restorent_dyi1wa.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776431522/Restorent_pp1frx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776431577/Restorent_y3jjfx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776431655/Restorent_azijlt.jpg",
  ];

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM+(2).mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765573/WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765583/WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765586/WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4",
  ];

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
        { "@type": "ListItem", position: 2, name: "Restaurant Marketing Software", item: "https://www.limbu.ai/restaurant-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Restaurant Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Drive more foot traffic to your restaurant, collect 5-star diner reviews, and auto-post your menus with Limbu AI.",
      url: "https://www.limbu.ai/restaurant-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does Limbu AI help Restaurants rank higher on Google?", acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile with daily menu posts and instant review replies — two key Google ranking factors — boosting your visibility in 'restaurant near me' searches." } },
        { "@type": "Question", name: "Is it safe to connect my restaurant's Google account?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use official Google OAuth — we never store passwords and all connections are encrypted with enterprise-grade security." } },
        { "@type": "Question", name: "Will the AI auto-post my restaurant's menu and offers?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI creates and schedules engaging posts about your menu, daily specials, and seasonal offers. You can auto-publish or approve each post first." } },
        { "@type": "Question", name: "How does the Magic QR code work for my restaurant?", acceptedAnswer: { "@type": "Answer", text: "Diners scan your QR code after their meal to instantly leave a 5-star Google review. Customers with complaints are routed to a private feedback form to protect your public rating." } },
        { "@type": "Question", name: "How quickly will I see more diners coming in?", acceptedAnswer: { "@type": "Answer", text: "Most restaurants see increased profile views and reservation requests within 30 days of consistent automated activity on their Google Business Profile." } },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Restaurants & Bars"
        heroHeading="Fill Your Tables with a Top-Rated Restaurant Profile"
        heroSubheading="Stop stressing over bad reviews. Use Limbu AI to capture 5-star diner experiences, protect your rating, and auto-promote your menu."
        heroImage="/images/category/restorent.png"
        heroimage2="/images/bussiness/resto.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={restaurantPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Restaurant%20business."
      />
    </>
  );
}