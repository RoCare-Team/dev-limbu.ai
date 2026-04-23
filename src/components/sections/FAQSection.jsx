"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0); // Default first one open

  const faqs = [
    {
      question: "What is Limbu.ai and how does it help Local SEO?",
      answer:
        "Limbu.ai is an AI marketing platform that automates Google Business Profile activity. By consistently posting updates and replying to reviews instantly (two major Google ranking factors), it helps improve your visibility in local 'near me' search results.",
    },
    {
      question: "Is it safe to connect my Google and Facebook accounts?",
      answer:
        "Yes. Limbu.ai uses official, secure OAuth interactions directly approved by Google and Meta. We never store your passwords, and our connection is encrypted with enterprise-grade security.",
    },
    {
      question: "Can I manage multiple locations for different clients?",
      answer:
        "Absolutely. Limbu.ai is designed for scale. You can toggle between different brands or locations within the same dashboard, making it the perfect tool for digital agencies.",
    },
    {
      question: "Does Limbu.ai actually write the content for me?",
      answer:
        "Yes. Our generative AI helps create captions, suggest hashtags, and draft review replies. You always have full control to edit or approve content before it goes live.",
    },
    {
      question: "How long does it take to see results in rankings?",
      answer:
        "While SEO is a long-term game, our users typically see increased engagement within the first 30 days. Consistent GBP activity is one of the fastest ways to signal relevance to Google's local algorithm.",
    },
    {
      question: "Is there a long-term commitment required?",
      answer:
        "No. Our subscription plans are flexible. You can choose monthly billing and cancel at any time, or opt for quarterly and yearly plans to save up to 20%.",
    },
  ];

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
            Everything you need to know about Limbu.ai and our automation services.
          </p>
        </div>

        {/* ── FAQ List (Full Width) ── */}
        <div className="max-w-5xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
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
