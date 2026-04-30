import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";

export const metadata = {
  title: "AI Marketing Software for Real Estate Agents | Limbu.ai",
  description: "Automate your real estate marketing, attract more property buyers, and collect 5-star client reviews with Limbu AI's smart software.",
};

export default function RealEstateMarketingPage() {
  const benefits = [
    {
      title: "Attract More Property Buyers",
      description: "Automatically collect and showcase 5-star reviews from happy home buyers to build immense trust and attract new leads.",
      icon: "Users",
    },
    {
      title: "Automate Property Posts",
      description: "Keep your Google profile active with AI-generated property listings, market trends, and open house announcements.",
      icon: "Home",
    },
    {
      title: "Protect Your Agency Rating",
      description: "Our Review Shield privately captures negative feedback before it goes public, protecting your real estate agency's reputation.",
      icon: "ShieldCheck",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Agency Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your current local ranking for terms like 'Real Estate Agent near me' and builds a custom strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Real Estate Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about the local housing market and your services.",
      icon: "Home",
    },
    {
      step: "03",
      title: "Capture Client Reviews",
      description: "Clients scan your custom Magic QR code right after closing a deal to leave a quick 5-star review while their excitement is at its peak.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every client review instantly, showing Google you are a highly engaged agent.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Your Leads Grow",
      description: "As your 5-star reviews and daily active posts compound, your agency climbs to the #1 spot on Google Maps, driving consistent high-intent property leads.",
      icon: "CalendarCheck",
    },
  ];

  const postImages = [
    "https://limbuai.s3.amazonaws.com/ad-images/ai/water_purifier_db9e001f.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T082708Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=50f7112bf2a50391176b74bca9ff55fc5c610ddbbdc78e8032dc8fe03bf80969",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/water_purifier_8d0ec24d.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T083130Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=f487c741557460ff9620cafc56a300c3afa82bd68b8a5a29aba9b6b518349f57",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/water_purifier_a0fd222b.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T083029Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=debb2c1cceb6693476471f4e1c4ff59efa9d2b9270bb7729c5aa14578ab487fa",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/emergency_plumber_c9610324.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T082905Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98ded8aac7831171e35868158a6d94ef31c5fd7b929a31119ed4c3f113acf281",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/emergency_plumber_bcd35900.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T083258Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=03955b63f736bf6437b6444aa1bb4d551995f4fc418996014ba108f23b8b82b7"
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
      industryName="Real Estate Agents"
      heroHeading="Grow Your Real Estate Leads on Autopilot"
      heroSubheading="Stop worrying about marketing. Use Limbu AI to get more 5-star client reviews, auto-publish property posts, and dominate local searches while you focus on closing deals."
      heroImage="/images/category/realestate.png"
      heroimage2="/images/bussiness/real.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={postImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Real%20Estate%20business."
    />
  );
}
