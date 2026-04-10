"use client";

import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";
import { ArrowLeft, CheckCircle, ShieldCheck, Mail, Phone, MapPin, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PolicyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Introduction",
      content:
        "Welcome to Limbu AI (“we”, “our”, “us”). We value your privacy and are committed to protecting your personal information. This document explains how we collect, use, and safeguard your data.",
    },
    {
      title: "2. Information We Collect",
      list: [
        "Personal details such as name, email, phone number, and address.",
        "Billing and payment details via Razorpay.",
        "Usage data like IP address, browser type, and device info.",
      ],
    },
    {
      title: "3. How We Use Your Information",
      list: [
        "To provide and manage services.",
        "To process payments securely.",
        "To send updates and invoices.",
        "To improve user experience.",
      ],
    },
    {
      title: "4. Payment & Security",
      content:
        "All payments are processed securely through Razorpay. We do not store your card details. Razorpay uses SSL encryption and PCI DSS compliance.",
    },
    {
      title: "5. Terms of Service",
      content:
        "By using our platform, you agree not to misuse services or engage in unlawful activity. Fraudulent behavior will result in suspension.",
    },
    {
      title: "6. Refund Policy",
      content:
        "Payments are non-refundable once activated. Duplicate transactions can be reported within 7 days. Approved refunds are processed within 7 business days.",
    },
    {
      title: "7. Data Protection",
      content:
        "We follow industry-standard security practices. However, no system is 100% secure. Users must protect their credentials.",
    },
    {
      title: "8. Third-Party Services",
      content:
        "We may use third-party tools like Razorpay or Google APIs. We are not responsible for their policies.",
    },
  ];

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen py-20 px-4 sm:px-6 relative overflow-hidden"
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

        {/* ── Ambient glow ── */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-12 text-xs font-bold tracking-widest uppercase transition-colors hover:text-[var(--lemon-hover)] text-slate-400 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>

          {/* ── Section Header ── */}
          <div className="text-center mb-16">
            {/* Label chip */}
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(250, 204, 21, 0.1)",
                border: "1px solid rgba(250, 204, 21, 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--lemon-hover)" }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
                Legal Studio
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--foreground)",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
              }}
            >
              Privacy & <span style={{ color: "var(--lemon-hover)" }}>Compliance</span>
            </h1>

            <p
              className="text-sm font-bold uppercase tracking-[0.1em]"
              style={{ color: "rgba(15, 23, 42, 0.4)" }}
            >
              Effective Date: 31 October 2025
            </p>
          </div>

          {/* ── Content Card ── */}
          <div 
            className="bg-white border rounded-[2.5rem] p-8 md:p-16 transition-shadow duration-500 shadow-sm mb-12"
            style={{
              borderColor: "rgba(15, 23, 42, 0.08)",
            }}
          >
            <div className="space-y-12">
              {sections.map((section, i) => (
                <div key={i} className="group">
                  <h2 
                    className="text-xl font-bold uppercase tracking-tight text-black mb-5 flex items-center gap-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span className="w-8 h-[2px] bg-[var(--lemon-hover)] opacity-30 transition-all group-hover:w-12 group-hover:opacity-100" />
                    {section.title}
                  </h2>

                  {section.content && (
                    <p className="text-sm md:text-base leading-relaxed text-slate-600 font-medium pl-11">
                      {section.content}
                    </p>
                  )}

                  {section.list && (
                    <ul className="space-y-3 pl-11">
                      {section.list.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-[var(--lemon-hover)] shrink-0 mt-1" />
                          <span className="text-sm md:text-base text-slate-600 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Contact Information Section */}
              <div className="pt-8 border-t border-slate-100">
                 <h2 
                    className="text-xl font-bold uppercase tracking-tight text-black mb-8 flex items-center gap-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span className="w-8 h-[2px] bg-[var(--lemon-hover)] opacity-30" />
                    9. Contact Information
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-6 pl-11">
                    {[
                      { icon: <Mail className="w-4 h-4"/>, label: "Email", value: "info@limbu.ai" },
                      { icon: <Phone className="w-4 h-4"/>, label: "Phone", value: "+91 9289344726" },
                      { icon: <MapPin className="w-4 h-4"/>, label: "Address", value: "Unit No. 831, JMD Megapolis, Sector 48, Gurugram" },
                      { icon: <Globe className="w-4 h-4"/>, label: "Website", value: "limbu.ai", link: "https://limbu.ai" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[var(--lemon-hover)] shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                          {item.link ? (
                            <a href={item.link} target="_blank" className="text-sm font-bold text-black hover:text-[var(--lemon-hover)] transition-colors underline decoration-[var(--lemon-hover)]/30 underline-offset-4">
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-sm font-bold text-black leading-tight">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-20 pt-10 border-t border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                By using our platform, you agree to these terms.
              </p>
              <div className="h-1 w-12 bg-slate-100 mx-auto rounded-full" />
              <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                © {new Date().getFullYear()} Limbu AI. Built for the future of automation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}
