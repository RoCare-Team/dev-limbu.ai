import React from "react";
import { Star, CheckCircle, TrendingUp, Smartphone, Users, Zap, ArrowRight, Play, MessageSquare, ShieldCheck, Globe, MousePointer2, Sparkles, Search } from "lucide-react";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "./sections/HeaderSection";
import StatsSection from "@/components/sections/StatsSection";
import FAQSection from "@/components/sections/FAQSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import VideoTestimonialSection from "@/components/sections/VideoTestimonialSection";


export default function IndustryLandingTemplate({
  industryName,
  heroHeading,

  heroSubheading,
  heroImage,
  heroimage2,
  benefitsList,
  whatsappLink = "https://wa.me/919283344726",
  howItWorks,
}) {
  // Generate dynamic steps if no custom howItWorks is provided
  const displaySteps = howItWorks || [
    {
      step: "01",
      title: "1-Click AI Connection",
      description: `Connect your Google Business Profile instantly. Our AI audits your current ranking and builds a custom optimization strategy for your ${industryName} business.`,
      icon: <Zap className="w-5 h-5" />,
    },
    {
      step: "02",
      title: `Dominate '${industryName} Near Me'`,
      description: `We automatically optimize your profile with high-ranking keywords so you show up #1 when locals search for ${industryName} services in your area.`,
      icon: <Search className="w-5 h-5" />,
    },
    {
      step: "03",
      title: "Automated Weekly Updates",
      description: `Our AI generates and publishes fresh posts, photos, and offers to keep your ${industryName} profile active and engaging for new customers 24/7.`,
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      step: "04",
      title: "Capture 5-Star Reviews",
      description: `Your ${industryName} customers scan your custom Magic QR code in-store, making it frictionless for them to leave a 5-star review instantly.`,
      icon: <Star className="w-5 h-5" />,
    },
    {
      step: "05",
      title: "Instant AI Review Replies",
      description: `Limbu AI replies to every review instantly. This signals relevance to Google, boosting your ${industryName} SEO and repeating the growth loop.`,
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white min-h-screen font-inter overflow-x-hidden selection:bg-lemon-glow selection:text-black">
      <Navbar />

      <main className="pt-8 lg:pt-12">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8 lg:py-12">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-lemon-glow/10 blur-[120px] rounded-full opacity-60" />
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lemon-glow/30 bg-lemon-glow/5 mx-auto lg:mx-0 shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full animate-pulse bg-lemon-hover" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-lemon-hover">
                  Growth Software for {industryName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-black leading-[1.15] tracking-tight font-heading">
                {heroHeading.split(" ").map((word, i, arr) => (
                  <span key={i} className={i >= arr.length - 3 ? "text-lemon-hover" : ""}>
                    {word}{" "}
                  </span>
                ))}
              </h1>

              <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {heroSubheading}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto btn-lemon px-7 py-3.5 rounded-xl text-sm font-black shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Book Free Demo
                  <ArrowRight className="w-4 h-4" />
                </a>
                
                <div className="flex flex-col items-center lg:items-start">
                    <div className="flex items-center gap-1 mb-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-lemon-hover fill-current" />
                        ))}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Trusted by 1k+ {industryName}
                    </span>
                </div>
              </div>
            </div>

            <div className="relative lg:h-[450px] flex justify-center items-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-lemon-glow/15 via-transparent to-blue-50/20 rounded-[2.5rem] -z-10 transform rotate-1 group-hover:rotate-0 transition-transform duration-700" />
              <img
                src={heroImage}
                alt={`${industryName} Marketing`}
                className="relative z-10 w-full max-w-md object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* GMB OPPORTUNITY & ROI SECTION (Replaces Logos) */}
        <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-50 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="order-2 lg:order-1 relative group">
                <div className="absolute -inset-4 bg-lemon-glow/10 blur-2xl rounded-[3rem] group-hover:bg-lemon-glow/20 transition-all duration-700 -z-10" />
                <img 
                    src={heroimage2} 
                    alt={`${industryName} GMB Growth`} 
                    className="rounded-3xl shadow-2xl border border-slate-100 group-hover:scale-[1.01] transition-transform duration-500 w-full object-cover"
                />
                
                {/* Floating Metric Card */}
                <div className="absolute -bottom-6 -right-6 bg-black text-white p-6 rounded-2xl shadow-2xl hidden sm:block animate-bounce-slow">
                    <div className="text-[10px] font-bold text-lemon-hover uppercase tracking-widest mb-1">Market Reach</div>
                    <div className="text-2xl font-black">85% of Locals</div>
                    <div className="text-xs font-medium text-slate-400">Search on Google Maps</div>
                </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                <TrendingUp className="w-4 h-4 text-lemon-hover" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue Opportunity</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight font-heading leading-tight">
                How Many New <span className="text-lemon-hover">Clients Are You Missing?</span>
              </h2>
              
              <div className="space-y-4 text-slate-600 font-medium text-base sm:text-lg leading-relaxed">
                <p>
                  Did you know that for <span className="text-black font-bold">{industryName}</span>, over 85% of discovery happens directly on Google Maps? If you aren't in the Top 3, you're invisible.
                </p>
                <p>
                  Limbu AI doesn't just manage your profile—it aggressively pushes you to the top. Our users typically see a <span className="text-black font-bold">3x increase in phone calls</span> and direction requests within the first 90 days.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-lemon-glow/40 hover:bg-lemon-glow/5">
                    <div className="text-2xl sm:text-3xl font-black text-black">300%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg. Reach Boost</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:border-lemon-glow/40 hover:bg-lemon-glow/5">
                    <div className="text-2xl sm:text-3xl font-black text-black">20+ hrs</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saved Per Month</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* KEY STATS */}
        <div className="py-2">
          <StatsSection />
        </div>

        {/* WHY CHOOSE US / BENEFITS */}
        <section className="bg-white py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative border-y border-slate-50 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10" />

          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
                <Sparkles className="w-3.5 h-3.5 text-lemon-hover" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Unfair Advantage</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight mb-4 font-heading leading-tight">
                Why {industryName} <span className="text-lemon-hover">Dominate With Limbu AI</span>
              </h2>
              <p className="text-slate-500 font-medium text-base leading-relaxed">
                Automate the heavy lifting of local SEO so you can focus on your customers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {benefitsList.map((benefit, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white p-6 rounded-xl border border-slate-200 transition-all duration-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-lemon-glow/40 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-lemon-hover to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex flex-col h-full relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 group-hover:bg-lemon-glow/10 transition-colors duration-300">
                      {benefit.icon || (
                        <CheckCircle className="text-slate-600 group-hover:text-lemon-hover w-5 h-5 transition-colors" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2.5 tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS - CENTERED HEADER & CONNECTED JOURNEY */}
        <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-50 relative">
          <div className="mb-12 lg:mb-16 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-4">
                <div className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Timeline</span>
              </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tight font-heading leading-[1.1] max-w-4xl mx-auto">
              Your Journey To <span className="text-lemon-hover">#1 On Google</span>
            </h2>
            <p className="mt-4 text-slate-500 font-medium max-w-2xl text-lg mx-auto">
              Follow the exact 5-step roadmap Limbu AI uses to transform your {industryName} presence from invisible to unbeatable.
            </p>
          </div>

          <div className="relative max-w-6xl">
            {/* Continuous Vertical Line Connecting Icons */}
            <div className="absolute left-[24px] sm:left-[28px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-lemon-glow via-slate-100 to-transparent -z-10" />
            
            <div className="grid gap-10 sm:gap-14">
              {displaySteps.map((item, idx) => (
                <div key={idx} className="relative group flex gap-8 sm:gap-12 items-start">
                  {/* Icon Indicator (Replaces Numbering) */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-slate-100 text-slate-400 rounded-full flex items-center justify-center shadow-sm group-hover:border-lemon-glow group-hover:bg-lemon-glow group-hover:text-black transition-all duration-500 relative z-10">
                      {React.cloneElement(item.icon, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                    </div>
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-lemon-glow/20 rounded-full scale-150 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                  </div>

                  {/* Content Area - Full Width */}
                  <div className="pt-1 sm:pt-2 flex-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-lemon-hover transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed w-full">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ComparisonSection />

        <VideoTestimonialSection />

        <FAQSection />

        {/* FINAL CTA - REFINED & COMPACT */}
        <section className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 border-t border-slate-100">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lemon-glow/10 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight mb-6 font-heading leading-tight">
              Ready to automate your <span className="text-lemon-hover">{industryName}</span> growth?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-bold opacity-90">
              Join hundreds of successful businesses who use Limbu AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto btn-lemon px-7 py-3.5 rounded-xl text-sm font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2.5 group"
                >
                Get Started For Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4" />
                    No Credit Card Required
                </div>
            </div>
            
            <div className="mt-10 flex flex-wrap justify-center gap-6 opacity-80 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-lemon-hover" />
                    Secure
                </div>
                <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-lemon-hover" />
                    Instant
                </div>
                <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-widest">
                    <MessageSquare className="w-4 h-4 text-lemon-hover" />
                    Support
                </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
