"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function IndustryFAQSection({ industryName, faqList }) {
  const [openIdx, setOpenIdx] = useState(0); // Default first one open

  // Fallback generic FAQs if none provided
  const defaultFaqs = [
    {
      question: `How does Limbu AI help ${industryName || "local businesses"} rank higher?`,
      answer: "Limbu AI automates your Google Business Profile. By consistently posting updates and replying to reviews instantly (two major Google ranking factors), it signals to Google that your business is active, boosting your visibility in local 'near me' searches.",
    },
    {
      question: "Is it safe to connect my Google account?",
      answer: "Yes. Limbu AI uses official, secure OAuth interactions directly approved by Google. We never store your passwords, and our connection is encrypted with enterprise-grade security.",
    },
    {
      question: "Does the AI actually write the posts for me?",
      answer: "Yes. Our generative AI creates highly engaging, industry-specific posts, suggests hashtags, and drafts professional review replies. You can set it to auto-publish or hold them for your approval.",
    },
    {
      question: "How does the Magic QR code get more 5-star reviews?",
      answer: "The Magic QR routes happy customers directly to your Google review page, making it frictionless for them to leave 5 stars. If a customer had a bad experience, it routes them to a private feedback form instead of public Google.",
    },
    {
      question: "How long does it take to see an increase in calls or foot traffic?",
      answer: "While local SEO is an ongoing strategy, our users typically see increased profile views and engagement within the first 30 days of consistent, automated activity.",
    },
  ];

  const displayFaqs = faqList && faqList.length > 0 ? faqList : defaultFaqs;

  return (
    <section
      id="faq"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* ── Ambient glow — top right ── */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section Header ── */}
        <div className="text-center mb-10 sm:mb-16">

          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <HelpCircle className="w-3.5 h-3.5" style={{ color: "var(--lemon-hover)" }} />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
              Support & Help
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(2rem, 5vw, 4rem)",
            }}
          >
            Frequently <span style={{ color: "var(--lemon-hover)" }}>Asked Questions</span>
          </h2>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold"
            style={{ color: "rgba(15, 23, 42, 0.85)" }}
          >
            Everything you need to know about growing your {industryName || "business"} with Limbu AI.
          </p>
        </div>

        {/* ── FAQ List (Full Width) ── */}
        <div className="max-w-5xl mx-auto space-y-4">
          {displayFaqs.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <div
                key={index}
                className="group relative bg-white border transition-all duration-500 rounded-2xl overflow-hidden"
                style={{
                  borderColor: isOpen ? "rgba(250, 204, 21, 0.4)" : "rgba(15, 23, 42, 0.08)",
                  boxShadow: isOpen ? "0 15px 30px -10px rgba(0,0,0,0.05)" : "none",
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : index)}
                  className="w-full text-left p-6 sm:p-8 flex justify-between items-center group cursor-pointer"
                >
                  <span
                    className={`text-base sm:text-lg font-bold tracking-tight transition-colors duration-300 ${isOpen ? "text-black" : "text-slate-600 group-hover:text-black"}`}
                  >
                    {faq.question}
                  </span>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isOpen ? "bg-[#EAB308] text-white rotate-180" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Collapsible Content */}
                <div
                  className={`grid transition-all duration-500 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                      <div className="h-px w-full bg-slate-50 mb-6" />
                      <p 
                        className="text-sm sm:text-base leading-relaxed font-medium"
                        style={{ color: "rgba(15, 23, 42, 0.65)" }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
