import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import SchemaMarkup from "@/components/SchemaMarkup";

export const metadata = {
  title: "Pest Control Marketing Software | Limbu.ai",
  description: "Grow your pest control business with automated local SEO, 5-star customer reviews, and smart online presence management.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.limbu.ai/pest-control-marketing-software" },
};

export default function PestControlMarketingPage() {
  const benefits = [
    {
      title: "Be Found First",
      description: "When someone has a pest problem, they search Google immediately. Rank #1 locally to win those urgent calls.",
      icon: "SearchCheck",
    },
    {
      title: "Showcase Your Expertise",
      description: "Auto-publish seasonal pest control tips and safety updates to build trust with local homeowners.",
      icon: "Bug",
    },
    {
      title: "Collect Trust Signals",
      description: "Prompt satisfied customers to leave glowing 5-star reviews right after a successful treatment.",
      icon: "MessageCircle",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Business Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your current local ranking for urgent terms like 'Pest Control Near Me' and builds a custom growth strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Seasonal Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about seasonal threats like termites, mosquitoes, and rodents.",
      icon: "Bug",
    },
    {
      step: "03",
      title: "Capture Post-Service Reviews",
      description: "Your technicians simply ask the homeowner to scan your custom Magic QR code on their phone or invoice to leave a quick 5-star review while they are relieved the pests are gone.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every customer review instantly, showing potential clients that you care about your service quality.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Emergency Calls Explode",
      description: "As your 5-star reviews and weekly active posts compound, your pest control company climbs to the #1 spot on Google Maps, driving consistent, high-intent emergency calls.",
      icon: "PhoneCall",
    },
  ];

  const pestPostImages = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777964613741-0-bf52f23f-993f-4101-821c-8b906bb53311-Pest_n80zyb.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777964614685-1-626548a9-b1fe-4717-910b-b7bae33e08fd-Pest_hzlpem.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777964612938-2-49042e46-5cde-4ce5-8ec1-b3c2214f7e67-Pest_ympnyn.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777964616118-3-50438bb4-048f-416b-b6e6-098054492f45-Pest_ltkkes.jpg",
    "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777964613552-4-6871f2f6-4cc1-47a9-b22c-99521dcf65d0-Pest_q7ahlb.jpg"
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
        { "@type": "ListItem", position: 2, name: "Pest Control Marketing Software", item: "https://www.limbu.ai/pest-control-marketing-software" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Pest Control Marketing Software",
      serviceType: "AI Marketing Automation",
      description: "Grow your pest control business with automated local SEO, 5-star customer reviews, and smart online presence management.",
      url: "https://www.limbu.ai/pest-control-marketing-software",
      provider: { "@type": "Organization", name: "Limbu.ai", url: "https://www.limbu.ai" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does Limbu AI help Pest Control businesses rank higher on Google?",
          acceptedAnswer: { "@type": "Answer", text: "Limbu AI automates your Google Business Profile by consistently posting seasonal pest tips and replying to reviews instantly, boosting your visibility in urgent local searches like 'pest control near me'." },
        },
        {
          "@type": "Question",
          name: "Is it safe to connect my pest control business Google account?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Limbu AI uses official, secure OAuth interactions directly approved by Google. We never store your passwords, and our connection is encrypted with enterprise-grade security." },
        },
        {
          "@type": "Question",
          name: "Will the AI create pest control content and posts automatically?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Our AI creates seasonal pest control tips, promotional posts, and professional review replies automatically. You can auto-publish or hold for your approval." },
        },
        {
          "@type": "Question",
          name: "How does the Magic QR code get more 5-star reviews for my pest control business?",
          acceptedAnswer: { "@type": "Answer", text: "Your technicians ask the homeowner to scan your custom Magic QR code after a successful treatment. Happy customers go directly to Google review; dissatisfied ones go to a private feedback form." },
        },
        {
          "@type": "Question",
          name: "How quickly will I get more pest control calls from Limbu AI?",
          acceptedAnswer: { "@type": "Answer", text: "Most pest control businesses see increased profile views and incoming calls within the first 30 days of consistent, automated activity on their Google Business Profile." },
        },
      ],
    },
  ];

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      <IndustryLandingTemplate
        industryName="Pest Control Services"
        heroHeading="Get More Local Calls for Pest Extermination"
        heroSubheading="Dominate your service area. We automate your online reputation so you become the most trusted pest control service in town."
        heroImage="/images/category/pest.png"
        heroimage2="/images/bussiness/pest.png"
        benefitsList={benefits}
        howItWorks={howItWorksSteps}
        postImages={pestPostImages}
        videoExamples={videoExamples}
        whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Pest%20Control%20business."
      />
    </>
  );
}