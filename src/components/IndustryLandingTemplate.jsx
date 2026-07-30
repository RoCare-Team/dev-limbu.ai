/**
 * Ye template pehle `"use client"` tha, isliye hero, ROI, benefits, timeline,
 * comparison, CTA aur stats — saari static sections client bundle me jaakar
 * hydrate hoti thi, jabki inme ek bhi hook ya handler nahi hai. Wahi TBT khaa
 * raha tha.
 *
 * Ab ye server component hai. Jinhe interactivity chahiye (ImageGallery,
 * VideoGallery, FAQ, Navbar, Footer) unke paas apna `"use client"` pehle se hai,
 * to woh waise hi kaam karti hain.
 */
import React from "react";
import { Star, Zap, Search, Sparkles, MessageSquare } from "lucide-react";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "./sections/HeaderSection";
import StatsSection from "@/components/sections/StatsSection";
import IndustryFAQSection from "@/components/sections/industry/IndustryFAQSection";
import ExamplesSection from "@/components/sections/ExamplesSection";
import IndustryComparisonSection from "@/components/sections/industry/IndustryComparisonSection";
import VideoExamplesSection from "@/components/sections/VideoExamplesSection";

// Import pure specific sections
import IndustryHeroSection from "@/components/sections/industry/IndustryHeroSection";
import IndustryROISection from "@/components/sections/industry/IndustryROISection";
import IndustryBenefitsSection from "@/components/sections/industry/IndustryBenefitsSection";
import IndustryTimelineSection from "@/components/sections/industry/IndustryTimelineSection";
import IndustryCTASection from "@/components/sections/industry/IndustryCTASection";

export default function IndustryLandingTemplate({
  industryName,
  heroHeading,
  heroSubheading,
  heroImage,
  heroimage2,
  benefitsList,
  whatsappLink = "https://wa.me/917065178662",
  howItWorks,
  oldWayList,
  limbuWayList,
  faqList,
  postImages = [],
  videoExamples = [],
}) {
  // Generate dynamic steps if no custom howItWorks is provided
  const displaySteps = howItWorks || [
    {
      step: "01",
      title: "1-Click AI Connection",
      description: `Connect your Google Business Profile instantly. Our AI audits your current ranking and builds a custom optimization strategy for your ${industryName} business.`,
      icon: <Zap className="w-5 h-5" />,
    },
    {
      step: "02",
      title: `Dominate '${industryName} Near Me'`,
      description: `We automatically optimize your profile with high-ranking keywords so you show up #1 when locals search for ${industryName} services in your area.`,
      icon: <Search className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Automated Weekly Updates",
      description: `Our AI generates and publishes fresh posts, photos, and offers to keep your ${industryName} profile active and engaging for new customers 24/7.`,
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      step: "04",
      title: "Capture 5-Star Reviews",
      description: `Your ${industryName} customers scan your custom Magic QR code in-store, making it frictionless for them to leave a 5-star review instantly.`,
      icon: <Star className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Instant AI Review Replies",
      description: `Limbu AI replies to every review instantly. This signals relevance to Google, boosting your ${industryName} SEO and repeating the growth loop.`,
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white min-h-screen font-inter overflow-x-hidden selection:bg-lemon-glow selection:text-black">
      <Navbar />

      <main className="pt-8 lg:pt-12">
        <IndustryHeroSection
          industryName={industryName}
          heroHeading={heroHeading}
          heroSubheading={heroSubheading}
          whatsappLink={whatsappLink}
          heroImage={heroImage}
        />

        <IndustryROISection
          industryName={industryName}
          heroimage2={heroimage2}
        />

        <ExamplesSection postImages={postImages} />

        <VideoExamplesSection videoExamples={videoExamples} />

        <div className="py-2">
          <StatsSection />
        </div>

        <IndustryBenefitsSection
          industryName={industryName}
          benefitsList={benefitsList}
        />

        <IndustryTimelineSection
          industryName={industryName}
          displaySteps={displaySteps}
        />

        <IndustryComparisonSection
          industryName={industryName}
          oldWayList={oldWayList}
          limbuWayList={limbuWayList}
        />

        <IndustryFAQSection industryName={industryName}
          faqList={faqList}
        />

        <IndustryCTASection
          industryName={industryName}
          whatsappLink={whatsappLink}
        />
      </main>

      {/* ImageModal yahan se hata diya: iski state kabhi set hi nahi hoti thi
          (ImageGallery apna modal khud manage karta hai), to ye dead code tha. */}
      <FooterSection />
    </div>
  );
}

