import React from "react";
import {
  Sparkles, CheckCircle, Users, Dumbbell, ShieldCheck, Home, Stethoscope,
  CalendarCheck, Utensils, Share2, Map, Camera, Plane, SearchCheck, Bug,
  MessageCircle, MapPin, Hammer, Scissors, Wrench, ShieldAlert, Heart,
  BookOpen, Store, MessageSquare,
} from "lucide-react";

const ICON_MAP = {
  Sparkles, CheckCircle, Users, Dumbbell, ShieldCheck, Home, Stethoscope,
  CalendarCheck, Utensils, Share2, Map, Camera, Plane, SearchCheck, Bug,
  MessageCircle, MapPin, Hammer, Scissors, Wrench, ShieldAlert, Heart,
  BookOpen, Store, MessageSquare,
};

function BenefitIcon({ icon }) {
  const fallback = <CheckCircle className="text-slate-600 group-hover:text-lemon-hover w-5 h-5 transition-colors" />;
  if (!icon) return fallback;
  if (typeof icon === "string") {
    const IconComponent = ICON_MAP[icon];
    return IconComponent ? <IconComponent className="text-lemon-hover w-5 h-5" /> : fallback;
  }
  return icon;
}

export default function IndustryBenefitsSection({ industryName, benefitsList }) {
  return (
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
                  <BenefitIcon icon={benefit.icon} />
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
  );
}
