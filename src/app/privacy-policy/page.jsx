"use client";

import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PolicyPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen py-20 px-6 font-[Inter] relative overflow-hidden"
        style={{ backgroundColor: "var(--cyber-black)" }}
      >
        {/* Glow Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#FDE047] blur-[140px] opacity-[0.05] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600 blur-[140px] opacity-[0.05] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-[#FDE047] mb-10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Main Card */}
          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_0_40px_rgba(255,255,255,0.05)]">

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4 text-center">
              Privacy Policy, Terms & <span className="text-[#FDE047]">Refund Policy</span>
            </h1>

            <p className="text-center text-white/50 mb-10">
              Effective Date: 31 October 2025
            </p>

            {/* Sections */}
            <div className="space-y-8 text-white/70 leading-relaxed">

              {/* Section */}
              {[
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
              ].map((section, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/10"
                >
                  <h2 className="text-lg font-semibold text-white mb-3">
                    {section.title}
                  </h2>

                  {section.content && <p>{section.content}</p>}

                  {section.list && (
                    <ul className="list-disc list-inside space-y-2">
                      {section.list.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Contact */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-3">
                  9. Contact Information
                </h2>

                <div className="space-y-2 text-white/70">
                  <p>📧 Email: info@limbu.ai</p>
                  <p>📞 Phone: +91 9289344726</p>
                  <p>
                    🏢 Address: Unit No. 831, JMD Megapolis, Sector 48, Gurugram
                  </p>
                  <p>
                    🌐 Website:{" "}
                    <a
                      href="https://limbu.ai"
                      target="_blank"
                      className="text-[#FDE047] underline"
                    >
                      limbu.ai
                    </a>
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-sm text-white/40 pt-6 border-t border-white/10">
                <p>
                  By using our platform, you agree to our policies.
                </p>
                <p className="mt-2">
                  © {new Date().getFullYear()} Limbu AI. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}