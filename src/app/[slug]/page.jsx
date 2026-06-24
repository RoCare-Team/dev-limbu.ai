import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import {
  Phone,
  MapPin,
  MessageCircle,
  Star,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { SiteAnimations } from "@/components/Siteclientcomponents";
import NavBar from "@/components/websiteNavbar";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import WebsiteFooter from "@/components/WebsiteFooter";
import WebsiteLeadForm from "@/components/WebsiteLeadForm";
import { buildLocalBusinessSchema } from "@/lib/websiteSchema";

/* ================================
   Helper: WhatsApp link
================================ */
function getWhatsAppLink(phone) {
  if (!phone) return "#";
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}`;
}

/* ================================
   Fetch site data
================================ */
async function getSiteData(slug) {
  if (!slug) return null;
  try {
    await dbConnect();
    const site = await Site.findOne({ slug }).lean();
    if (!site) return null;
    return JSON.parse(JSON.stringify(site));
  } catch (e) {
    console.error("getSiteData error:", e?.message);
    return null;
  }
}

/* ================================
   SEO Metadata
================================ */
export async function generateMetadata({ params }) {
  const p = await params;
  const site = await getSiteData(p?.slug);
  if (!site) return { title: "Business Website" };

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "limbu.ai";
  return {
    title: site?.aiContent?.meta?.title || site?.business?.title,
    description: site?.aiContent?.meta?.description,
    alternates: { canonical: `https://${p?.slug}.${rootDomain}` },
  };
}

export default async function SitePage({ params }) {
  const p = await params;
  const slug = p?.slug;
  if (!slug) return notFound();

  const siteData = await getSiteData(slug);

  console.log("Site Data for slug:", slug);
  // console.log(siteData);
  if (!siteData) return notFound();

  const business = siteData.business || {};

  console.log(business);
  const aiContent = siteData.aiContent || {};

  // ✅ DYNAMIC THEME EXTRACTION
  const theme = aiContent.theme || {
    primaryColor: "#3E4E50",
    secondaryColor: "#F0A500",
  };
  const primary = theme.primaryColor;
  const secondary = theme.secondaryColor;

  const mediaImages = (siteData.mediaImages || []).filter(Boolean).slice(0, 13);
  const heroImage = mediaImages[0] || null;
  const galleryImages = mediaImages.filter(Boolean);

  const primaryPhone =
    business?.phoneNumbers?.primaryPhone || business?.primaryPhone;
  const address =
    business?.storefrontAddress?.addressLines?.[0] || business?.address || "";
  const locality =
    business?.locality || business?.storefrontAddress?.locality || "";

  const navItems = [
    { label: "Home", href: "#home" },
    ...(aiContent?.about?.content ? [{ label: "About", href: "#about" }] : []),
    ...(aiContent?.services?.length > 0
      ? [{ label: "Services", href: "#services" }]
      : []),
    ...(galleryImages.length >= 1
      ? [{ label: "Gallery", href: "#gallery" }]
      : []),
    ...(aiContent?.testimonials?.length > 0
      ? [{ label: "Reviews", href: "#reviews" }]
      : []),
    { label: "Contact", href: "#contact" },
  ];

  // ✅ SEO: LocalBusiness JSON-LD (use saved schema, else generate on the fly)
  const schemaData =
    siteData.schemaData || buildLocalBusinessSchema(business, aiContent, slug);

  return (
    <div
      className="font-sans text-gray-800 min-h-screen bg-white"
      style={{ "--primary": primary, "--secondary": secondary }}
    >
      {/* ── SEO: schema.org structured data ── */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      {/* ── NavBar ── */}
      <NavBar
        title={business?.title}
        logo={business?.logoUrl}
        navItems={navItems}
        phone={primaryPhone}
        theme={{ primary: primary, secondary: secondary }}
        darkHero={false}
      />

      {/* ── Floating WhatsApp ── */}
      {primaryPhone && (
        <a
          href={getWhatsAppLink(primaryPhone)}
          target="_blank"
          className="fixed right-6 bottom-10 z-50 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 group"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* ━━━━━━━━ HERO SECTION ━━━━━━━━ */}
      <section
        id="home"
        className="relative bg-white text-slate-900 min-h-[95vh] flex items-center overflow-hidden"
      >
        {/* Dynamic Blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full filter blur-3xl -mr-48 -mt-24"
            style={{ backgroundColor: primary }}
          />
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full filter blur-3xl -ml-24 -mb-24"
            style={{ backgroundColor: secondary }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-left space-y-8 animate-fadeIn">
              {business?.primaryCategory && (
                <div
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold border"
                  style={{
                    backgroundColor: `${primary}10`,
                    color: primary,
                    borderColor: `${primary}20`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: secondary }}
                  />
                  {business.primaryCategory} {locality && `• ${locality}`}
                </div>
              )}

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                {aiContent.hero?.headline || business?.title}
              </h1>

              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
                {aiContent.hero?.subheadline}
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <a
                  href={`tel:${primaryPhone}`}
                  className="inline-flex items-center gap-3 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-xl shadow-gray-200"
                  style={{ backgroundColor: primary }}
                >
                  <Phone className="w-5 h-5" />{" "}
                  {aiContent.hero?.ctaPrimary || "Call Now"}
                </a>
                <a
                  href={getWhatsAppLink(primaryPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white border-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 hover:bg-green-50"
                  style={{
                    borderColor: "#25D366", // WhatsApp Green
                    color: "#25D366",
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="lg:w-5/12 w-full flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {heroImage ? (
                  <div className="relative z-10 w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-[12px] border-white">
                    <img
                      src={heroImage}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <img
                      src={business?.logoUrl}
                      className="w-32 grayscale opacity-20"
                      alt="Logo"
                    />
                  </div>
                )}
                <div
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-2xl -z-10"
                  style={{ backgroundColor: `${secondary}20` }}
                />
                <div className="absolute -right-4 top-1/2 bg-white p-4 rounded-2xl shadow-lg z-20 hidden md:block border border-slate-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      className="w-6 h-6"
                      style={{ color: secondary }}
                    />
                    <div className="text-left">
                      <p className="text-xs text-slate-500 font-medium">
                        Verified
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        Business
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FEATURES STRIP ━━━━━━━━ */}
      {aiContent?.features?.length > 0 && (
        <section className="py-5 px-6" style={{ backgroundColor: primary }}>
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3">
            {aiContent.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide"
              >
                <CheckCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: secondary }}
                />{" "}
                {feature}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━ ABOUT SECTION ━━━━━━━━ */}
      {aiContent?.about?.content && (
        <section id="about" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span
                  className="font-bold text-sm uppercase tracking-[0.2em] block mb-3"
                  style={{ color: primary }}
                >
                  About Our Company
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  {aiContent.about?.title || "Providing Quality Materials"}
                </h2>
                <div
                  className="w-20 h-1.5 rounded-full mb-8"
                  style={{ backgroundColor: secondary }}
                />
                <p className="text-lg text-gray-600 leading-relaxed mb-10">
                  {aiContent.about.content}
                </p>
                <a
                  href={`tel:${primaryPhone}`}
                  className="inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg"
                  style={{ backgroundColor: primary }}
                >
                  <Phone className="w-4 h-4" /> Contact Us Today
                </a>
              </div>

              <div
                className="p-10 rounded-[2.5rem] border-2 shadow-sm"
                style={{
                  backgroundColor: `${primary}05`,
                  borderColor: `${primary}10`,
                }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <span
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: secondary }}
                  />
                  Why Choose Us
                </h3>
                <ul className="space-y-6">
                  {aiContent.whyChooseUs?.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div
                        className="p-1.5 rounded-full mt-1"
                        style={{ backgroundColor: `${secondary}20` }}
                      >
                        <CheckCircle
                          className="w-5 h-5"
                          style={{ color: secondary }}
                        />
                      </div>
                      <span className="text-gray-800 font-semibold text-lg">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━ SERVICES SECTION ━━━━━━━━ */}
      {aiContent.services?.length > 0 && (
        <section id="services" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto text-center mb-20">
            <span
              className="font-bold text-sm uppercase tracking-widest block mb-3"
              style={{ color: primary }}
            >
              What We Do
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Our Premium Services
            </h2>
            <div
              className="w-20 h-1.5 mx-auto rounded-full"
              style={{ backgroundColor: secondary }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {aiContent.services.map((service, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group flex flex-col border border-gray-100"
              >
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: i % 2 === 0 ? primary : secondary }}
                />
                <div className="p-10 flex-1 flex flex-col">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white font-black text-xl shadow-lg"
                    style={{ backgroundColor: primary }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-black text-2xl mb-4 text-gray-900">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-base flex-1">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━ GALLERY SECTION ━━━━━━━━ */}
      {galleryImages.length >= 1 && (
        <section id="gallery" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <span
              className="font-bold text-sm uppercase tracking-widest block mb-3"
              style={{ color: primary }}
            >
              Portfolio
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Our Gallery
            </h2>
            <div className="w-20 h-1.5 bg-gray-200 rounded-full mx-auto relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 w-1/2"
                style={{ backgroundColor: secondary }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[250px]">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-[2rem] shadow-md group ${index === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <img
                  src={image}
                  alt="Gallery"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: secondary }}
                  >
                    <Star className="text-white fill-white w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━ TESTIMONIALS ━━━━━━━━ */}
      {aiContent?.testimonials?.length > 0 && (
        <section
          id="reviews"
          className="py-24 px-6"
          style={{ backgroundColor: `${primary}05` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900">
                Trusted by Contractors
              </h2>
              <div className="flex justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 fill-current"
                    style={{ color: secondary }}
                  />
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {aiContent.testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative"
                >
                  <p className="text-gray-700 text-lg leading-relaxed mb-8 italic">
                    "{t.review}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: primary }}
                    >
                      {t.name?.[0]}
                    </div>
                    <span className="font-bold text-xl text-gray-900">
                      {t.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━ FAQ SECTION ━━━━━━━━ */}
      {aiContent?.faq?.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 mb-4">
                Frequently Asked
              </h2>
              <div
                className="w-16 h-1 rounded-full mx-auto"
                style={{ backgroundColor: secondary }}
              />
            </div>
            <div className="space-y-4">
              {aiContent.faq.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-2xl p-8 border border-slate-100 group transition-all hover:bg-white hover:shadow-xl"
                >
                  <h3 className="font-black text-xl text-gray-900 mb-3 flex items-start gap-4">
                    <span className="text-2xl" style={{ color: primary }}>
                      Q.
                    </span>
                    {item.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-10 text-lg">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━ CTA BANNER ━━━━━━━━ */}
      {aiContent?.ctaSection && primaryPhone && (
        <section
          className="py-24 px-6 text-white overflow-hidden relative"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, #111 100%)`,
          }}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20"
            style={{ backgroundColor: secondary }}
          />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-4xl text-white md:text-6xl font-black mb-6 leading-tight">
              {aiContent.ctaSection.headline}
            </h2>
            <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto">
              {aiContent.ctaSection.subheadline}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href={`tel:${primaryPhone}`}
                className="bg-white px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl"
                style={{ color: primary }}
              >
                {aiContent.ctaSection.buttonText || "Call Now"}
              </a>
              <a
                href={getWhatsAppLink(primaryPhone)}
                target="_blank"
                className="bg-green-500 px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━ CONTACT SECTION ━━━━━━━━ */}
      <section id="contact" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            {/* Left: Info */}
            <div
              className="p-12 md:p-16 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between"
              style={{ backgroundColor: primary }}
            >
              <div className="relative z-10">
                <h3 className="text-3xl text-white font-black mb-4">
                  {business?.title}
                </h3>
                <p className="text-white/70 text-xl mb-12">
                  Visit our warehouse or call us for bulk order pricing.
                </p>

                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="bg-white/10 p-5 rounded-2xl">
                      <Phone className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-50">
                        Contact
                      </p>
                      <p className="text-2xl font-bold">{primaryPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="bg-white/10 p-5 rounded-2xl">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-50">
                        Location
                      </p>
                      <p className="text-2xl font-bold">
                        {address}, {locality}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-16 flex gap-4 relative z-10">
                <a
                  href={`tel:${primaryPhone}`}
                  className="flex-1 text-center bg-white py-5 rounded-2xl font-black text-lg shadow-xl"
                  style={{ color: primary }}
                >
                  Call Now
                </a>
                <a
                  href={getWhatsAppLink(primaryPhone)}
                  target="_blank"
                  className="flex-1 text-center bg-green-500 py-5 rounded-2xl font-black text-lg shadow-xl"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Right: Form */}
            <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-xl border border-gray-100">
              <h3 className="text-3xl font-black text-gray-900 mb-10">
                Inquiry Form
              </h3>
              <WebsiteLeadForm
                slug={slug}
                services={aiContent.services || []}
                whatsappUrl={getWhatsAppLink(primaryPhone)}
                primary={primary}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <WebsiteFooter data={siteData} />

      <SiteAnimations />
    </div>
  );
}
