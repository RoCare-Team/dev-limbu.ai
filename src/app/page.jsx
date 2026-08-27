import HeaderSection from "@/components/sections/HeaderSection";
import FestivalBannerSection from "@/components/sections/FestivalBannerSection";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import BusinessTypesSection from "@/components/sections/BusinessTypesSection";
import PopularCitiesSection from "@/components/sections/PopularCitiesSection";
import ExamplesSection from "@/components/sections/ExamplesSection";
import VideoExamplesSection from "@/components/sections/VideoExamplesSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ClientGrowthSection from "@/components/sections/ClientGrowthSection";
import CaseStudySection from "@/components/sections/CaseStudySection";
import AppDownloadSection from "@/components/sections/AppDownloadSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import FAQSection from "@/components/sections/FAQSection";
import FooterSection from "@/components/sections/FooterSection";
import GlobalClientLayer from "@/components/GlobalClientLayer";

// CLIENT COMPONENTS

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50">

      {/* SSR */}
      <HeaderSection />

      {/* Festival creative — apni date window ke bahar khud hide ho jata hai */}
      <FestivalBannerSection />

      {/* SSR */}
      <HeroSection />

      {/* SSR */}
      <StatsSection />

      {/* SSR */}
      <BusinessTypesSection />

      {/* SSR */}
      <PopularCitiesSection />

      {/* SSR */}
      <ExamplesSection />

      {/* SSR */}
      <VideoExamplesSection />

      {/* SSR */}
      <FeaturesSection />

      {/* SSR */}
      <ClientGrowthSection />

      {/* SSR */}
      <CaseStudySection />

      {/* SSR */}
      <AppDownloadSection />

      {/* SSR */}
      <ComparisonSection />

      {/* SSR */}
      <FAQSection />

      {/* SSR */}
      <FooterSection />


      <GlobalClientLayer/>
    </div>
  );
}