import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Heart, Users, Sparkles } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Yoga & Wellness Centers | Limbu AI",
  description: "Attract more wellness clients, automate mindful social posts, and manage center reviews with Limbu AI.",
};

export default function YogaMarketingPage() {
  const benefits = [
    {
      title: "Grow Your Classes",
      description: "Rank higher in local searches so nearby residents find your wellness center when seeking peace and fitness.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Mindful Content Automation",
      description: "Auto-publish daily wellness tips, class schedules, and motivational quotes without lifting a finger.",
      icon: <Heart className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Build a Trusted Sanctuary",
      description: "Collect peaceful 5-star reviews from your students using an easy-to-scan Magic QR code.",
      icon: <Sparkles className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Yoga & Wellness Centers"
      heroHeading="Fill Your Wellness Classes with Local SEO"
      heroSubheading="Focus on healing your clients. Limbu AI automates your online reputation, class updates, and helps you rank #1 locally."
      heroImage="/images/category/yoga.png"
      heroimage2="/images/bussiness/yoga.png"
      benefitsList={benefits}
    />
  );
}