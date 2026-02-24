import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";
import { Phone, MapPin, MessageCircle } from "lucide-react";
import { SiteAnimations } from "@/components/Siteclientcomponents";
import NavBar from "@/components/websiteNavbar"; // <-- new client component below

/* ================================
   Helper: WhatsApp link
================================ */
function getWhatsAppLink(phone) {
  if (!phone) return "#";
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}`;
}

/* ================================
   Fetch site + google media
================================ */
async function getSiteData(slug) {
  if (!slug) return null;
  try {
    await dbConnect();
    const site = await Site.findOne({ slug }).lean();
    if (!site) return null;

    let googleImages = [];
    const business = site.business || {};

    if (business?.accountId && business?.locationId && site?.googleAccessToken) {
      try {
        const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${business.accountId}/locations/${business.locationId}/media`;
        const res = await fetch(mediaUrl, {
          headers: { Authorization: `Bearer ${site.googleAccessToken}` },
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok) {
          googleImages =
            data.mediaItems
              ?.filter((i) => i.mediaFormat === "PHOTO")
              ?.map((i) => i.sourceUrl) || [];
        }
      } catch (e) {
        console.log("Media error", e);
      }
    }

    return JSON.parse(JSON.stringify({ ...site, googleImages }));
  } catch (e) {
    console.log(e);
    return null;
  }
}

/* ================================
   SEO
================================ */
export async function generateMetadata({ params }) {
  const p = await params;
  const site = await getSiteData(p?.slug);
  if (!site)
    return { title: "Business Website", description: "Professional business website" };
  return {
    title: site?.aiContent?.meta?.title || site?.business?.title,
    description: site?.aiContent?.meta?.description || "Business website",
  };
}

/* ================================
   PAGE
================================ */
export default async function SitePage({ params }) {
  const p = await params;
  const slug = p?.slug;

  const siteData = await getSiteData(slug);
  if (!siteData)
    return <div className="p-20 text-center">Site Not Found</div>;

  const business = siteData.business || {};
  const aiContent = siteData.aiContent || {};

  const mediaImages =
    siteData.googleImages?.length > 0
      ? siteData.googleImages
      : siteData.mediaImages || [];

  const heroImage =
    mediaImages[0] ||
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

  /* Nav items — show only sections that have real data */
  const navItems = [
    { label: "Home", href: "#home" },
    ...(aiContent?.about?.content ? [{ label: "About", href: "#about" }] : []),
    ...(aiContent?.services?.length > 0 ? [{ label: "Services", href: "#services" }] : []),
    ...(mediaImages.length > 3 ? [{ label: "Gallery", href: "#gallery" }] : []),
    { label: "Contact", href: "#contact" },
  ];

  /* Gallery: show only how many images exist, max 8 */
  const galleryImages = mediaImages.slice(0, 8);

  return (
    <div className="font-sans text-gray-800 min-h-screen bg-white">

      {/* ── NavBar (client component) ── */}
      <NavBar
        logo={business?.logoUrl}
        title={business?.title}
        navItems={navItems}
        phone={business?.phoneNumbers?.primaryPhone}
        whatsappLink={getWhatsAppLink(business?.phoneNumbers?.primaryPhone)}
      />

      {/* ── Floating WhatsApp Button ── */}
      {business?.phoneNumbers?.primaryPhone && (
        <a
          href={getWhatsAppLink(business.phoneNumbers.primaryPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-6 bottom-28 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:opacity-90 transition-all transform hover:scale-110 group animate-bounce-slow"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
            Chat with us on WhatsApp
          </span>
        </a>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="home"
        className="relative text-white min-h-screen flex items-center justify-center text-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Enhanced Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-indigo-900/75 to-purple-900/85" />

        {/* Animated Blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Logo — Top Left (hidden on mobile since navbar shows it) */}
        {business?.logoUrl && (
          <div className="absolute top-6 left-6 z-20 hidden md:block">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <img
                src={business.logoUrl}
                alt={`${business.title} Logo`}
                className="h-16 w-auto max-w-[200px] object-contain"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 px-6 max-w-6xl mx-auto w-full py-20 space-y-8 mt-16">
          <h1 className="text-5xl md:text-7xl lg:text-6xl font-extrabold tracking-tight drop-shadow-2xl leading-tight">
            {aiContent.hero?.headline || business?.title}
          </h1>
          <p className="text-xl md:text-3xl text-gray-100 leading-relaxed drop-shadow-lg font-light">
            {aiContent.hero?.subheadline}
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${business.phoneNumbers?.primaryPhone}`}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-10 py-5 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
            >
              <Phone className="w-6 h-6" />
              {aiContent.hero?.ctaPrimary || "Call Now"}
            </a>
            <a
              href={getWhatsAppLink(business.phoneNumbers?.primaryPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white px-10 py-5 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ABOUT SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {aiContent?.about?.content && (
        <section id="about" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block">
                <span
                  className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                  style={{ color: "#2563eb" }}
                >
                  About Us
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {aiContent.about?.title || "About Us"}
                </h2>
              </div>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap text-center">
                {aiContent.about.content}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SERVICES SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {aiContent.services?.length > 0 && (
        <section id="services" className="py-32 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span
                className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                style={{ color: "#2563eb" }}
              >
                What We Offer
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our comprehensive range of professional services designed to meet your needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiContent.services.map((service, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2"
                >
                  <div className="h-64 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <img
                      src={
                        mediaImages[i + 1] ||
                        `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80`
                      }
                      alt={service.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-8">
                    <h3 className="font-bold text-2xl mb-4 text-gray-900 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GALLERY SECTION
          — only shown if images exist (> 3), shows max 8
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {galleryImages.length > 3 && (
        <section id="gallery" className="py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span
                className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                style={{ color: "#2563eb" }}
              >
                Our Work
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Gallery</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Take a look at our projects and the quality of work we deliver
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <span className="text-white font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      View Image
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CUSTOM SECTIONS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {aiContent.customSections?.map((section, i) => (
        <section
          key={i}
          className="py-32 px-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50"
        >
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-12">
              <span
                className="font-semibold text-sm uppercase tracking-wider mb-4 block"
                style={{ color: "#2563eb" }}
              >
                Additional Info
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {section.title}
              </h2>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          </div>
        </section>
      ))}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTACT FORM SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span
              className="font-semibold text-sm uppercase tracking-wider mb-4 block"
              style={{ color: "#2563eb" }}
            >
              Get In Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Request a Free Quote
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information Card */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-10 rounded-3xl text-white shadow-2xl">
                <h3 className="text-3xl font-bold mb-6">Contact Information</h3>
                <p className="text-blue-100 mb-8 text-lg">
                  Feel free to reach out to us through any of these channels
                </p>
                <div className="space-y-6">
                  {business?.phoneNumbers?.primaryPhone && (
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Phone</p>
                        <a
                          href={`tel:${business.phoneNumbers.primaryPhone}`}
                          className="text-blue-100 hover:text-white transition"
                        >
                          {business.phoneNumbers.primaryPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {(business?.storefrontAddress?.addressLines?.[0] || business?.address) && (
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Address</p>
                        <p className="text-blue-100">
                          {business.storefrontAddress?.addressLines?.[0] || business.address}
                          {business.locality && `, ${business.locality}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {business?.phoneNumbers?.primaryPhone && (
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">WhatsApp</p>
                        <a
                          href={getWhatsAppLink(business.phoneNumbers.primaryPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-100 hover:text-white transition"
                        >
                          Chat with us instantly
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-white/20">
                  <p className="text-blue-100 text-sm mb-4">Connect with us</p>
                  <div className="flex gap-4">
                    {business?.phoneNumbers?.primaryPhone && (
                      <a
                        href={getWhatsAppLink(business.phoneNumbers.primaryPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 hover:bg-white/30 p-3 rounded-xl backdrop-blur-sm transition"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
              <form
                className="space-y-6"
                action={`https://wa.me/${business?.phoneNumbers?.primaryPhone?.replace(/\D/g, "")}`}
                method="GET"
                target="_blank"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      placeholder="Your phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Required
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition appearance-none bg-white"
                  >
                    <option value="">Select a service</option>
                    {aiContent.services?.map((service, i) => (
                      <option key={i} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition resize-none"
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <a
                  href={getWhatsAppLink(business?.phoneNumbers?.primaryPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send via WhatsApp
                </a>

                <p className="text-sm text-gray-500 text-center">
                  Your message will be sent via WhatsApp
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTACT SECTION (dark)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-32 px-6 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span
              className="font-semibold text-sm uppercase tracking-wider mb-4 block"
              style={{ color: "#818cf8" }}
            >
              Get In Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're here to help and answer any question you might have
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {(business?.storefrontAddress?.addressLines?.[0] || business?.address) && (
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 p-4 rounded-xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {business.storefrontAddress?.addressLines?.[0] || business.address}
                      {business.locality && `, ${business.locality}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {business?.phoneNumbers?.primaryPhone && (
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-500 p-4 rounded-xl">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Call Us</h3>
                    <a
                      href={`tel:${business.phoneNumbers.primaryPhone}`}
                      className="text-gray-300 hover:text-white transition-colors text-lg"
                    >
                      {business.phoneNumbers.primaryPhone}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {business?.phoneNumbers?.primaryPhone && (
            <div className="text-center mt-12 flex flex-wrap justify-center gap-4">
              <a
                href={`tel:${business.phoneNumbers.primaryPhone}`}
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl hover:shadow-white/20"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
              <a
                href={getWhatsAppLink(business.phoneNumbers.primaryPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="py-12 bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-400">
                © {new Date().getFullYear()}{" "}
                <span className="text-white font-semibold">{business.title}</span>. All rights
                reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Powered by Limbu AI</span>
              <div className="h-4 w-px bg-gray-700" />
              <span className="text-gray-500 text-sm">Professional Website</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GLOBAL ANIMATION STYLES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SiteAnimations />
    </div>
  );
}