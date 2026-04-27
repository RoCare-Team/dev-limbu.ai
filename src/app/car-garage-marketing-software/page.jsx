import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Car Garage Marketing Software | Limbu.ai",
  description: "Get more repair jobs, manage mechanic reviews, and boost local SEO for your car garage with Limbu AI.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/car-garage-marketing-software" },
};

export default function CarGarageMarketingPage() {
  const benefits = [
    {
      title: "Attract Local Drivers",
      description: "Rank higher on Google Maps so broken-down drivers find your garage before your competitors.",
      icon: "MapPin",
    },
    {
      title: "Build Mechanic Trust",
      description: "Car repairs require trust. Automatically gather 5-star reviews from happy drivers to prove your reliability.",
      icon: "Wrench",
    },
    {
      title: "Private Dispute Resolution",
      description: "Catch unhappy customers privately before they leave a negative review about a repair job.",
      icon: "ShieldAlert",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Garage Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-intent terms like 'Car mechanic near me' or 'Oil change' and builds a custom growth strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Auto Content",
      description: "Stop stressing about updating your profile. Limbu AI automatically creates posts showing your before-and-after work, seasonal maintenance tips, and available repair services.",
      icon: "PenTool",
    },
    {
      step: "03",
      title: "Capture Drive-Away Reviews",
      description: "Ask the driver to scan your custom Magic QR code on the front desk or their invoice to leave a glowing 5-star review while they are thrilled to have their car back on the road.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, personalized replies to every customer review instantly. It thanks 5-star drivers and politely addresses any 1-star complaints to protect your garage's reputation.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Repair Jobs Explode",
      description: "As your 5-star reviews and weekly active posts compound, your auto repair shop climbs to the #1 spot on Google Maps, driving consistent, high-intent repair calls and walk-ins.",
      icon: "Car",
    },
  ];

  const carGaragePostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488785/Pest_vg1nc6.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488888/Car_nwnbal.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776488980/Car_z8z9pk.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489049/Car_dwk1ze.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776489128/Car_f1zzlk.jpg",
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
        { "@type": "ListItem", position: 2, name: "Car Garage Marketing Software", item: "https://www.limbu.ai/car-garage-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Car Garage Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Get more repair jobs, manage mechanic reviews, and boost local SEO for your car garage with Limbu AI.",
      url: "https://www.limbu.ai/car-garage-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does Limbu AI help Car Garages rank higher on Google?", acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile with service offer posts and instant review replies, boosting your visibility in 'car garage near me' or 'mechanic near me' searches." } },
        { "@type": "Question", name: "Is it safe to connect my car garage's Google account?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use official Google OAuth — we never store passwords and all connections are encrypted with enterprise-grade security." } },
        { "@type": "Question", name: "Will the AI create garage posts and service offers automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI creates engaging service posts, seasonal offers, and professional review replies for your garage automatically, which you can auto-publish or approve." } },
        { "@type": "Question", name: "How does the Magic QR get more reviews for my car garage?", acceptedAnswer: { "@type": "Answer", text: "After a successful repair, customers scan your QR to leave a 5-star Google review. Unhappy customers are routed to a private feedback form to protect your rating." } },
        { "@type": "Question", name: "How quickly will I see more repair jobs from Limbu AI?", acceptedAnswer: { "@type": "Answer", text: "Most car garages see increased profile views and incoming job requests within 30 days of consistent automated activity on their Google Business Profile." } },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Car Garages & Mechanics"
        heroHeading="Drive More Cars into Your Repair Shop"
        heroSubheading="Automate your garage's local marketing. Rank #1 on Google Maps, gather 5-star mechanic reviews, and auto-post service offers."
        heroImage="/images/category/car.png"
        heroimage2="/images/bussiness/engine.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={carGaragePostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Car%20Garage."
      />
    </>
  );
}