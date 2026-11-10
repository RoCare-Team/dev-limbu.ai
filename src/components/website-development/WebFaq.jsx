import { ChevronDown } from "lucide-react";
import SectionHeading from "./SectionHeading";

export const WEB_FAQS = [
  {
    q: "Which plan is right for my business?",
    a: "Starter (5 pages) suits small shops and service businesses. Business (15 pages) adds custom design, an admin panel and Google Analytics. Enterprise (35 pages) is for brands that need an online store with payments.",
  },
  {
    q: "Is GST included in the price?",
    a: "No. Prices are shown before 18% GST, which is added at checkout. The booking screen shows the GST and total before you pay.",
  },
  {
    q: "Can I sell products online?",
    a: "Yes. The Enterprise plan includes e-commerce integration and a payment gateway, so customers can pay by UPI, card or net banking.",
  },
  {
    q: "What support do I get after launch?",
    a: "Every plan includes support after launch: 1 month on Starter, 3 months on Business and 6 months on Enterprise.",
  },
  {
    q: "I need more pages or a custom feature. What then?",
    a: "Call us on +91 92893 44726 and we will share a quote for the pages or features you need.",
  },
];

/** Uses <details> so it works without JavaScript. */
export default function WebFaq() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 space-y-3">
          {WEB_FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-colors open:border-amber-300"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={18} className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
