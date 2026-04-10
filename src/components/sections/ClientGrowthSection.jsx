"use client";

import {
  TrendingUp,
  MousePointerClick,
  MapPin,
  ArrowUpRight,
  Cpu,
  Share2,
  Globe,
  CheckCircle2,
} from "lucide-react";

export default function ClientGrowthSection() {
  const metrics = [
    {
      title: "Search Visibility",
      value: "+314%",
      description:
        "Increase in 'near me' local search appearances within the first 90 days.",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      title: "Customer Actions",
      value: "4.8x",
      description:
        "More calls, website visits, and direction requests from Google.",
      icon: <MousePointerClick className="w-5 h-5" />,
    },
    {
      title: "Profile Engagement",
      value: "+520%",
      description:
        "Boost in photo views and post interactions driven by AI content.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const automationPillars = [
    {
      title: "Google My Business Automation",
      subtitle: "The Local Authority",
      description:
        "We transform your Google Business Profile into a lead-generating machine. By automating daily updates, AI-optimized photo publishing, and instant review responses, we keep your business at the top of the 'Local 3-Pack'.",
      purpose:
        "Our purpose is to ensure you never miss a local customer by maintaining a perfect, high-activity profile that Google's algorithm loves to reward.",
      icon: <Globe className="w-6 h-6" />,
      features: [
        "Daily AI-Generated Posts",
        "Instant Review Management",
        "Auto-Response to Q&As",
        "Local SEO Keyword Injection",
      ],
      accent: "var(--lemon-hover)",
    },
    {
      title: "Social Media Automation",
      subtitle: "The Digital Pulse",
      description:
        "Maintain a dominant presence across Facebook, Instagram, and LinkedIn without touching your phone. Our system creates, schedules, and publishes trending content tailored to your specific industry and audience.",
      purpose:
        "Our purpose is to build long-term brand equity and trust by ensuring your business stays active, relevant, and visually stunning across all social platforms.",
      icon: <Share2 className="w-6 h-6" />,
      features: [
        "Multi-Platform Scheduling",
        "Viral Trend Adaptation",
        "Visual Content Design",
        "Engagement Analytics",
      ],
      accent: "#3b82f6", // Professional blue accent for social
    },
  ];

  return (
    <section
      id="client-growth"
      className="relative w-full overflow-hidden py-12  border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* ── Subtle background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Ambient glow — center ── */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] z-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.25) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Section Header ── */}
        <div className="text-center mb-16 sm:mb-20">
          {/* Label chip */}
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              border: "1px solid rgba(250, 204, 21, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Cpu
              className="w-3.5 h-3.5"
              style={{ color: "var(--lemon-hover)" }}
            />
            <span
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "var(--lemon-hover)" }}
            >
              The Engine of Success
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
            How Limbu.ai{" "}
            <span style={{ color: "var(--lemon-hover)" }}>Drives Growth</span>
          </h2>

          <p
            className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-semibold"
            style={{ color: "rgba(15, 23, 42, 0.85)" }}
          >
            Real results aren't accidental. They are the product of consistent,
            AI-powered activity across your most critical digital channels.
          </p>
        </div>

        {/* ── Automation Pillars ── */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {automationPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="relative flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-8 sm:p-10 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden"
            >
              {/* Corner Accent */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rounded-full"
                style={{ backgroundColor: pillar.accent }}
              />

              <div className="flex-grow">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 shadow-sm"
                  style={{
                    background:
                      pillar.accent === "var(--lemon-hover)"
                        ? "rgba(250, 204, 21, 0.1)"
                        : "rgba(59, 130, 246, 0.1)",
                    color: pillar.accent,
                  }}
                >
                  {pillar.icon}
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    {pillar.subtitle}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  {pillar.title}
                </h3>

                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                  {pillar.description}
                </p>

                <div
                  className="p-5 rounded-2xl mb-8 border border-slate-50"
                  style={{ background: "rgba(248, 250, 252, 0.5)" }}
                >
                  <p className="text-xs font-bold text-slate-700 italic">
                    " {pillar.purpose} "
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 pt-6 border-t border-slate-50">
                {pillar.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2">
                    <CheckCircle2
                      className="w-3.5 h-3.5"
                      style={{ color: pillar.accent }}
                    />
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Metrics Grid ── */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-20">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="group relative bg-slate-50 border border-slate-100 rounded-3xl p-8 transition-all duration-500 hover:bg-white hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 group-hover:bg-yellow-50 group-hover:border-yellow-200 transition-colors duration-500"
                    style={{ color: "var(--lemon-hover)" }}
                  >
                    {metric.icon}
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-yellow-500 transition-colors duration-500" />
                </div>

                <div className="mb-2">
                  <span
                    className="font-black tracking-tight"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                      color: "var(--foreground)",
                    }}
                  >
                    {metric.value}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {metric.title}
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Growth Timeline / Visual ── */}
        <div className="bg-white border border-slate-100 rounded-[3rem] p-8 sm:p-12 shadow-sm">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <h3
                className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900 mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Automated Activity <br />
                <span className="text-slate-400">
                  Yields Compounding Growth
                </span>
              </h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
                Google and Social platforms reward **consistency** above all
                else. Our automation ensures your business never looks "closed"
                or "inactive", building a permanent baseline of authority.
              </p>
              <ul className="space-y-5">
                {[
                  {
                    title: "The Launch Phase",
                    text: "AI optimizes your core business data and profile structure for maximum crawlability.",
                  },
                  {
                    title: "The Velocity Phase",
                    text: "Daily posts and interaction signals increase your relevance in search results.",
                  },
                  {
                    title: "The Dominance Phase",
                    text: "Sustained authority leads to top-tier rankings and consistent lead conversion.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
                      <span
                        className="text-xs font-black"
                        style={{ color: "var(--lemon-hover)" }}
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Stylized Chart */}
            <div className="relative h-[250px] sm:h-[300px] flex items-end justify-between gap-2 sm:gap-4 pt-10 border-b-2 border-slate-100 px-4">
              {[
                { height: "20%", label: "M1" },
                { height: "35%", label: "M2" },
                { height: "55%", label: "M3" },
                { height: "70%", label: "M4" },
                { height: "85%", label: "M5" },
                { height: "100%", label: "M6" },
              ].map((bar, i) => (
                <div key={i} className="relative flex-1 group">
                  <div
                    className="w-full rounded-t-xl transition-all duration-700 ease-out bg-slate-100 group-hover:bg-[#EAB308]"
                    style={{ height: bar.height }}
                  />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {bar.label}
                  </div>
                </div>
              ))}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 250 Q 100 200, 200 150 T 400 50 T 600 0"
                  fill="none"
                  stroke="rgba(234, 179, 8, 0.2)"
                  strokeWidth="4"
                  strokeDasharray="8 8"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
