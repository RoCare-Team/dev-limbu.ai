"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";


export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-neutral-600 mb-4 text-center">
          Terms & Conditions
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Effective Date: 31 October 2025
        </p>

        {/* INTRODUCTION */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            1. Introduction
          </h2>
          <p>
            Welcome to <strong>Limbo AI</strong> (“we”, “our”, “us”). By
            accessing or using our SaaS platform, website, or mobile application,
            you agree to comply with and be bound by these Terms and Conditions.
            If you do not agree, please discontinue using our services
            immediately.
          </p>
        </section>

        {/* SERVICES */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            2. Services
          </h2>
          <p>
            Our SaaS platform provides AI-powered automation tools and digital
            business management solutions. These services are offered on a
            subscription or usage basis as per the plan selected by the customer.
          </p>
        </section>

        {/* ACCOUNT */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            3. User Account
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and all activities under your account. We
            reserve the right to suspend or terminate accounts that violate our
            terms or engage in fraudulent or abusive activity.
          </p>
        </section>

        {/* PAYMENTS */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            4. Payments and Billing
          </h2>
          <p>
            All payments for our services are securely processed through{" "}
            <strong>Razorpay</strong>. By completing a payment, you authorize
            Razorpay to debit your account for the selected plan or service. We
            do not store or have access to your credit/debit card details.
          </p>
          <p className="mt-2">
            For Razorpay’s official terms, visit{" "}
            <a
              href="https://razorpay.com/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              https://razorpay.com/terms/
            </a>
          </p>
        </section>

        {/* REFUND POLICY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            5. Refund & Cancellation Policy
          </h2>
          <p>
            All payments made towards subscriptions or services are final and
            non-refundable. In case of duplicate payments or transaction errors,
            please contact our support team within 7 business days for review
            and resolution.
          </p>
        </section>

        {/* INTELLECTUAL PROPERTY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            6. Intellectual Property
          </h2>
          <p>
            All content, trademarks, software, and data available on our SaaS
            platform are owned by or licensed to <strong>Limbo AI</strong>.
            Users may not copy, modify, distribute, or use any part of the
            platform without prior written permission.
          </p>
        </section>

        {/* LIMITATION OF LIABILITY */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            7. Limitation of Liability
          </h2>
          <p>
            While we strive to provide uninterrupted and reliable services, we
            do not guarantee error-free or continuous operation. We are not
            liable for any indirect, incidental, or consequential damages
            resulting from the use or inability to use our services.
          </p>
        </section>

        {/* TERMINATION */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            8. Termination of Service
          </h2>
          <p>
            We reserve the right to suspend or terminate user accounts that
            violate these terms or misuse our services. Upon termination, access
            to all paid features will be revoked without refund.
          </p>
        </section>

        {/* GOVERNING LAW */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            9. Governing Law
          </h2>
          <p>
            These Terms and Conditions are governed by the laws of India. Any
            disputes arising from or related to these terms shall be subject to
            the exclusive jurisdiction of the courts in New Delhi, India.
          </p>
        </section>

        {/* CONTACT DETAILS */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            10. Contact Us
          </h2>
          <p>For any questions or concerns, please contact us:</p>

          <div className="mt-3 space-y-1">
            <p>
              📧 <strong>Email:</strong>{" "}
              <a
                href="mailto: info@limbu.ai"
                className="text-blue-600 underline"
              >
                 info@limbu.ai
              </a>
            </p>
            <p>
              📞 <strong>Phone:</strong> +91 9289344726
            </p>
            <p>
              🌐 <strong>Website:</strong>{" "}
              <a
                href="https://limbo.ai/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                https://limbo.ai/contact
              </a>
            </p>
          </div>
        </section>

        {/* CONSENT */}
        <section className="mt-8 border-t pt-4 text-sm text-gray-600">
          <p>
            By using our SaaS platform and making payments through Razorpay, you
            acknowledge that you have read, understood, and agreed to these
            Terms & Conditions.
          </p>
          <p className="mt-2 text-center text-gray-500">
            © {new Date().getFullYear()} Limbo AI. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
