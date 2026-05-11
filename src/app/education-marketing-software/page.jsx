import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";

export const metadata = {
  title: "AI Marketing Software for Education & Coaching | Limbu.ai",
  description:
    "Automate your institute's marketing, increase student enrollments, and collect 5-star reviews with Limbu AI's smart software for education.",
};

export default function EducationMarketingPage() {
  const benefits = [
    {
      title: "Increase Enrollments",
      description:
        "Automatically collect and showcase 5-star reviews from successful students to attract new admissions effortlessly.",
      icon: "Users",
    },
    {
      title: "Automate Updates & Tips",
      description:
        "Keep your Google profile active with AI-generated study tips, batch announcements, and institute success stories.",
      icon: "BookOpen",
    },
    {
      title: "Protect Your Reputation",
      description:
        "Our Review Shield privately captures negative feedback from parents or students before it goes public, protecting your institute.",
      icon: "ShieldCheck",
    },
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Institute Profile",
      description:
        "Link your Google Business Profile in one click. Our AI audits your ranking for terms like 'Coaching classes near me' and builds a custom strategy.",
      icon: "TrendingUp",
    },
    {
      step: "02",
      title: "AI Generates Educational Content",
      description:
        "Stop stressing about what to post. Limbu AI automatically creates and schedules highly engaging posts about your courses, faculty, and study tips.",
      icon: "BookOpen",
    },
    {
      step: "03",
      title: "Capture Student Reviews",
      description:
        "Students and parents scan your custom Magic QR code at the reception to leave a quick 5-star review after a great session or result.",
      icon: "Star",
    },
    {
      step: "04",
      title: "Smart Review Replies",
      description:
        "Limbu AI drafts and sends professional, personalized replies to every review instantly, boosting your trust signals to Google.",
      icon: "MessageSquare",
    },
    {
      step: "05",
      title: "Watch Admissions Grow",
      description:
        "As your 5-star reviews and daily active posts compound, your institute climbs to the #1 spot on Google Maps, driving consistent local inquiries.",
      icon: "CalendarCheck",
    },
  ];

  const postImages = [
    "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Education_5633d18f.png",
    "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Education_579fcbee.png",
    "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Education_dd28a638.png",
    "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Education_6c3606dd.png",
    "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Education_63de0af5.png",
  ];

  const videoExamples = [
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758899-0-3963c931-8bdc-4c5b-83b7-a45e2f3dee5c-WhatsApp-Video-2026-02-02-at-2.50.11-PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759497-1-dcff2a8b-d608-4fad-8304-dd8f6d132c8f-WhatsApp-Video-2026-02-02-at-2.50.12-PM.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759390-2-bbc0bea6-909e-4566-a417-ba3cd713645e-WhatsApp-Video-2026-02-02-at-2.50.12-PM--2-.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758826-3-9a4c4050-5a50-41b5-9614-7228d1f04c24-WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758630-4-cb36a2d7-1f46-42ba-8852-9a7429d1b3da-WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759013-5-1d0a1d2e-4af6-43b2-9680-a3b730d239ae-WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4",
    "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758921-6-39fd61e5-fad7-492a-9270-80b3f15472f5-WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4",
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
