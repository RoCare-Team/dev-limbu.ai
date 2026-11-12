import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import { SERVICE_ICONS } from "@/components/guide/GuideIcon";
import { SERVICE_GUIDES, guidePath } from "@/lib/serviceGuides";

export const metadata = {
  title: "Guides | How to Use Every Limbu AI Service",
  description:
    "Step-by-step guides for every Limbu AI service: Google Business Profile, social media, AI videos, outreach, SEO, paid ads, websites, CRM and apps.",
  alternates: { canonical: "https://www.limbu.ai/guide" },
};

export default function GuidesIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <HeaderSection />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-28 sm:px-6">
        <header className="mb-10 text-center">
          <h1
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Guides
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base font-medium text-slate-600">
            How each Limbu AI service works, step by step, from choosing a plan to seeing results.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_GUIDES.map((g) => {
            const Icon = SERVICE_ICONS[g.key];
            return (
              <Link
                key={g.key}
                href={guidePath(g)}
                className="group flex flex-col rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-yellow-400 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700">
                  {Icon && <Icon size={20} />}
                </span>
                <h2 className="mt-4 text-base font-bold text-slate-900">{g.name}</h2>
                <p className="mt-1 flex-1 text-sm text-slate-600">{g.intro}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                  {g.steps.length} steps <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
