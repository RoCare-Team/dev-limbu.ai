import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { TrendingUp, Users, ShieldCheck, BookOpen, CalendarCheck, MessageSquare, Star } from "lucide-react";

export const metadata = {
  title: "AI Marketing Software for Education & Coaching | Limbu.ai",
  description: "Automate your institute's marketing, increase student enrollments, and collect 5-star reviews with Limbu AI's smart software for education.",
};

export default function EducationMarketingPage() {
  const benefits = [
    {
      title: "Increase Enrollments",
      description: "Automatically collect and showcase 5-star reviews from successful students to attract new admissions effortlessly.",
      icon: <Users className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Automate Updates & Tips",
      description: "Keep your Google profile active with AI-generated study tips, batch announcements, and institute success stories.",
      icon: <BookOpen className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Your Reputation",
      description: "Our Review Shield privately captures negative feedback from parents or students before it goes public, protecting your institute.",
      icon: <ShieldCheck className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Institute Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your ranking for terms like 'Coaching classes near me' and builds a custom strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Educational Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about your courses, faculty, and study tips.",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Student Reviews",
      description: "Students and parents scan your custom Magic QR code at the reception to leave a quick 5-star review after a great session or result.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every review instantly, boosting your trust signals to Google.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Admissions Grow",
      description: "As your 5-star reviews and daily active posts compound, your institute climbs to the #1 spot on Google Maps, driving consistent local inquiries.",
      icon: <CalendarCheck className="w-5 h-5" />,
    },
  ];

  const postImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767776297/output_yd9alt.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1767694542/output_n1ahcx.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1764404571/tmpx28dvfi__qxwt1c.jpg",
  ];

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.11+PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/WhatsApp+Video+2026-02-02+at+2.50.12+PM.mp4",
  ];

  return (
    <IndustryLandingTemplate
      industryName="Education & Coaching"
      heroHeading="Grow Your Student Admissions on Autopilot"
      heroSubheading="Stop worrying about local marketing. Use Limbu AI to get more 5-star reviews, auto-publish batch updates, and dominate local searches while you focus on teaching."
      heroImage="/images/category/education.png"
      heroimage2="/images/hero.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={postImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Education/Coaching%20business."
    />
  );
}
