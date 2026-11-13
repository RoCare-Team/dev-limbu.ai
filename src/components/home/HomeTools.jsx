import ToolSection from "./ToolSection";
import { getHomeSectionsForWeb } from "@/lib/homeSections/web";

/**
 * Top of the home page: every tool section, each with its own hero-style
 * headline — the same data the mobile app gets from /api/home-sections, so
 * admin changes show on both. The first section carries the H1 and signup buttons.
 */
export default async function HomeTools({ city = null }) {
  const sections = await getHomeSectionsForWeb();

  return (
    <div id="all-tools" className="w-full bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 pb-12 pt-3 sm:gap-8 sm:px-6 sm:pb-16 md:px-10 lg:pt-4">
        {sections.map((section, i) => (
          <ToolSection key={section.key} section={section} index={i} city={city} />
        ))}
      </div>
    </div>
  );
}
