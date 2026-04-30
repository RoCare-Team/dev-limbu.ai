import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";

export const metadata = {
  title: "AI Marketing Software for Education & Coaching | Limbu.ai",
  description: "Automate your institute's marketing, increase student enrollments, and collect 5-star reviews with Limbu AI's smart software for education.",
};

export default function EducationMarketingPage() {
  const benefits = [
    {
      title: "Increase Enrollments",
      description: "Automatically collect and showcase 5-star reviews from successful students to attract new admissions effortlessly.",
      icon: "Users",
    },
    {
      title: "Automate Updates & Tips",
      description: "Keep your Google profile active with AI-generated study tips, batch announcements, and institute success stories.",
      icon: "BookOpen",
    },
    {
      title: "Protect Your Reputation",
      description: "Our Review Shield privately captures negative feedback from parents or students before it goes public, protecting your institute.",
      icon: "ShieldCheck",
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Institute Profile",
      description: "Link your Google Business Profile in one click. Our AI audits your ranking for terms like 'Coaching classes near me' and builds a custom strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Educational Content",
      description: "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about your courses, faculty, and study tips.",
      icon: "BookOpen",
    },
    {
      step: "03",
      title: "Capture Student Reviews",
      description: "Students and parents scan your custom Magic QR code at the reception to leave a quick 5-star review after a great session or result.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description: "Limbu AI drafts and sends professional, personalized replies to every review instantly, boosting your trust signals to Google.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Admissions Grow",
      description: "As your 5-star reviews and daily active posts compound, your institute climbs to the #1 spot on Google Maps, driving consistent local inquiries.",
      icon: "CalendarCheck",
    },
  ];

  const postImages = [
    "https://limbuai.s3.amazonaws.com/ad-images/ai/emergency_plumber_938292d4.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T084124Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=3fcb68de006e2075a83048e0f991ae5e2161030206237228d2680f80052825e7",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/water_purifier_8a19a4f3.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T084317Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=a8bc30ffe8e85bb8ab939ff7f275efa91142a6c604fa53c7bd81fc89f33b0ded",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/water_purifier_fa9ba0f8.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T084545Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=264df58ce4ca338be034e0272352be3ea492789f91d996f75c322374504a0d14",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/emergency_plumber_b058f32e.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T084658Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=76b1312e47197b8b1a53073d574c0784efe051e3ca78ec41a4222b91450bfa37",
    "https://limbuai.s3.amazonaws.com/ad-images/ai/emergency_plumber_acc36bff.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAS5VW5PDAIX4VYM2R%2F20260427%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260427T090849Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=17afa1e39e3474774482f7ce0be5201e37f9fa822837b6a1e18a012136660354"
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
      heroimage2="/images/bussiness/coaching.png"
      benefitsList={benefits}
      howItWorks={howItWorksSteps}
      postImages={postImages}
      videoExamples={videoExamples}
      whatsappLink="https://wa.me/919289344726?text=Hi%20Limbu%20AI,%20I%20want%20to%20grow%20my%20Education/Coaching%20business."
    />
  );
}
