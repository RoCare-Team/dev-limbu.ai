import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Hammer, MapPin, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Handyman Services | Limbu AI",
  description: "Get more local repair jobs, manage service reviews, and boost your handyman business with Limbu AI.",
};

export default function HandymanMarketingPage() {
  const benefits = [
    {
      title: "Win Local Jobs",
      description: "Rank at the top of Google Maps so homeowners call you first for emergency fixes and renovations.",
      icon: <MapPin className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Showcase Your Work",
      description: "Automatically post before-and-after photos of your repair jobs to prove your skills online.",
      icon: <Hammer className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Collect Trust Proof",
      description: "Ask clients to scan your QR code right after you finish a job to instantly gather 5-star reviews.",
      icon: <CheckCircle className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Handyman Services"
      heroHeading="Get More Calls for Local Repair Jobs"
      heroSubheading="Stop relying on word-of-mouth alone. Automate your local SEO, gather 5-star reviews, and become the most trusted handyman in town."
      heroImage="/images/category/handyman.png"
      heroimage2="/images/bussiness/handman.png"
      benefitsList={benefits}
    />
  );
}