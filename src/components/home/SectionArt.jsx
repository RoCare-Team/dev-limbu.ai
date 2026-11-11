import GbpArt from "./art/GbpArt";
import SocialArt from "./art/SocialArt";
import AiToolsArt from "./art/AiToolsArt";
import OutreachArt from "./art/OutreachArt";
import SeoArt from "./art/SeoArt";
import AdsArt from "./art/AdsArt";
import WebDevArt from "./art/WebDevArt";
import CrmArt from "./art/CrmArt";
import AppArt from "./art/AppArt";

/*
 * Big "product screen" for each home section, showing the tool doing its job.
 * One file per screen in ./art; real posts and reel URLs live in ./art/media.js.
 * Server components only — they add no JavaScript to the page.
 */
const ART = {
  gbp: GbpArt,
  social_media: SocialArt,
  ai_tools: AiToolsArt,
  outreach: OutreachArt,
  website_seo: SeoArt,
  website_development: WebDevArt,
  paid_ads: AdsArt,
  custom_crm: CrmArt,
  mobile_app: AppArt,
};

export default function SectionArt({ sectionKey }) {
  const Art = ART[sectionKey];
  return Art ? <Art /> : null;
}
