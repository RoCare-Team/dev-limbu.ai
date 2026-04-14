import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Store, Camera, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Bakers & Cake Shops | Limbu AI",
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

  return (
    <IndustryLandingTemplate
      industryName="Bakers & Cake Shops"
      heroHeading="Turn Your Sweet Creations into 5-Star Reviews"
      heroSubheading="Automate your bakery's online marketing. Publish fresh cake photos and rank #1 when locals search for 'bakery near me'."
      heroImage="/images/category/cake.png"
      heroimage2="/images/bussiness/cake.png"
      benefitsList={benefits}
    />
  );
}