import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Limbu AI and what can it do for my business?",
    answer:
      "Limbu AI is an all-in-one AI marketing platform for local businesses. It manages your Google Business Profile, social media, AI reels and videos, WhatsApp and email campaigns, website SEO, website development, paid ads, and even custom CRMs and mobile apps, all from one place.",
  },
  {
    question: "Which services can I buy, and how much do they cost?",
    answer:
      "GMB tools start at ₹999/month (billed yearly), social media plans at ₹2,400/month (yearly), the Emailer plan at ₹500/month (yearly), SEO from ₹5,999/month, ad account setup from ₹2,500 one-time and websites from ₹9,999 one-time. All prices are plus 18% GST. Open any service on the home page to see its plans.",
  },
  {
    question: "Can I buy more than one service together?",
    answer:
      "Yes. Open any service, pick a plan and tap “Add to Cart”. Add as many services as you need and pay for all of them in one secure Razorpay payment. Each plan activates as soon as the payment goes through.",
  },
  {
    question: "How do the AI tools and coins work?",
    answer:
      "AI tools like Text to Video, Image to Video, AI Avatar Video, CGI Video and AI post creation use coins from your wallet, so you only pay for what you create. New users get 500 coins when they sign up, and you can top up your wallet any time.",
  },
  {
    question: "Is the website audit really free?",
    answer:
      "Yes. Run the Website Audit from your dashboard on any website and get a score with 50+ checks across SEO, speed, security, mobile and local SEO, plus a prioritised fix list. If you want our team to fix the issues, pick an SEO plan.",
  },
  {
    question: "Is the ad budget included in the ads setup price?",
    answer:
      "No. The setup fee covers our work: account setup, audience and keyword research, tracking and ad copy. Your ad spend is paid directly to Google, Meta or LinkedIn from your own account, so you stay in full control of the budget.",
  },
  {
    question: "Is it safe to connect my Google and Facebook accounts?",
    answer:
      "Yes. Limbu AI connects through the official, secure sign-in (OAuth) of Google and Meta. We never see or store your passwords, and you can disconnect at any time.",
  },
  {
    question: "Can I manage multiple business locations?",
    answer:
      "Yes. Whether you run several branches, franchises or brands, you can manage all your Google Business Profile locations and their posts, reviews and insights from one dashboard.",
  },
  {
    question: "Do you build custom CRMs and mobile apps?",
    answer:
      "Yes. We build CRMs around how your sales work (leads, pipeline, follow-ups, team roles, reports) and Android and iPhone apps with an admin panel. Tap “Get a Free Quote” in those sections to share your requirements on WhatsApp.",
  },
  {
    question: "Do plans renew automatically?",
    answer:
      "No. Each plan is a one-time payment for the period you choose (a month, a year, or a one-time service). Nothing is charged again automatically; you renew only when you want to.",
  },
];

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="relative w-full overflow-hidden py-12 border-t border-black/5 bg-white"
    >
      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          {/* Label */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <HelpCircle className="w-3.5 h-3.5 text-yellow-500" />

            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-600">
              Support & Help
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4 text-slate-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
            }}
          >
            Frequently <span className="text-yellow-500">Asked Questions</span>
          </h2>

          <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold text-slate-700">
            Everything you need to know about Limbu AI, our plans and our
            services.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-5xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group relative bg-white border rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                borderColor: "rgba(15, 23, 42, 0.08)",
              }}
            >
              <summary className="list-none cursor-pointer p-6 sm:p-8 flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-700 group-open:text-black transition-colors duration-300">
                  {faq.question}
                </span>

                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 transition-all duration-300 group-open:bg-yellow-500 group-open:text-white group-open:rotate-180">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </summary>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="h-px w-full bg-slate-100 mb-6" />

                <p className="text-sm sm:text-base leading-relaxed font-medium text-slate-600">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
