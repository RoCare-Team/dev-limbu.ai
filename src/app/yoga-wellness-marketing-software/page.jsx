import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Heart, Users, Sparkles, TrendingUp, Flower2, Star, MessageSquare, Activity } from "lucide-react";

export const metadata = {
  title: "Marketing Software for Yoga & Wellness Centers | Limbu.ai",
  description: "Attract more wellness clients, automate mindful social posts, and manage center reviews with Limbu AI.",
};

export default function YogaMarketingPage() {
  const benefits = [
    {
      title: "Grow Your Classes",
      description: "Rank higher in local searches so nearby residents find your wellness center when seeking peace and fitness.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Mindful Content Automation",
      description: "Auto-publish daily wellness tips, class schedules, and motivational quotes without lifting a finger.",
      icon: <Heart className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Build a Trusted Sanctuary",
      description: "Collect peaceful 5-star reviews from your students using an easy-to-scan Magic QR code.",
      icon: <Sparkles className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Wellness Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for terms like 'Yoga classes near me' or 'Meditation center' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Mindful Content",
      description: "Stop stressing about social media. Limbu AI automatically creates and schedules calming posts about your upcoming retreats, class schedules, and wellness tips.",
      icon: <Flower2 className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Post-Class Reviews",
      description: "Students scan your custom Magic QR code on their way out of the studio to leave a glowing 5-star review while they are feeling centered and relaxed.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts peaceful, personalized replies to every student review instantly. It thanks 5-star clients and politely addresses any 1-star concerns privately.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Class Bookings Grow",
      description: "As your 5-star reviews and weekly active mindful posts compound, your wellness center climbs to the #1 spot on Google Maps, driving consistent daily class signups.",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  const yogaPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490222/tour_and_travel_uupfn2.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490290/tour_and_travel_hnkb3r.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490360/tour_and_travel_gllxxx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490481/tour_and_travel_nsjm0o.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776490612/tour_and_travel_exicr1.jpg",
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
      industryName="Yoga & Wellness Centers"
      heroHeading="Fill Your Wellness Classes with Local SEO"
      heroSubheading="Focus on healing your clients. Limbu AI automates your online reputation, class updates, and helps you rank #1 locally."
      heroImage="/images/category/yoga.png"
      heroimage2="/images/bussiness/yoga.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={yogaPostImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919283344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Yoga%20Center."
    />
  );
}