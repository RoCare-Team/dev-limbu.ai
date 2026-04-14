import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { TrendingUp, Users, Star } from "lucide-react";

export const metadata = {
  title: "AI Marketing Software for Gym & Fitness Centres | Limbu AI",
  description: "Automate your gym marketing, increase memberships, and collect 5-star reviews with Limbu AI's smart software for fitness centres.",
};

export default function GymMarketingPage() {
  const benefits = [
    {
      title: "Get More Members",
      description: "Automatically collect and showcase 5-star reviews from happy gym members to attract new signups.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automate Your Posts",
      description: "Keep your social profiles active with AI-generated workout tips, gym schedules, and motivational posts.",
      icon: <TrendingUp className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Your Rating",
      description: "Our Review Shield privately captures negative feedback before it goes public, protecting your gym's reputation.",
      icon: <Star className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Gyms & Fitness Centres"
      heroHeading="Grow Your Gym Memberships on Autopilot"
      heroSubheading="Stop worrying about marketing. Use Limbu AI to get more 5-star reviews, auto-publish workout posts, and dominate local searches."
      heroImage="/images/category/jim.png"
      heroimage2="/images/bussiness/gym.png"
      benefitsList={benefits}
    />
  );
}