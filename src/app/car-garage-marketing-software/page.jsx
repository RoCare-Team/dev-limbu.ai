import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Wrench, MapPin, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Car Garages & Mechanics | Limbu AI",
  description: "Get more repair jobs, manage mechanic reviews, and boost local SEO for your car garage with Limbu AI.",
};

export default function CarGarageMarketingPage() {
  const benefits = [
    {
      title: "Attract Local Drivers",
      description: "Rank higher on Google Maps so broken-down drivers find your garage before your competitors.",
      icon: <MapPin className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Build Mechanic Trust",
      description: "Car repairs require trust. Automatically gather 5-star reviews from happy drivers to prove your reliability.",
      icon: <Wrench className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Private Dispute Resolution",
      description: "Catch unhappy customers privately before they leave a negative review about a repair job.",
      icon: <ShieldAlert className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Car Garages & Mechanics"
      heroHeading="Drive More Cars into Your Repair Shop"
      heroSubheading="Automate your garage's local marketing. Rank #1 on Google Maps, gather 5-star mechanic reviews, and auto-post service offers."
      heroImage="/images/category/car.png"
      heroimage2="/images/bussiness/engine.png"
      benefitsList={benefits}
    />
  );
}