import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Store, Camera, MessageSquare, TrendingUp, Sparkles, Star, CakeSlice, SmilePlus } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Bakers & Cake Shops | Limbu.ai",
  description: "Promote your bakery online, automate delicious posts, and collect sweet 5-star customer reviews using Limbu AI.",
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

  return (
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
  );
}