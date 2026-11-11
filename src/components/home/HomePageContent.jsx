import HeaderSection from "@/components/sections/HeaderSection";
import FestivalBannerSection from "@/components/sections/FestivalBannerSection";
// import StatsSection from "@/components/sections/StatsSection"; // "Scale your local presence…" (hidden)
import HomeTools from "@/components/home/HomeTools";
import BusinessTypesSection from "@/components/sections/BusinessTypesSection";
import PopularCitiesSection from "@/components/sections/PopularCitiesSection";
// import ExamplesSection from "@/components/sections/ExamplesSection"; // "Limbu AI Generated Post Examples" (hidden)
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

/**
 * The home page sections. `city` (e.g. "Gurgaon") localises the headlines for
 * the city landing pages at /<city> (see app/[slug]/page.jsx).
 */
export default function HomePageContent({ city = null }) {
  return (
    <div className="min-h-screen bg-white">

      {/* SSR */}
      <HeaderSection />

      {/* Festival creative — apni date window ke bahar khud hide ho jata hai */}
      <FestivalBannerSection />

      {/* SSR — page starts with the app's tiles (home_sections collection) */}
      <HomeTools city={city} />

      {/* Hidden for now: "Scale your local presence with the GMB Automation tool" */}
      {/* <StatsSection /> */}

      {/* SSR */}
      <BusinessTypesSection />

      {/* SSR */}
      <PopularCitiesSection />

      {/* Hidden for now: "Limbu AI Generated Post Examples" */}
      {/* <ExamplesSection /> */}

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
