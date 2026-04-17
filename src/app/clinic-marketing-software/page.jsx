import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Stethoscope, CalendarCheck, ShieldCheck, TrendingUp, Activity, Star, MessageSquare, HeartPulse } from "lucide-react";

export const metadata = {
  title: "AI Marketing Software for Doctors & Clinics | Limbu.ai",
  description: "Boost your clinic's local SEO, manage patient reviews, and grow your medical practice with Limbu AI.",
};

export default function ClinicMarketingPage() {
  const benefits = [
    {
      title: "Attract More Patients",
      description: "Build trust by automatically collecting 5-star reviews from satisfied patients right after their appointment.",
      icon: <Stethoscope className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Save Time on Socials",
      description: "Auto-publish health tips, clinic updates, and service information without spending hours online.",
      icon: <CalendarCheck className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Patient Trust",
      description: "Handle patient complaints privately through our Smart Review Shield, keeping your online rating spotless.",
      icon: <ShieldCheck className="w-6 h-6 text-lemon-hover" />
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Clinic Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for terms like 'Best pediatrician near me' or 'Urgent care clinic' and builds a custom growth strategy.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      step: "02",
      title: "AI Generates Health Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging, compliant posts about seasonal health tips, new services, and clinic hours.",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Capture Post-Visit Reviews",
      description: "Patients scan your custom Magic QR code at the reception desk to leave a quick 5-star review while they are feeling relieved and cared for after their appointment.",
      icon: <Star className="w-5 h-5 fill-current text-lemon-hover" />,
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts HIPAA-compliant, professional replies to every patient review instantly, thanking them for their trust and addressing any concerns privately.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Watch Patient Bookings Grow",
      description: "As your 5-star reviews and weekly active posts compound, your clinic climbs to the #1 spot on Google Maps, driving consistent, high-intent appointment bookings.",
      icon: <HeartPulse className="w-5 h-5" />,
    },
  ];

  const clinicPostImages = [
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776424977/Hospital_drvjed.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425202/Hospital_vhubo2.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425407/Hospital_fdy4x9.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425505/Doctor_ny3rj5.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425601/Hospital_llmrll.jpg",
    "https://res.cloudinary.com/dsnuzit6o/image/upload/v1776425775/Hospital_v9hk1m.jpg"
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
      industryName="Doctors & Clinics"
      heroHeading="Get More Patients with Top Local Rankings"
      heroSubheading="Focus on your patients. Let Limbu AI handle your clinic's reviews, local SEO, and daily online updates."
      heroImage="/images/category/doctor.png"
      heroimage2="/images/bussiness/hospital.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={clinicPostImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919283344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Clinic."
    />
  );
}