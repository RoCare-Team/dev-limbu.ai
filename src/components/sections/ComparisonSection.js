
"use client"

import { MessageSquare, Calendar, TrendingUp, Shield, X, CheckCircle } from "lucide-react"

export default function ComparisonSection() {

  return (
    <section id="comparison" className="py-24 bg-white relative overflow-hidden">

      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
            🤖 Why Smart Businesses <br className="hidden md:block" /> 
            Switch to Limbu.ai
          </h2>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            It’s not just automation; it’s reputation management. See the difference.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Card Template Function */}
          {[
            {
              icon: <MessageSquare className="w-7 h-7" />,
              title: "Review Replies",
              old: "Manually typing replies days later, often missing important customer feedback.",
              new: "Instant AI responses that boost SEO and customer satisfaction immediately.",
              bg: "bg-lightPrimary",
              color: "text-dark"
            },
            {
              icon: <Calendar className="w-7 h-7" />,
              title: "Content Planning",
              old: "Switching between 3 different apps and spreadsheets to manage posts.",
              new: "One Unified Calendar for Google, Facebook, & Instagram automation.",
              bg: "bg-lightPrimary",
              color: "text-dark"
            },
            {
              icon: <TrendingUp className="w-7 h-7" />,
              title: "Scalability",
              old: "Struggling to manage just one location effectively without chaos.",
              new: "Managing unlimited locations effortlessly from a single dashboard.",
              bg: "bg-neutral-50",
              color: "text-primary"
            },
            {
              icon: <Shield className="w-7 h-7" />,
              title: "Security",
              old: "Sharing passwords insecurely via email or chat.",
              new: "Official API Integration. 100% Secure & Encrypted.",
              bg: "bg-teal-50",
              color: "text-primary"
            }
          ].map((item, idx) => (

            <div
              key={idx}
              className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group"
            >

              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold text-slate-900">
                  {item.title}
                </h3>
              </div>

              {/* Comparison */}
              <div className="space-y-4">

                {/* Old Way */}
                <div className="flex gap-4 p-4 rounded-2xl bg-neutral-100 border border-dark">
                  <div className="mt-1">
                    <X className="w-5 h-5 text-neutral-900" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-dark uppercase tracking-wide mb-1">
                      The Old Way
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {item.old}
                    </p>
                  </div>
                </div>

                {/* Limbu Way */}
                <div className="flex gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-500"></div>
                  <div className="mt-1">
                    <CheckCircle className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-1">
                      The Limbu.ai Way
                    </div>
                    <p className="text-slate-800 font-semibold text-sm leading-relaxed">
                      {item.new}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          ))}

        </div>
      </div>
    </section>
  )
}
