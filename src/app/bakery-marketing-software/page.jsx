import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";
import { Store, Camera, MessageSquare, TrendingUp, Sparkles, Star, CakeSlice, SmilePlus } from "lucide-react";

export const metadata = {
  title: "Bakery & Cake Shop Marketing Software | Limbu.ai",
  description: "Promote your bakery online, automate delicious posts, and collect sweet 5-star customer reviews using Limbu AI.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/bakery-marketing-software" },
};

export default function BakeryMarketingPage() {
  const benefits = [
    {
      title: "Showcase Your Bakes",
      description: "Use AI to instantly publish mouth-watering photos of your cakes and pastries across all your social profiles.",
      icon: <Camera className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Sweeten Your Reviews",
      description: "Prompt happy customers to leave 5-star reviews instantly using your custom Magic QR code in-store.",
      icon: <Store className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Private Feedback Loop",
      description: "If a customer isn't happy with their order, catch their feedback privately before it hits Google.",
      icon: <MessageSquare className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Bakery Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-intent terms like 'Birthday cake near me' or 'Fresh pastries' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Mouth-Watering Content",
      description: "Stop stressing about updating your profile. Limbu AI automatically creates posts showing your freshly baked goods, seasonal specials, and custom cake designs.",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture In-Store Reviews",
      description: "Ask customers to scan your custom Magic QR code on the bakery counter or pastry box to leave a glowing 5-star review while they are enjoying their sweet treat.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, personalized replies to every customer review instantly. It thanks 5-star customers and politely addresses any 1-star complaints to protect your bakery's reputation.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Cake Orders Explode",
      description: "As your 5-star reviews and weekly active posts compound, your bakery climbs to the #1 spot on Google Maps, driving consistent foot traffic and custom cake orders.",
      icon: <CakeSlice className="w-5 h-5" />,
    },
  ];

  const bakeryPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776427304/backer_va6jmm.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776427432/cake_sp1kzk.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776427506/backer_rpkqd8.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776427553/cake_wznqvo.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776427618/backer_ar55yw.jpg",
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
        { "@type": "ListItem", position: 2, name: "Bakery Marketing Software", item: "https://www.limbu.ai/bakery-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Bakery & Cake Shop Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Promote your bakery online, automate delicious posts, and collect sweet 5-star customer reviews using Limbu AI.",
      url: "https://www.limbu.ai/bakery-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does Limbu AI help Bakers & Cake Shops rank higher on Google?", acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile with fresh bakery photos and review replies, boosting your visibility in 'bakery near me' searches." } },
        { "@type": "Question", name: "Is it safe to connect my bakery's Google account?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use official Google OAuth — we never store passwords and all connections are encrypted with enterprise-grade security." } },
        { "@type": "Question", name: "Will the AI create bakery content and posts automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI creates mouth-watering bakery posts, seasonal offers, and professional review replies automatically, which you can auto-publish or approve first." } },
        { "@type": "Question", name: "How does the Magic QR code get more reviews for my bakery?", acceptedAnswer: { "@type": "Answer", text: "Happy customers scan your QR code at checkout to instantly leave a 5-star Google review. Unsatisfied customers are routed to a private feedback form instead." } },
        { "@type": "Question", name: "How quickly will I see more bakery customers?", acceptedAnswer: { "@type": "Answer", text: "Most bakeries see increased profile views and foot traffic within 30 days of consistent automated activity on their Google Business Profile." } },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Bakers & Cake Shops"
        heroHeading="Turn Your Sweet Creations into 5-Star Reviews"
        heroSubheading="Automate your bakery's online marketing. Publish fresh cake photos and rank #1 when locals search for 'bakery near me'."
        heroImage="/images/category/cake.png"
        heroimage2="/images/bussiness/cake.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={bakeryPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Bakery%20business."
      />
    </>
  );
}