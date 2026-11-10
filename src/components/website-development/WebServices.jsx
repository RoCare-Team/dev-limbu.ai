import {
  CreditCard,
  Globe,
  Headset,
  LayoutDashboard,
  Palette,
  ShoppingCart,
  Store,
  TrendingUp,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

const SERVICES = [
  { icon: Globe, title: "Business Website", text: "A professional site that tells customers who you are and how to reach you." },
  { icon: ShoppingCart, title: "E-commerce Store", text: "Sell online with product pages, cart and secure checkout." },
  { icon: Store, title: "Landing Pages", text: "Focused pages for offers and ads that turn visitors into leads." },
  { icon: Palette, title: "Custom UI/UX Design", text: "A unique design made around your brand, not a template." },
  { icon: LayoutDashboard, title: "Admin Panel", text: "Update products, prices and pages yourself, any time." },
  { icon: CreditCard, title: "Payment Gateway", text: "Accept UPI, cards and net banking right on your site." },
  { icon: TrendingUp, title: "SEO & Analytics", text: "SEO-ready pages with Google Analytics set up from day one." },
  { icon: Headset, title: "Support & Maintenance", text: "Updates and fixes after launch, included in every plan." },
];

export default function WebServices() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <SectionHeading
          eyebrow="What we build"
          title="Everything your business needs online"
          text="From your first website to a complete online store, built and looked after by our team."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_20px_40px_-12px_rgba(234,179,8,0.3)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-800 ring-1 ring-slate-200 transition-all duration-300 group-hover:-rotate-6 group-hover:bg-[#facc15] group-hover:text-black group-hover:ring-[#facc15]">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
