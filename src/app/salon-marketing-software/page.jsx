import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Scissors, Sparkles, MapPin } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Salon Owners | Limbu AI",
  description: "Get more local salon bookings, automate your Instagram posts, and build a 5-star reputation with Limbu AI.",
};

export default function SalonMarketingPage() {
  const benefits = [
    {
      title: "Rank Higher Locally",
      description: "Dominate Google search results when people look for salons, haircuts, or spas in your exact area.",
      icon: <MapPin className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automate Style Posts",
      description: "Keep your profile fresh with AI-generated posts showcasing hairstyles, offers, and beauty tips.",
      icon: <Scissors className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Capture Glowing Reviews",
      description: "Ask clients to scan your Magic QR right after their haircut to instantly boost your 5-star ratings.",
      icon: <Sparkles className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Salons & Spas"
      heroHeading="Book More Chairs with a 5-Star Salon Reputation"
      heroSubheading="You create the styles, we bring the clients. Automate your salon's local marketing, reviews, and social media with Limbu AI."
      heroImage="/images/category/salon.png"
      heroimage2="/images/bussiness/salon.png"
      benefitsList={benefits}
    />
  );
}