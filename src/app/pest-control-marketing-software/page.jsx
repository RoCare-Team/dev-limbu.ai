import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Bug, SearchCheck, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Pest Control Businesses | Limbu AI",
  description: "Grow your pest control business with automated local SEO, 5-star customer reviews, and smart online presence management.",
};

export default function PestControlMarketingPage() {
  const benefits = [
    {
      title: "Be Found First",
      description: "When someone has a pest problem, they search Google immediately. Rank #1 locally to win those urgent calls.",
      icon: <SearchCheck className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Showcase Your Expertise",
      description: "Auto-publish seasonal pest control tips and safety updates to build trust with local homeowners.",
      icon: <Bug className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Collect Trust Signals",
      description: "Prompt satisfied customers to leave glowing reviews right after a successful treatment.",
      icon: <MessageCircle className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Pest Control Services"
      heroHeading="Get More Local Calls for Pest Extermination"
      heroSubheading="Dominate your service area. We automate your online reputation so you become the most trusted pest control service in town."
      heroImage="/images/category/pest.png"
      heroimage2="/images/bussiness/pest.png"
      benefitsList={benefits}
    />
  );
}