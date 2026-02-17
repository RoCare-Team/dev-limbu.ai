

"use client"

export default function FeaturesSection({ features }) {

  if (!features || features.length === 0) return null

  return (
    <section className="py-20 bg-gradient-to-br from-white to-slate-50">

      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Powerful Features for
            <span className="bg-primary bg-clip-text text-transparent"> Business Growth</span>
          </h2>
          <p className="text-slate-600 text-lg">
            Everything you need to automate and grow your Google Business profile.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {features?.map((feature, index) => {
            const Icon = feature.icon

            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br bg-primary text-dark mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={28} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}

        </div>

      </div>

    </section>
  )
}
