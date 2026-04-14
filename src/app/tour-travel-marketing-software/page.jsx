import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Plane, Map, Camera } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Tours & Travel Agencies | Limbu AI",
  description: "Increase tour bookings, auto-publish travel content, and collect glowing vacation reviews with Limbu AI.",
};

export default function TourTravelMarketingPage() {
  const benefits = [
    {
      title: "Increase Bookings",
      description: "Boost your local search visibility so travelers find your agency first when planning their next trip.",
      icon: <Map className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automated Travel Content",
      description: "Keep your audience dreaming. Automatically publish beautiful destination photos and package deals.",
      icon: <Camera className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "5-Star Vacation Reviews",
      description: "Prompt travelers to leave a review right after their amazing trip, building massive social proof.",
      icon: <Plane className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Tours & Travels"
      heroHeading="Turn Wanderlust into Confirmed Travel Bookings"
      heroSubheading="You plan the perfect trips, we handle the marketing. Automate your agency's reviews, social posts, and local SEO."
      heroImage="/images/category/tour.png"
      heroimage2="/images/bussiness/tour.png"
      benefitsList={benefits}
    />
  );
}