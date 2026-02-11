import { notFound } from "next/navigation";
import { Metadata } from "next";

/**
 * Dynamic metadata generation for SEO
 */
export async function generateMetadata({ params }) {
  const { slug } = params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-site?slug=${slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return {
        title: "Website Not Found",
        description: "This website doesn't exist.",
      };
    }

    const { business, aiContent, metadata } = await res.json();

    return {
      title:
        metadata?.title ||
        `${business.title || "Business"} | Limbu Sites`,
      description:
        metadata?.description ||
        aiContent?.about?.content ||
        `Visit ${business?.title} website`,
      keywords: [
        business?.title,
        business?.locality,
        business?.primaryCategory,
      ]
        .filter(Boolean)
        .join(", "),
      openGraph: {
        type: "website",
        title: metadata?.title || business?.title,
        description:
          metadata?.description || aiContent?.about?.content,
        images: [
          {
            url:
              metadata?.ogImage ||
              `https://source.unsplash.com/1200x630/?${business?.primaryCategory || "business"}`,
            width: 1200,
            height: 630,
            alt: business?.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: metadata?.title || business?.title,
        description:
          metadata?.description || aiContent?.about?.content,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Business Website",
      description: "Visit our website",
    };
  }
}

/**
 * Dynamic site rendering page
 * Handles *.limbu.ai subdomain requests via middleware rewrite
 */
export default async function LivePage({ params }) {
  const { slug } = params;

  // Fetch site data
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-site?slug=${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const { business, aiContent, mediaImages, metadata } =
    await res.json();

  // Use fallback if hero image is missing
  const heroImage =
    mediaImages?.[0] ||
    `https://source.unsplash.com/1600x900/?${business?.primaryCategory || "business"}`;

  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* HERO SECTION */}
      <section
        className="relative text-white py-32 md:py-48 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="relative z-10 px-6 max-w-4xl mx-auto">
          {/* Logo */}
          {business?.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.title || "Logo"}
              className="mx-auto mb-8 h-20 md:h-28 object-contain drop-shadow-lg"
              loading="lazy"
            />
          )}

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-lg">
            {aiContent?.hero?.headline || business?.title}
          </h1>

          {/* Subheadline */}
          {aiContent?.hero?.subheadline && (
            <p className="text-xl md:text-2xl mb-8 drop-shadow-lg opacity-95">
              {aiContent.hero.subheadline}
            </p>
          )}

          {/* CTA Button */}
          {business?.phoneNumbers?.primaryPhone && (
            <a
              href={`tel:${business.phoneNumbers.primaryPhone}`}
              className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105 duration-300"
            >
              {aiContent?.hero?.ctaPrimary || "Call Now"}
            </a>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      {aiContent?.about && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            {aiContent.about.title || "About Us"}
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed text-center max-w-2xl mx-auto">
            {aiContent.about.content}
          </p>
        </section>
      )}

      {/* SERVICES SECTION */}
      {aiContent?.services && aiContent.services.length > 0 && (
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Our Services
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiContent.services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden group"
                >
                  {/* Service Image */}
                  {mediaImages?.[index + 1] && (
                    <div className="overflow-hidden h-48 bg-gray-200">
                      <img
                        src={mediaImages[index + 1]}
                        alt={service.title || "Service"}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Service Info */}
                  <div className="p-6">
                    <h3 className="font-semibold text-xl mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Get in Touch
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Address */}
          {business?.storefrontAddress?.addressLines?.[0] && (
            <div className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="text-2xl mb-2">📍</p>
              <p className="font-semibold mb-2">Address</p>
              <p className="text-gray-600 text-sm">
                {business.storefrontAddress.addressLines[0]}
              </p>
            </div>
          )}

          {/* Phone */}
          {business?.phoneNumbers?.primaryPhone && (
            <div className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="text-2xl mb-2">☎️</p>
              <p className="font-semibold mb-2">Phone</p>
              <a
                href={`tel:${business.phoneNumbers.primaryPhone}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {business.phoneNumbers.primaryPhone}
              </a>
            </div>
          )}

          {/* Email (if available) */}
          {metadata?.contactEmail && (
            <div className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <p className="text-2xl mb-2">✉️</p>
              <p className="font-semibold mb-2">Email</p>
              <a
                href={`mailto:${metadata.contactEmail}`}
                className="text-blue-600 hover:underline text-sm"
              >
                {metadata.contactEmail}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="font-bold text-lg mb-4">{business?.title}</h3>
              <p className="text-gray-400 text-sm">
                {business?.primaryCategory}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              {business?.phoneNumbers?.primaryPhone && (
                <p className="text-sm text-gray-400">
                  <a
                    href={`tel:${business.phoneNumbers.primaryPhone}`}
                    className="hover:text-white transition"
                  >
                    {business.phoneNumbers.primaryPhone}
                  </a>
                </p>
              )}
              {metadata?.contactEmail && (
                <p className="text-sm text-gray-400">
                  <a
                    href={`mailto:${metadata.contactEmail}`}
                    className="hover:text-white transition"
                  >
                    {metadata.contactEmail}
                  </a>
                </p>
              )}
            </div>

            {/* Branding */}
            <div>
              <h4 className="font-semibold mb-4">Powered By</h4>
              <a
                href="https://limbu.ai"
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Limbu Sites
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Build your business website in minutes
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} {business?.title}. All rights
              reserved.
            </p>
            <p className="mt-2 text-xs">
              Created with{" "}
              <a
                href="https://limbu.ai"
                className="text-blue-400 hover:underline"
              >
                Limbu Sites
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
