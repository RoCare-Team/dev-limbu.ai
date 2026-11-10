import { Code2, MessageSquare, PenTool, Rocket } from "lucide-react";
import SectionHeading from "./SectionHeading";

const STEPS = [
  { icon: MessageSquare, title: "Share your needs", text: "Pick a plan and tell us about your business, pages and style." },
  { icon: PenTool, title: "We design", text: "We design every page around your brand and business." },
  { icon: Code2, title: "We build", text: "A fast, mobile-friendly site with SEO and analytics set up." },
  { icon: Rocket, title: "Go live", text: "We launch your site and keep supporting you after launch." },
];

export default function WebProcess() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHeading eyebrow="How it works" title="From idea to live website in 4 steps" />
        <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px border-t-2 border-dashed border-slate-200 lg:block" />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#facc15] shadow-[0_8px_20px_rgba(234,179,8,0.35)]">
                <Icon size={22} className="text-black" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
              <p className="mx-auto mt-1.5 max-w-[240px] text-sm font-medium leading-relaxed text-slate-500">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
