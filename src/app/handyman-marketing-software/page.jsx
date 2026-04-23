import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Hammer, MapPin, CheckCircle, TrendingUp, Wrench, Star, MessageSquare, PhoneCall } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Handyman Services | Limbu.ai",
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

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Handyman Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-intent terms like 'Handyman near me' or 'Emergency repair services'.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Service Content",
      description: "Stop stressing about updating your profile. Limbu AI automatically creates posts showing your before-and-after work, seasonal home tips, and available services.",
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture On-Site Reviews",
      description: "Ask the homeowner to scan your custom Magic QR code right after you finish fixing their issue. Gather a glowing 5-star review while they are thrilled with the result.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, personalized replies to every customer review instantly. It thanks 5-star clients and politely addresses any 1-star complaints to protect your reputation.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Emergency Calls Explode",
      description: "As your 5-star reviews and weekly active posts compound, your handyman business climbs to the #1 spot on Google Maps, driving consistent, high-intent service calls.",
      icon: <PhoneCall className="w-5 h-5" />,
    },
  ];

  const handymanPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490892/tour_and_travel_fnieho.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776494973/emergency_plumber_ye6glg.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776495025/emergency_plumber_iqvnpu.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776495090/emergency_plumber_rlibcn.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776495135/emergency_plumber_jdudlw.jpg",
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
      industryName="Handyman Services"
      heroHeading="Get More Calls for Local Repair Jobs"
      heroSubheading="Stop relying on word-of-mouth alone. Automate your local SEO, gather 5-star reviews, and become the most trusted handyman in town."
      heroImage="/images/category/handyman.png"
      heroimage2="/images/bussiness/handman.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={handymanPostImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Handyman%20business."
    />
  );
}