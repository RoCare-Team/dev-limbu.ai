"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import HubSection from "./HubSection";
import { ToolCard } from "../home/ToolCard";
import { withLiveSocialTools } from "@/lib/social/liveTools";

// Tool lists come from home_sections, so they match the home page and the app.
const TOOL_SECTIONS = [
  { key: "social_media", title: "Social media tools", text: "Grow and manage your audience with AI." },
  { key: "ai_tools", title: "Create content with AI", text: "Posts, reels and videos ready to publish." },
];

function UpgradeBanner() {
  return (
    <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15]">
          <Lock size={18} className="text-black" />
        </span>
        <div>
          <div className="text-base font-black text-slate-900">Social media tools are part of the Social plans</div>
          <p className="text-sm font-medium text-slate-600">
            Get AI posts, comment and DM auto replies and insights for your pages with Social
            Starter, Growth or Pro. AI videos stay available on coins.
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
      >
        <Sparkles size={15} /> See Social plans
      </Link>
    </div>
  );
}

/** Tool grids with the user's own badges; upgrade banner without a Social plan. */
export default function SocialTools({ sections, planGroups }) {
  const needsUpgrade = Array.isArray(planGroups) && !planGroups.includes("social");

  return (
    <>
      {needsUpgrade && <UpgradeBanner />}
      {TOOL_SECTIONS.map(({ key, title, text }) => {
        // The app API still marks the new social tools "soon"; the website has their screens
        const section = withLiveSocialTools(sections.find((s) => s.key === key), { unlocked: !needsUpgrade && Array.isArray(planGroups) });
        // "Social Plans" is a link to the plans, not a tool
        const items = section?.items.filter((i) => i.key !== "social_plans") || [];
        if (!items.length) return null;
        return (
          <HubSection key={key} title={title} text={text}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ToolCard key={item.key} item={item} />
              ))}
            </div>
          </HubSection>
        );
      })}
    </>
  );
}
