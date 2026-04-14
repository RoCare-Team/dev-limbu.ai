import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Utensils, Star, Share2 } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Restaurants & Bars | Limbu AI",
  description: "Drive more foot traffic to your restaurant, collect 5-star diner reviews, and auto-post your menus with Limbu AI.",
};

export default function RestaurantMarketingPage() {
  const benefits = [
    {
      title: "Drive Foot Traffic",
      description: "Rank at the top of Google when hungry locals search for places to eat or drink nearby.",
      icon: <Utensils className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Filter Bad Reviews",
      description: "Unhappy with the food? Our shield catches bad reviews privately so you can offer a refund or apology directly.",
      icon: <Star className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Auto-Post Specials",
      description: "Let AI generate and publish posts about your daily specials, happy hours, and new menu items automatically.",
      icon: <Share2 className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Restaurants & Bars"
      heroHeading="Fill Your Tables with a Top-Rated Restaurant Profile"
      heroSubheading="Stop stressing over bad reviews. Use Limbu AI to capture 5-star diner experiences, protect your rating, and auto-promote your menu."
      heroImage="/images/category/restorent.png"
      heroimage2="/images/bussiness/resto.png"
      benefitsList={benefits}
    />
  );
}