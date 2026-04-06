"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: "var(--cyber-black)" }}>
      
      {/* ✅ Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="grow pt-24 pb-20 px-6 flex flex-col items-center">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="group flex items-center cursor-pointer gap-2 mb-8 px-6 py-3 rounded-full border border-white/10 hover:border-[#FDE047] transition-all duration-300 bg-white/5 hover:bg-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5 text-[#FDE047] group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        {/* Card */}
        <div 
          className="max-w-4xl w-full rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl"
          style={{ backgroundColor: "rgba(14, 14, 14, 0.9)" }}
        >
          
          {/* Title */}
          <h1 
            className="text-4xl md:text-5xl font-normal uppercase mb-4 text-center"
            style={{ fontFamily: "Anton, Impact, sans-serif", color: "#FDE047" }}
          >
            Terms & Conditions
          </h1>

          <p className="text-center text-white/40 mb-12 uppercase tracking-widest text-sm">
            Effective Date: 31 October 2025
          </p>

          <div className="space-y-10 leading-relaxed text-white/70">

            {[
              { title: "1. Introduction", content: "Welcome to Limbu.ai (“we”, “our”, “us”). By accessing or using our SaaS platform, website, or mobile application, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please discontinue using our services immediately." },
              { title: "2. Services", content: "Our SaaS platform provides AI-powered automation tools and digital business management solutions. These services are offered on a subscription or usage basis as per the plan selected by the customer." },
              { title: "3. User Account", content: "You are responsible for maintaining the confidentiality of your account credentials and all activities under your account. We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent or abusive activity." },
              { title: "4. Payments and Billing", content: "All payments for our services are securely processed through Razorpay. By completing a payment, you authorize Razorpay to debit your account for the selected plan or service. We do not store or have access to your credit/debit card details. For Razorpay’s official terms, visit https://razorpay.com/terms/" },
              { title: "5. Refund & Cancellation Policy", content: "All payments made towards subscriptions or services are final and non-refundable. In case of duplicate payments or transaction errors, please contact our support team within 7 business days for review and resolution." },
              { title: "6. Intellectual Property", content: "All content, trademarks, software, and data available on our SaaS platform are owned by or licensed to Limbu.ai. Users may not copy, modify, distribute, or use any part of the platform without prior written permission." },
              { title: "7. Limitation of Liability", content: "While we strive to provide uninterrupted and reliable services, we do not guarantee error-free or continuous operation. We are not liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services." },
              { title: "8. Termination of Service", content: "We reserve the right to suspend or terminate user accounts that violate these terms or misuse our services. Upon termination, access to all paid features will be revoked without refund." },
              { title: "9. Governing Law", content: "These Terms and Conditions are governed by the laws of India. Any disputes arising from or related to these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India." }
            ].map((section, idx) => (
              <section key={idx}>
                <h2 className="text-2xl font-normal uppercase mb-4 text-white" style={{ fontFamily: "Inter, Impact, sans-serif" }}>{section.title}</h2>
                <p>{section.content}</p>
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-normal uppercase mb-4 text-white" style={{ fontFamily: "Inter, Impact, sans-serif" }}>10. Contact Us</h2>
              <p className="mb-4">For any questions or concerns, please contact us:</p>

              <div className="mt-3 space-y-2 text-[#FDE047]">
                <p>📧 <strong>Email:</strong> <a href="mailto:info@limbu.ai" className="underline">info@limbu.ai</a></p>
                <p>📞 <strong>Phone:</strong> +91 9289344726</p>
                <p>🌐 <strong>Website:</strong> <a href="https://limbo.ai/contact" className="underline">https://limbo.ai/contact</a></p>
              </div>
            </section>

            <section className="mt-12 border-t border-white/10 pt-8 text-sm text-white/50 text-center">
              <p>
                By using our SaaS platform, you acknowledge that you have read,
                understood, and agreed to these Terms & Conditions.
              </p>
              <p className="mt-4">
                © {new Date().getFullYear()} Limbu.ai. All rights reserved.
              </p>
            </section>

          </div>
        </div>
      </div>

      {/* ✅ Footer */}
      <FooterSection />
    </div>
  );
}