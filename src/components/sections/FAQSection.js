"use client";

import { ChevronDown } from "lucide-react";
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
  ];

  return (
    <section id="faq" className="py-24 relative overflow-hidden" style={{ backgroundColor: "var(--cyber-black)" }}>
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#FDE047 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="container mx-auto px-6 max-w-3xl relative z-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2
            className="font-normal uppercase leading-[0.9] tracking-tight mb-6 text-white"
            style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            Frequently <span style={{ color: "#FDE047" }}>Asked Questions</span>
          </h2>
          <p className="text-white/50 uppercase tracking-[0.2em] text-[12px] font-bold">
            Everything you need to know
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                backgroundColor: openIdx === index ? "rgba(253,224,71,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <button
                onClick={() => setOpenIdx(openIdx === index ? -1 : index)}
                className="w-full text-left p-6 flex justify-between items-center group"
              >
                <span
                  className={`text-lg font-medium transition-colors ${openIdx === index ? "text-[#FDE047]" : "text-white"}`}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${openIdx === index ? "rotate-180 text-[#FDE047]" : "text-white/40"}`}
                />
              </button>

              {/* Collapsible Content */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIdx === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-white/60 leading-relaxed text-sm border-t-0">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}