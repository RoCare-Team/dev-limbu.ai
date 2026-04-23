import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Scissors, Sparkles, MapPin, TrendingUp, Brush, Star, MessageSquare, Heart } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Salon Owners | Limbu.ai",
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

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Salon Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-volume terms like 'Hair salon near me' or 'Best spa' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Beauty Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules stunning posts about your trending hairstyles, nail art, and skincare services.",
      icon: <Brush className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Mirror-Selfie Reviews",
      description: "Clients scan your custom Magic QR code placed right on the salon mirror or reception desk to leave a glowing 5-star review while they are feeling confident and beautiful.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, warm replies to every customer review instantly. It thanks your 5-star clients and politely addresses any 1-star complaints privately.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Chair Bookings Explode",
      description: "As your 5-star reviews and weekly active posts compound, your salon climbs to the #1 spot on Google Maps, driving consistent, daily appointment bookings.",
      icon: <Heart className="w-5 h-5" />,
    },
  ];

  const salonPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776430481/salon_onwer_tgrefe.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776430571/salon_onwer_j86ybt.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776430689/salon_onwer_pjpa2x.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776430764/salon_onwer_ypxlab.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776430832/salon_onwer_lky8xw.jpg",
  ];

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM+(2).mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765578/WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765573/WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765583/WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://res.cloudinary.com/dsnuzit6o/video/upload/v1767765586/WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4",
  ];

  return (
    <IndustryLandingTemplate
      industryName="Salons & Spas"
      heroHeading="Book More Chairs with a 5-Star Salon Reputation"
      heroSubheading="You create the styles, we bring the clients. Automate your salon's local marketing, reviews, and social media with Limbu AI."
      heroImage="/images/category/salon.png"
      heroimage2="/images/bussiness/salon.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={salonPostImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Salon%20business."
    />
  );
}