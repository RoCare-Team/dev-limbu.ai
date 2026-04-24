import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { TrendingUp, Users, ShieldCheck, Home, CalendarCheck, MessageSquare, Star } from "lucide-react";

export const metadata = {
  title: "AI Marketing Software for Real Estate Agents | Limbu.ai",
  description: "Automate your real estate marketing, attract more property buyers, and collect 5-star client reviews with Limbu AI's smart software.",
};

export default function RealEstateMarketingPage() {
  const benefits = [
    {
      title: "Attract More Property Buyers",
      description: "Automatically collect and showcase 5-star reviews from happy home buyers to build immense trust and attract new leads.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automate Property Posts",
      description: "Keep your Google profile active with AI-generated property listings, market trends, and open house announcements.",
      icon: <Home className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Your Agency Rating",
      description: "Our Review Shield privately captures negative feedback before it goes public, protecting your real estate agency's reputation.",
      icon: <ShieldCheck className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Agency Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your current local ranking for terms like 'Real Estate Agent near me' and builds a custom strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Real Estate Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about the local housing market and your services.",
      icon: <Home className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Client Reviews",
      description: "Clients scan your custom Magic QR code right after closing a deal to leave a quick 5-star review while their excitement is at its peak.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every client review instantly, showing Google you are a highly engaged agent.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Your Leads Grow",
      description: "As your 5-star reviews and daily active posts compound, your agency climbs to the #1 spot on Google Maps, driving consistent high-intent property leads.",
      icon: <CalendarCheck className="w-5 h-5" />,
    },
  ];

  const postImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767776297/output_yd9alt.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767694542/output_n1ahcx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764404571/tmpx28dvfi__qxwt1c.jpg",
  ];

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
  ];

  return (
    <IndustryLandingTemplate
      industryName="Real Estate Agents"
      heroHeading="Grow Your Real Estate Leads on Autopilot"
      heroSubheading="Stop worrying about marketing. Use Limbu AI to get more 5-star client reviews, auto-publish property posts, and dominate local searches while you focus on closing deals."
      heroImage="/images/category/realestate.png"
      heroimage2="/images/hero.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={postImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Real%20Estate%20business."
    />
  );
}
