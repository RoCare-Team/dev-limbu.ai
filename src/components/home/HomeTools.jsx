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
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-16 pt-8 md:px-10 lg:pt-10">
        {sections.map((section, i) => (
          <ToolSection key={section.key} section={section} index={i} city={city} />
        ))}
      </div>
    </div>
  );
}
