import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";
import { Stethoscope, CalendarCheck, ShieldCheck, TrendingUp, Activity, Star, MessageSquare, HeartPulse } from "lucide-react";

export const metadata = {
  title: "Clinic Marketing Software for Doctors | Limbu.ai",
  description: "Boost your clinic's local SEO, manage patient reviews, and grow your medical practice with Limbu AI's automated marketing tools.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/clinic-marketing-software" },
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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.limbu.ai" },
        { "@type": "ListItem", position: 2, name: "Clinic Marketing Software", item: "https://www.limbu.ai/clinic-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Clinic & Doctor Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Boost your clinic's local SEO, manage patient reviews, and grow your medical practice with Limbu AI's automated marketing tools.",
      url: "https://www.limbu.ai/clinic-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Limbu AI help Doctors & Clinics rank higher on Google?",
          acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile by consistently posting health updates and replying to patient reviews instantly — two major Google ranking factors — boosting your visibility in local 'doctor near me' or 'clinic near me' searches." },
        },
        {
          "@type": "Question",
          name: "Is it safe to connect my clinic's Google account to Limbu AI?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI uses official, secure OAuth interactions directly approved by Google. We never store your passwords, and our connection is encrypted with enterprise-grade security." },
        },
        {
          "@type": "Question",
          name: "Does the AI create health content and clinic posts automatically?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Our generative AI creates compliant, engaging health tips and clinic posts, and drafts professional replies to patient reviews. You can auto-publish or hold for your approval." },
        },
        {
          "@type": "Question",
          name: "How does the Magic QR code collect more patient reviews?",
          acceptedAnswer: { "@type": "Answer", text: "The Magic QR routes satisfied patients directly to your Google review page after their appointment. If a patient had a concern, it routes them to a private feedback form instead of public Google." },
        },
        {
          "@type": "Question",
          name: "How quickly will I see more patient bookings?",
          acceptedAnswer: { "@type": "Answer", text: "Most clinics see increased profile views and enquiries within the first 30 days of consistent, automated activity on their Google Business Profile." },
        },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
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
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Clinic."
      />
    </>
  );
}