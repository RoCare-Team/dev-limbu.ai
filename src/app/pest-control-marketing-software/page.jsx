import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Bug, SearchCheck, MessageCircle, TrendingUp, Star, MessageSquare, PhoneCall } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Pest Control Businesses | Limbu.ai",
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
      description: "Prompt satisfied customers to leave glowing 5-star reviews right after a successful treatment.",
      icon: <MessageCircle className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Business Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your current local ranking for urgent terms like 'Pest Control Near Me' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Seasonal Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about seasonal threats like termites, mosquitoes, and rodents.",
      icon: <Bug className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Post-Service Reviews",
      description: "Your technicians simply ask the homeowner to scan your custom Magic QR code on their phone or invoice to leave a quick 5-star review while they are relieved the pests are gone.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every customer review instantly, showing potential clients that you care about your service quality.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Emergency Calls Explode",
      description: "As your 5-star reviews and weekly active posts compound, your pest control company climbs to the #1 spot on Google Maps, driving consistent, high-intent emergency calls.",
      icon: <PhoneCall className="w-5 h-5" />,
    },
  ];

  const pestPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488203/Pest_n80zyb.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488283/Pest_hzlpem.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488364/Pest_ympnyn.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488448/Pest_ltkkes.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488508/Pest_q7ahlb.jpg",
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
      industryName="Pest Control Services"
      heroHeading="Get More Local Calls for Pest Extermination"
      heroSubheading="Dominate your service area. We automate your online reputation so you become the most trusted pest control service in town."
      heroImage="/images/category/pest.png"
      heroimage2="/images/bussiness/pest.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={pestPostImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Pest%20Control%20business."
    />
  );
}