import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";
import { Plane, Map, Camera, TrendingUp, Compass, Star, MessageSquare, Ticket } from "lucide-react";

export const metadata = {
  title: "Tour & Travel Marketing Software | Limbu.ai",
  description: "Increase tour bookings, auto-publish travel content, and collect glowing vacation reviews with Limbu AI.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/tour-travel-marketing-software" },
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

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Agency Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for terms like 'Travel agency near me' or 'Tour packages' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Wanderlust Content",
      description: "Stop stressing about social media. Limbu AI automatically creates stunning posts about upcoming group tours, flight deals, and exotic vacation destinations.",
      icon: <Compass className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Post-Trip Reviews",
      description: "Send your clients a link to your custom Magic QR code right as they return from their trip to capture glowing 5-star reviews while their vacation memories are fresh.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts enthusiastic, personalized replies to every traveler review instantly. It thanks them for booking with you and privately flags any negative trip feedback.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Bookings Soar",
      description: "As your 5-star reviews and weekly active destination posts compound, your travel agency climbs to the #1 spot on Google Maps, driving consistent high-ticket vacation bookings.",
      icon: <Ticket className="w-5 h-5" />,
    },
  ];

  const tourPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489442/tour_and_travel_aafdsw.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489522/tour_and_travel_rqdec3.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489655/tour_and_travel_a3wlx9.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489697/tour_and_travel_ehuedu.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489813/tour_and_travel_n7igkj.jpg",
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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
        { "@type": "ListItem", position: 2, name: "Tour & Travel Marketing Software", item: "https://www.limbu.ai/tour-travel-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Tour & Travel Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Increase tour bookings, auto-publish travel content, and collect glowing vacation reviews with Limbu AI.",
      url: "https://www.limbu.ai/tour-travel-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does Limbu AI help Tour & Travel agencies rank higher on Google?", acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile with destination posts and instant review replies, boosting your visibility in 'travel agency near me' searches." } },
        { "@type": "Question", name: "Is it safe to connect my travel agency's Google account?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use official Google OAuth — we never store passwords and all connections are encrypted with enterprise-grade security." } },
        { "@type": "Question", name: "Will the AI create travel content and tour posts automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI creates captivating destination posts, package promotions, and professional review replies automatically, which you can auto-publish or approve first." } },
        { "@type": "Question", name: "How does the Magic QR help my travel agency get more reviews?", acceptedAnswer: { "@type": "Answer", text: "After returning from a trip, clients scan your QR to leave a glowing Google review. Any complaints are routed to a private feedback form to protect your rating." } },
        { "@type": "Question", name: "How quickly will I see more tour bookings?", acceptedAnswer: { "@type": "Answer", text: "Most travel agencies see increased profile views and booking enquiries within 30 days of consistent automated activity on their Google Business Profile." } },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Tours & Travels"
        heroHeading="Turn Wanderlust into Confirmed Travel Bookings"
        heroSubheading="You plan the perfect trips, we handle the marketing. Automate your agency's reviews, social posts, and local SEO."
        heroImage="/images/category/tour.png"
        heroimage2="/images/bussiness/tour.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={tourPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Travel%20Agency."
      />
    </>
  );
}