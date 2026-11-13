import SectionArt from "./SectionArt";
import { ToolCard } from "./ToolCard";
import OfferToolGrid from "./OfferToolGrid";
import ToolGrid from "./ToolGrid";
import WalletTopup from "./WalletTopup";
import { LeadButton, LeadToolGrid } from "../leads/LeadTriggers";
import { copyFor } from "./sectionCopy";
import SectionHeader from "./section/SectionHeader";
import StepList from "./section/StepList";
import SectionBenefits from "./section/SectionBenefits";
import { HeroActions, QuoteButton, ViewAllAction } from "./section/SectionActions";
import { PlayableArt, VideoButton } from "./section/VideoButton";
import { sectionLink } from "@/lib/homeSections/links";

/**
 * One home section: story (headline, steps, benefits, buttons) + product screen,
 * then its tools. The first section is the top of the page, so it carries the
 * H1 and the signup buttons. Copy, benefits and videos come from sectionCopy.js.
 */
export default function ToolSection({ section, index, city = null }) {
  const copy = copyFor(section, city);
  const isFirst = index === 0;
  const isGbp = section.key === "gbp";
  // Sections that sell a plan offer (lib/planOffers.js) above their tools
  const offerKey = { gbp: "gmb", social_media: "social", outreach: "outreach", website_seo: "seo", paid_ads: "ads", website_development: "web" }[section.key];
  const link = sectionLink(section);
  // Alternate the screen side so the page doesn't feel repetitive.
  const artFirst = index % 2 === 1;

  const art = <SectionArt sectionKey={section.key} />;

  return (
    <section id={`tools-${section.key}`} className="scroll-mt-24">
      <div
        className={`relative overflow-hidden rounded-3xl border border-slate-200 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:rounded-[32px] sm:p-8 lg:p-10 ${isFirst ? "pt-4 sm:pt-5 lg:pt-6 " : ""}${
          isGbp
            ? "bg-[radial-gradient(ellipse_at_90%_0%,rgba(250,204,21,0.12),transparent_40%),#fff]"
            : "bg-white"
        }`}
      >
        <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          <div className={artFirst ? "lg:order-2" : ""}>
            <SectionHeader
              section={section}
              copy={copy}
              as={isFirst ? "h1" : "h2"}
              hero={isFirst}
              link={link}
            />
            <StepList steps={copy.steps} />
            <SectionBenefits benefits={copy.benefits} />

            {isFirst ? (
              <HeroActions />
            ) : (
              // Offer sections sell their plans in the strip below, so no "View All Tools" there
              <ViewAllAction link={offerKey ? null : link}>
                {copy.cta?.lead ? (
                  <LeadButton service={copy.cta.lead} label={copy.cta.label} />
                ) : (
                  copy.cta && <QuoteButton cta={copy.cta} />
                )}
                {copy.video && <VideoButton video={copy.video} />}
              </ViewAllAction>
            )}
          </div>

          {/* Screens hide on phones (the top one too) to keep the page short */}
          <div className={`hidden sm:block ${artFirst ? "lg:order-1" : ""}`}>
            {/* A YouTube video gets a play button over the screen; a built-in demo already plays there */}
            {copy.video?.url ? <PlayableArt video={copy.video}>{art}</PlayableArt> : art}
          </div>
        </div>

        {/* TOOLS — offer sections get the subscribe strip + plans modal */}
        {copy.cta?.lead ? (
          <LeadToolGrid items={section.items} service={copy.cta.lead} />
        ) : offerKey ? (
          <OfferToolGrid
            items={section.items}
            offerKey={offerKey}
            variant={isGbp ? "gbp" : undefined}
            countTools={isGbp}
          />
        ) : section.key === "ai_tools" ? (
          // Create AI Video runs on coins: cards + top-up banner/modal (by mobile number)
          <WalletTopup items={section.items} />
        ) : (
          <ToolGrid className="mt-6 sm:mt-8 lg:mt-10">
            {section.items.map((item) => (
              <ToolCard key={item.key} item={item} />
            ))}
          </ToolGrid>
        )}
      </div>
    </section>
  );
}
