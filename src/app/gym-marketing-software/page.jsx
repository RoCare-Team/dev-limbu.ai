import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";
import { TrendingUp, Users, ShieldCheck, Dumbbell, CalendarCheck, MessageSquare, Star } from "lucide-react";

export const metadata = {
  title: "Gym Marketing Software & Local SEO | Limbu.ai",
  description: "Automate gym marketing, increase memberships, and collect 5-star reviews with Limbu AI's smart software for fitness centres.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/gym-marketing-software" },
};

export default function GymMarketingPage() {
  const benefits = [
    {
      title: "Get More Members",
      description: "Automatically collect and showcase 5-star reviews from happy gym members to attract new signups effortlessly.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automate Workout Posts",
      description: "Keep your Google profile active with AI-generated workout tips, class schedules, and motivational posts.",
      icon: <Dumbbell className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Your Rating",
      description: "Our Review Shield privately captures negative feedback before it goes public, protecting your gym's reputation.",
      icon: <ShieldCheck className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Gym Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your current local ranking for terms like 'Gym near me' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Fitness Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about your equipment, personal trainers, and fitness tips.",
      icon: <Dumbbell className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Post-Workout Reviews",
      description: "Members scan your custom Magic QR code at the front desk or water station to leave a quick 5-star review while their post-workout endorphins are high.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every member review instantly, boosting your engagement signals to Google.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Memberships Grow",
      description: "As your 5-star reviews and daily active posts compound, your gym climbs to the #1 spot on Google Maps, driving consistent daily foot traffic.",
      icon: <CalendarCheck className="w-5 h-5" />,
    },
  ];

  const gymPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776424189/gym_nera_me_wyyfyp.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776424657/gym_nera_me_rpksi5.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776424784/gym_nera_me_ryptap.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425014/gym_nera_me_uwnhqi.jpg"
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
        { "@type": "ListItem", position: 2, name: "Gym Marketing Software", item: "https://www.limbu.ai/gym-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Gym Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Automate gym marketing, increase memberships, and collect 5-star reviews with Limbu AI's smart software for fitness centres.",
      url: "https://www.limbu.ai/gym-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Limbu AI help Gyms & Fitness Centres rank higher on Google?",
          acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile by consistently posting updates and replying to reviews instantly — two major Google ranking factors — boosting your visibility in local 'gym near me' searches." },
        },
        {
          "@type": "Question",
          name: "Is it safe to connect my Google account to Limbu AI?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI uses official, secure OAuth interactions directly approved by Google. We never store your passwords, and our connection is encrypted with enterprise-grade security." },
        },
        {
          "@type": "Question",
          name: "Does the AI write gym posts for me automatically?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Our generative AI creates highly engaging, gym-specific posts, suggests hashtags, and drafts professional review replies. You can set it to auto-publish or hold for your approval." },
        },
        {
          "@type": "Question",
          name: "How does the Magic QR code get more 5-star reviews for my gym?",
          acceptedAnswer: { "@type": "Answer", text: "The Magic QR routes happy gym members directly to your Google review page, making it frictionless to leave 5 stars. If a member had a bad experience, it routes them to a private feedback form instead." },
        },
        {
          "@type": "Question",
          name: "How long before I see more gym memberships from Limbu AI?",
          acceptedAnswer: { "@type": "Answer", text: "While local SEO is an ongoing strategy, our users typically see increased profile views and more enquiries within the first 30 days of consistent, automated activity." },
        },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Gyms & Fitness Centres"
        heroHeading="Grow Your Gym Memberships on Autopilot"
        heroSubheading="Stop worrying about marketing. Use Limbu AI to get more 5-star reviews, auto-publish workout posts, and dominate local searches while you focus on training."
        heroImage="/images/category/jim.png"
        heroimage2="/images/bussiness/gym.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={gymPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Gym%20business."
      />
    </>
  );
}
