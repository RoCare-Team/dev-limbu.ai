"use client";

import { ArrowLeft, FileText, ShieldCheck, Mail, Phone, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

export default function TermsPage() {
  const router = useRouter();

  const sections = [
    { title: "1. Introduction", content: "Welcome to Limbu.ai (“we”, “our”, “us”). By accessing or using our SaaS platform, website, or mobile application, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please discontinue using our services immediately." },
    { title: "2. Services", content: "Our SaaS platform provides AI-powered automation tools and digital business management solutions. These services are offered on a subscription or usage basis as per the plan selected by the customer." },
    { title: "3. User Account", content: "You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent or abusive activity." },
    { title: "4. Payments and Billing", content: "All payments for our services are securely processed through Razorpay. By completing a payment, you authorize Razorpay to debit your account for the selected plan or service. We do not store or have access to your credit/debit card details." },
    { title: "5. Refund & Cancellation Policy", content: "All payments made towards subscriptions or services are final and non-refundable. In case of duplicate payments or transaction errors, please contact our support team within 7 business days for review and resolution." },
    { title: "6. Intellectual Property", content: "All content, trademarks, software, and data available on our SaaS platform are owned by or licensed to Limbu.ai. Users may not copy, modify, distribute, or use any part of the platform without prior written permission." },
    { title: "7. Limitation of Liability", content: "While we strive to provide uninterrupted and reliable services, we do not guarantee error-free or continuous operation. We are not liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services." },
    { title: "8. Termination of Service", content: "We reserve the right to suspend or terminate user accounts that violate these terms or misuse our services. Upon termination, access to all paid features will be revoked without refund." },
    { title: "9. Governing Law", content: "These Terms and Conditions are governed by the laws of India. Any disputes arising from or related to these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India." }
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
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Home
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
              <FileText className="w-3.5 h-3.5" style={{ color: "var(--lemon-hover)" }} />
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
              Terms & <span style={{ color: "var(--lemon-hover)" }}>Conditions</span>
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
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 font-medium pl-11">
                    {section.content}
                  </p>
                </div>
              ))}

              {/* Contact Us Section */}
              <div className="pt-8 border-t border-slate-100">
                 <h2 
                    className="text-xl font-bold uppercase tracking-tight text-black mb-8 flex items-center gap-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span className="w-8 h-[2px] bg-[var(--lemon-hover)] opacity-30" />
                    10. Contact Us
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-6 pl-11">
                    {[
                      { icon: <Mail className="w-4 h-4"/>, label: "Email Support", value: "info@limbu.ai" },
                      { icon: <Phone className="w-4 h-4"/>, label: "Direct Line", value: "+91 9289344726" },
                      { icon: <Globe className="w-4 h-4"/>, label: "Official Website", value: "limbu.ai", link: "https://limbu.ai" },
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 max-w-md mx-auto">
                By using our SaaS platform, you acknowledge that you have read and agreed to these Terms.
              </p>
              <div className="h-1 w-12 bg-slate-100 mx-auto rounded-full" />
              <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                © {new Date().getFullYear()} Limbu AI. Powering digital growth globally.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}
