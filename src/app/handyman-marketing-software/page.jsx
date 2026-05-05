import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Handyman Marketing Software | Limbu.ai",
  description: "Get more local repair jobs, manage service reviews, and boost your handyman business with Limbu AI.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/handyman-marketing-software" },
};

export default function HandymanMarketingPage() {
  const benefits = [
    {
      title: "Win Local Jobs",
      description: "Rank at the top of Google Maps so homeowners call you first for emergency fixes and renovations.",
      icon: "MapPin",
    },
    {
      title: "Showcase Your Work",
      description: "Automatically post before-and-after photos of your repair jobs to prove your skills online.",
      icon: "Hammer",
    },
    {
      title: "Collect Trust Proof",
      description: "Ask clients to scan your QR code right after you finish a job to instantly gather 5-star reviews.",
      icon: "CheckCircle",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Handyman Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your local ranking for high-intent terms like 'Handyman near me' or 'Emergency repair services'.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Service Content",
      description: "Stop stressing about updating your profile. Limbu AI automatically creates posts showing your before-and-after work, seasonal home tips, and available services.",
      icon: "Wrench",
    },
    {
      step: "03",
      title: "Capture On-Site Reviews",
      description: "Ask the homeowner to scan your custom Magic QR code right after you finish fixing their issue. Gather a glowing 5-star review while they are thrilled with the result.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts professional, personalized replies to every customer review instantly. It thanks 5-star clients and politely addresses any 1-star complaints to protect your reputation.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Emergency Calls Explode",
      description: "As your 5-star reviews and weekly active posts compound, your handyman business climbs to the #1 spot on Google Maps, driving consistent, high-intent service calls.",
      icon: "PhoneCall",
    },
  ];

  const handymanPostImages = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777965317637-0-b15af927-e6fe-48d6-9fc2-dd2adeaafa97-tour_and_travel_fnieho.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777965317188-1-33cc5209-6d1f-4ebb-bb71-e0caf7517d6c-emergency_plumber_ye6glg.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777965317801-2-fc156e9a-2d53-40c3-a4f1-a2aab67ad79e-emergency_plumber_iqvnpu.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777965317813-3-deaaa533-f151-408c-87f8-c77eb9154dbb-emergency_plumber_rlibcn.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777965319039-4-21dcffc1-0204-4d67-8b1f-659c5be596ac-emergency_plumber_jdudlw.jpg"
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
        { "@type": "ListItem", position: 2, name: "Handyman Marketing Software", item: "https://www.limbu.ai/handyman-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Handyman Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Get more local repair jobs, manage service reviews, and boost your handyman business with Limbu AI.",
      url: "https://www.limbu.ai/handyman-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does Limbu AI help Handyman Services rank higher on Google?", acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile with service update posts and instant review replies, boosting your visibility in 'handyman near me' searches." } },
        { "@type": "Question", name: "Is it safe to connect my handyman business Google account?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use official Google OAuth — we never store passwords and all connections are encrypted with enterprise-grade security." } },
        { "@type": "Question", name: "Will the AI create handyman posts and offers automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI creates engaging service posts, seasonal offers, and professional review replies for your handyman business, which you can auto-publish or approve." } },
        { "@type": "Question", name: "How does the Magic QR help get more reviews for my handyman business?", acceptedAnswer: { "@type": "Answer", text: "After completing a job, ask the homeowner to scan your QR to instantly leave a 5-star Google review. Unhappy clients are routed to a private feedback form." } },
        { "@type": "Question", name: "How quickly will I see more handyman job calls?", acceptedAnswer: { "@type": "Answer", text: "Most handyman businesses see increased profile views and incoming job calls within 30 days of consistent automated activity on their Google Business Profile." } },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Handyman Services"
        heroHeading="Get More Calls for Local Repair Jobs"
        heroSubheading="Stop relying on word-of-mouth alone. Automate your local SEO, gather 5-star reviews, and become the most trusted handyman in town."
        heroImage="/images/category/handyman.png"
        heroimage2="/images/bussiness/mannubhai.jpeg"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={handymanPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Handyman%20business."
      />
    </>
  );
}