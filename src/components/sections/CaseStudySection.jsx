import CaseStudyCarousel from "../CaseStudyCarousel";


const caseStudies = [
  {
    id: 1,
    clientName: "Manoj Sharma",
    clientRole: "Founder, Ro-Care India",
    clientImage:
      "https://img.freepik.com/free-photo/portrait-successful-young-businessman-suit-glasses-leaning-railing-modern-office-building_1262-15424.jpg",
    quote:
      "Limbu AI transformed how we handle our digital presence. We've seen a massive surge in local walk-ins since automating our GMB and social media.",
    avgGrowth: "+179%",
    growthData: [
      { name: "GMB", growth: 185, color: "#facc15" },
      { name: "Facebook", growth: 142, color: "#3b82f6" },
      { name: "Instagram", growth: 210, color: "#ec4899" },
    ],
  },
  {
    id: 2,
    clientName: "Amreesh",
    clientRole: "Owner, Banjara Salon",
    clientImage:
      "https://img.freepik.com/free-photo/beautiful-woman-gets-haircut-hairdresser_23-2148835154.jpg",
    quote:
      "Managing reviews and posting updates used to take hours. Now it's on autopilot. Our online bookings have doubled in just 3 months.",
    avgGrowth: "+215%",
    growthData: [
      { name: "GMB", growth: 240, color: "#facc15" },
      { name: "Facebook", growth: 180, color: "#3b82f6" },
      { name: "Instagram", growth: 225, color: "#ec4899" },
    ],
  },
  {
    id: 3,
    clientName: "Anil Kumar",
    clientRole: "Director, Dynamic Drapry",
    clientImage:
      "https://img.freepik.com/free-photo/young-indian-businessman-office_23-2149408985.jpg",
    quote:
      "The multi-location dashboard is a game changer. We manage all 5 of our store locations from one place with perfectly synchronized content.",
    avgGrowth: "+145%",
    growthData: [
      { name: "GMB", growth: 160, color: "#facc15" },
      { name: "Facebook", growth: 120, color: "#3b82f6" },
      { name: "Instagram", growth: 155, color: "#ec4899" },
    ],
  },
];

export default function CaseStudySection() {
  return (
    <section className="py-12 bg-white overflow-hidden border-t border-black/5">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600" />

            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-700">
              Success Stories
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Real Results for{" "}
            <span className="text-yellow-400">Real Businesses</span>
          </h2>
        </div>
      </div>

      <CaseStudyCarousel caseStudies={caseStudies} />
    </section>
  );
}
