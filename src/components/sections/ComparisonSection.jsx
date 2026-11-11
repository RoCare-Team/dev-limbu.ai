import { X, Check, Zap } from "lucide-react";

export default function ComparisonSection() {
  // Same order on both sides: each "old way" row is answered by the row beside it.
  const oldWay = [
    "A different agency for GMB, social media, SEO, ads and website",
    "Hours spent writing posts and replying to every Google review",
    "Paying an editor for every reel and video",
    "Customer follow-ups lost in WhatsApp chats and notebooks",
    "No idea why your website doesn't rank on Google",
    "Ad money spent on campaigns nobody set up or tracks properly",
    "Separate bills, logins and payments for every tool",
  ];

  const limbuWay = [
    "GMB, social media, SEO, ads, websites and apps in one place",
    "AI writes your posts and replies to every review",
    "Create reels and AI videos in minutes, pay only in coins",
    "WhatsApp and email campaigns that bring customers back",
    "Free website audit with a clear, prioritised fix list",
    "Experts set up your Google, Meta and LinkedIn ads with tracking",
    "Add every service you need to one cart and pay once",
  ];

  return (
    <section
      id="comparison"
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Label */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500" strokeWidth={2.5} />

            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-600">
              The Evolution
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-black uppercase leading-[0.95] tracking-tight mb-4 text-slate-900"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
            }}
          >
            Stop Doing{" "}
            <span className="text-yellow-500">Business The Old Way</span>
          </h2>

          <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-semibold text-slate-600">
            One AI platform for your Google profile, social media, website and
            ads, instead of five agencies and ten tools.
          </p>
        </div>

        {/* Comparison */}
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-12 relative">
          {/* VS Badge */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-50 items-center justify-center z-20 shadow-xl">
            <span
              className="font-black text-xl text-slate-300 italic"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              VS
            </span>
          </div>

          {/* Old Way */}
          <div className="flex-1 rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-10 relative overflow-hidden transition-all duration-500 hover:shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-16 -mt-16" />

            <div className="relative z-10">
              <h3
                className="text-2xl sm:text-3xl font-black text-slate-400 mb-8 tracking-tight uppercase"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The Old Way
              </h3>

              <ul className="space-y-6">
                {oldWay.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5 text-red-500 stroke-[3]" />
                    </div>

                    <span className="text-slate-500 font-semibold leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Limbu AI */}
          <div
            className="flex-1 rounded-3xl p-8 sm:p-10 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border bg-white"
            style={{
              borderColor: "rgba(250, 204, 21, 0.4)",
              boxShadow: "0 20px 40px -10px rgba(250, 204, 21, 0.2)",
            }}
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-bl-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="relative z-10">
              <h3
                className="text-2xl sm:text-3xl font-black mb-8 tracking-tight uppercase text-yellow-500"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                With Limbu AI
              </h3>

              <ul className="space-y-6">
                {limbuWay.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-yellow-300">
                      <Check className="w-4 h-4 text-black stroke-[3]" />
                    </div>

                    <span className="text-slate-900 font-bold leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
