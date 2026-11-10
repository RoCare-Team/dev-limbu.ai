import HeaderSection from "@/components/sections/HeaderSection";
import FestivalBannerSection from "@/components/sections/FestivalBannerSection";
import StatsSection from "@/components/sections/StatsSection";
import HomeTools from "@/components/home/HomeTools";
import BusinessTypesSection from "@/components/sections/BusinessTypesSection";
import PopularCitiesSection from "@/components/sections/PopularCitiesSection";
import ExamplesSection from "@/components/sections/ExamplesSection";
// Hidden for now — uncomment the import and the JSX below to bring back.
// import VideoPricingSection from "@/components/sections/VideoPricingSection"; // "Videos Made With Limbu AI"
// import FeaturesSection from "@/components/sections/FeaturesSection"; // "Built to dominate"
// import ClientGrowthSection from "@/components/sections/ClientGrowthSection"; // "Real User GMB Profile Growth"
import CaseStudySection from "@/components/sections/CaseStudySection";
import AppDownloadSection from "@/components/sections/AppDownloadSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import FAQSection from "@/components/sections/FAQSection";
import FooterSection from "@/components/sections/FooterSection";
import GlobalClientLayer from "@/components/GlobalClientLayer";

// CLIENT COMPONENTS

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* SSR */}
      <HeaderSection />

      {/* Festival creative — apni date window ke bahar khud hide ho jata hai */}
      <FestivalBannerSection />

      {/* SSR — page starts with the app's tiles (home_sections collection) */}
      <HomeTools />

      {/* SSR */}
      <StatsSection />

      {/* SSR */}
      <BusinessTypesSection />

      {/* SSR */}
      <PopularCitiesSection />

      {/* SSR */}
      <ExamplesSection />

      {/* Hidden for now: "Videos Made With Limbu AI" */}
      {/* <VideoPricingSection /> */}

      {/* Hidden for now: "Built to dominate" */}
      {/* <FeaturesSection /> */}

      {/* Hidden for now: "Real User GMB Profile Growth — Last 3 Months" */}
      {/* <ClientGrowthSection /> */}

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
