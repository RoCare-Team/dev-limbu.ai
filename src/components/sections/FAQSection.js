
"use client"

export default function FAQSection() {

  const faqs = [
    {
      question: "What is Limbu.ai and how does it help Local SEO?",
      answer:
        "Limbu.ai is an AI marketing platform that automates Google Business Profile activity. By consistently posting updates and replying to reviews instantly (two major Google ranking factors), it helps improve your visibility in local \"near me\" search results."
    },
    {
      question: "Is it safe to connect my Google and Facebook accounts?",
      answer:
        "Yes. Limbu.ai uses official, secure OAuth interactions directly approved by Google and Meta. We never store your passwords, and our connection is encrypted with enterprise-grade security."
    },
    {
      question: "Can I manage multiple locations for different clients?",
      answer:
        "Absolutely. Limbu.ai is designed for scale. You can toggle between different brands or locations within the same dashboard, making it the perfect tool for digital agencies."
    },
    {
      question: "Does Limbu.ai actually write the content for me?",
      answer:
        "Yes. Our generative AI helps create captions, suggest hashtags, and draft review replies. You always have full control to edit or approve content before it goes live."
    }
  ]

  return (
    <section id="faq" className="py-24 bg-slate-50">

      <div className="container mx-auto px-6 max-w-3xl">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            ❓ Frequently Asked Questions
          </h2>

          <p className="text-slate-500">
            Optimized for Voice Search & "People Also Ask"
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">

          {faqs.map((faq, index) => (
            <details
              key={index}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group transition-all duration-300 open:shadow-md"
            >
              <summary className="text-lg font-bold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                {faq.question}
                <span className="text-blue-500 transition-transform duration-300 group-open:rotate-180">
                  ▼
                </span>
              </summary>

              <div className="mt-4 text-slate-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}

        </div>
      </div>
    </section>
  )
}
