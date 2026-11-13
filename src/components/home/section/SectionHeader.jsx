import Link from "next/link";
import AuthLink from "../../AuthLink";
import { TileIcon } from "../toolIcons";

/**
 * Section pill + headline (dark title, yellow highlight) + intro text.
 * `as` is "h1" for the top section. `hero` gets the larger first-screen type.
 * `link` (from sectionLink) makes the headline open the section's own page.
 */
export default function SectionHeader({ section, copy, as: Heading = "h2", hero = false, link }) {
  const LinkTag = link?.login ? AuthLink : Link;
  const headline = (
    <>
      {/* Hero: title balanced on its own lines (no lone word), highlight below */}
      <span className={hero ? "block [text-wrap:balance]" : ""}>{copy.title}</span>{" "}
      <span className="relative inline-block text-[#eab308] sm:whitespace-nowrap">
        {copy.highlight}
        <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-[#facc15]/70" />
      </span>
    </>
  );

  return (
    <>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
        <TileIcon icon={section.icon} size={14} />
        {section.title}
      </span>

      <Heading
        className="mt-4 font-black leading-[1.06] tracking-tight text-slate-900 sm:mt-5"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: hero ? "clamp(2.25rem, 4vw, 3.5rem)" : "clamp(2rem, 3.6vw, 3.1rem)",
        }}
      >
        {link?.dedicated ? (
          <LinkTag href={link.href} className="transition-colors hover:text-slate-700">
            {headline}
          </LinkTag>
        ) : (
          headline
        )}
      </Heading>

      {copy.text && (
        <p className="mt-4 max-w-[54ch] text-base font-medium leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
          {copy.text}
        </p>
      )}
    </>
  );
}
