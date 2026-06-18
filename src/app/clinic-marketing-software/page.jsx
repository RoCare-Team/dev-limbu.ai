import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Clinic Marketing Software for Doctors | Limbu.ai",
  description: "Boost your clinic's local SEO, manage patient reviews, and grow your medical practice with Limbu AI's automated marketing tools.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai/clinic-marketing-software" },
};

export default function ClinicMarketingPage() {
  const benefits = [
    {
      title: "Attract More Patients",
      description: "Build trust by automatically collecting 5-star reviews from satisfied patients right after their appointment.",
      icon: "Stethoscope",
    },
    {
      title: "Save Time on Socials",
      description: "Auto-publish health tips, clinic updates, and service information without spending hours online.",
      icon: "CalendarCheck",
    },
    {
      title: "Protect Patient Trust",
      description: "Handle patient complaints privately through our Smart Review Shield, keeping your online rating spotless.",
      icon: "ShieldCheck",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Clinic Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for terms like 'Best pediatrician near me' or 'Urgent care clinic' and builds a custom growth strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Health Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging, compliant posts about seasonal health tips, new services, and clinic hours.",
      icon: "Activity",
    },
    {
      step: "03",
      title: "Capture Post-Visit Reviews",
      description: "Patients scan your custom Magic QR code at the reception desk to leave a quick 5-star review while they are feeling relieved and cared for after their appointment.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts HIPAA-compliant, professional replies to every patient review instantly, thanking them for their trust and addressing any concerns privately.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Patient Bookings Grow",
      description: "As your 5-star reviews and weekly active posts compound, your clinic climbs to the #1 spot on Google Maps, driving consistent, high-intent appointment bookings.",
      icon: "HeartPulse",
    },
  ];

  const clinicPostImages = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963946872-0-37f90c7a-2ae3-4473-9e1c-e3ac51957cd7-Hospital_drvjed.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963944234-1-d33522e1-15d3-49dd-bba6-8722a77ec44f-Hospital_vhubo2.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963940628-2-f8647a16-5a1c-4f13-bf48-f48def0e6682-Hospital_fdy4x9.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963944557-3-73418cb4-6430-4ad6-91a2-4cca0fd88503-Doctor_ny3rj5.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963944155-4-b33e1db1-dca9-4ac6-ae17-006ec548a29d-Hospital_llmrll.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963948898-5-17b5fd8f-11cd-45cd-a227-313035741bfe-Hospital_v9hk1m.jpg"
  ]

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758899-0-3963c931-8bdc-4c5b-83b7-a45e2f3dee5c-WhatsApp-Video-2026-02-02-at-2.50.11-PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759497-1-dcff2a8b-d608-4fad-8304-dd8f6d132c8f-WhatsApp-Video-2026-02-02-at-2.50.12-PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759390-2-bbc0bea6-909e-4566-a417-ba3cd713645e-WhatsApp-Video-2026-02-02-at-2.50.12-PM--2-.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758826-3-9a4c4050-5a50-41b5-9614-7228d1f04c24-WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758630-4-cb36a2d7-1f46-42ba-8852-9a7429d1b3da-WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759013-5-1d0a1d2e-4af6-43b2-9680-a3b730d239ae-WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758921-6-39fd61e5-fad7-492a-9270-80b3f15472f5-WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4"
  ]

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
        whatsappLink="https://wa.me/917065178662?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Clinic."
      />
    </>
  );
}