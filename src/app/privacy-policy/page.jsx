"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";


export default function PolicyPage() {

  const router = useRouter();


  const handleBack = () => {
    router.back();
  };
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 py-10 px-6 flex flex-col items-center">
      <button
        onClick={handleBack}
        className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 hover:text-blue-600"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="font-medium">Back</span>
      </button>
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-neutral-700 mb-4 text-center">
          Privacy Policy, Terms of Service & Refund Policy
        </h1>

        <p className="text-gray-600 text-center mb-8">
          Effective Date: 31 October 2025
        </p>

        {/* INTRO */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            1. Introduction
          </h2>
          <p>
            Welcome to <strong>Limbu AI</strong> (“we”, “our”, “us”). We value
            your privacy and are committed to protecting your personal
            information. This document explains how we collect, use, and
            safeguard your data when you use our services, including any
            payments made through Razorpay.
          </p>
        </section>

        {/* INFORMATION COLLECTION */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            2. Information We Collect
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Personal details such as name, email, phone number, and address.
            </li>
            <li>
              Billing and payment details when you make payments via Razorpay.
            </li>
            <li>
              Usage data like IP address, browser type, and device information.
            </li>
          </ul>
        </section>

        {/* HOW WE USE */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide and manage our SaaS platform services.</li>
            <li>To process secure online payments via Razorpay.</li>
            <li>To send updates, invoices, and important account information.</li>
            <li>To improve our services and customer experience.</li>
          </ul>
        </section>

        {/* PAYMENT SECURITY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            4. Payment and Security
          </h2>
          <p>
            All payments are processed securely through{" "}
            <strong>Razorpay</strong>. We do not store your card or bank details
            on our servers. Razorpay’s secure gateway encrypts your sensitive
            information using SSL encryption and PCI DSS compliance.
          </p>
          <p className="mt-2">
            For Razorpay’s privacy policy, visit:{" "}
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              className="text-blue-600 underline"
            >
              https://razorpay.com/privacy/
            </a>
          </p>
        </section>

        {/* TERMS OF SERVICE */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            5. Terms of Service
          </h2>
          <p>
            By accessing or using our platform, you agree to comply with our
            Terms of Service. You agree not to misuse the platform, share false
            information, or engage in any activity that violates applicable
            laws. All payments made through Razorpay are subject to verification
            and confirmation. Misuse of our website or fraudulent activity will
            lead to suspension of service.
          </p>
        </section>

        {/* REFUND POLICY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            6. Refund & Cancellation Policy
          </h2>
          <p>
            Payments made for our SaaS platform are non-refundable once the
            service has been activated. In case of duplicate transactions or
            billing errors, please contact our support team within 7 working
            days for resolution. Refunds (if approved) will be processed within
            7 business days to the original payment method.
          </p>
        </section>

        {/* DATA SECURITY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            7. Data Protection
          </h2>
          <p>
            We follow industry-standard practices to protect your personal
            information from unauthorized access, alteration, or disclosure.
            However, no online platform can guarantee 100% security. You are
            responsible for safeguarding your account credentials.
          </p>
        </section>

        {/* THIRD PARTY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            8. Third-Party Services
          </h2>
          <p>
            Our platform may contain links or integrations to third-party
            services such as Razorpay, Google APIs, or analytics tools. We are
            not responsible for their content or privacy practices. Please
            review their policies before using such services.
          </p>
        </section>

        {/* CONTACT INFO */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            9. Contact Information
          </h2>
          <p>
            For questions or concerns about our Privacy Policy, Terms of Service
            or Refund Policy, please contact us:
          </p>

          <div className="mt-3 space-y-1">
            <p>
              📧 <strong>Email:</strong>  info@limbu.ai
            </p>
            <p>
              📞 <strong>Phone:</strong> +91 9289344726
            </p>
            <p>
              🏢 <strong>Address:</strong> Unit No. 831, 8th Floor, JMD MEGAPOLIS, Sector 48, Gurugram, Haryana 122018
            </p>
            <p>
              🌐 <strong>Website:</strong>{" "}
              <a
                href="https://limbu.ai"
                target="_blank"
                className="text-blue-600 underline"
              >
                https://limbu.ai
              </a>
            </p>
          </div>
        </section>

        {/* CONSENT */}
        <section className="mt-8 border-t pt-4 text-sm text-gray-600">
          <p>
            By using our SaaS platform and making payments through Razorpay, you
            consent to our Privacy Policy, Terms of Service, and Refund Policy.
          </p>
          <p className="mt-2 text-center text-gray-500">
            © {new Date().getFullYear()} Limbu AI. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
