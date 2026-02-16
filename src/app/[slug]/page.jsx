import { notFound } from "next/navigation";
import { headers } from "next/headers";

/**
 * Get dynamic base URL (works with subdomains)
 */
function getBaseUrl() {
  const headersList = headers();
  const host = headersList.get("host");

  if (!host) {
    throw new Error("Host header not found");
  }

  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${host}`;
}

/**
 * Fetch site data safely
 */
async function getSiteData(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  try {
    const baseUrl = getBaseUrl();

    const res = await fetch(
      `${baseUrl}/api/get-site?slug=${slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    const siteData = data?.site || data;

    if (!siteData || !siteData?.business?.title) {
      return null;
    }

    return siteData;
  } catch (error) {
    console.error("Error fetching site data:", error);
    return null;
  }
}

/**
 * Dynamic metadata generation
 */
export async function generateMetadata({ params }) {
  const { slug } = params;

  const siteData = await getSiteData(slug);

  if (!siteData) {
    return {
      title: "Website Not Found",
      description: "This website doesn't exist.",
    };
  }

  const business = siteData.business || {};
  const aiContent = siteData.aiContent || {};
  const metadata = siteData.metadata || {};

  return {
    title:
      metadata?.title ||
      `${business?.title || "Business"} | Limbu Sites`,
    description:
      metadata?.description ||
      aiContent?.about?.content ||
      `Visit ${business?.title || "our"} website`,
    keywords: [
      business?.title,
      business?.locality,
      business?.primaryCategory,
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      type: "website",
      title: metadata?.title || business?.title || "Business Website",
      description:
        metadata?.description || aiContent?.about?.content || "",
      images: [
        {
          url:
            metadata?.ogImage ||
            `https://source.unsplash.com/1200x630/?${business?.primaryCategory || "business"}`,
          width: 1200,
          height: 630,
          alt: business?.title || "Business",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata?.title || business?.title || "Business Website",
      description:
        metadata?.description || aiContent?.about?.content || "",
    },
  };
}

/**
 * Live Dynamic Page
 */
export default async function LivePage({ params }) {
  const { slug } = params;

  const siteData = await getSiteData(slug);

  if (!siteData) {
    return notFound();
  }

  const business = siteData.business || {};
  const aiContent = siteData.aiContent || {};
  const mediaImages = siteData.mediaImages || [];
  const metadata = siteData.metadata || {};

  const heroImage =
    mediaImages?.[0] ||
    `https://source.unsplash.com/1600x900/?${business?.primaryCategory || "business"}`;

  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* HERO */}
      <section
        className="relative text-white py-32 md:py-48 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroImage})`,
        }}
      >
        <div className="relative z-10 px-6 max-w-4xl mx-auto">
          {business?.logoUrl && (
            <img
              src={business.logoUrl}
              alt={`${business.title} Logo`}
              className="mx-auto mb-8 h-20 md:h-28 object-contain"
            />
          )}

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {aiContent?.hero?.headline || business?.title}
          </h1>

          {aiContent?.hero?.subheadline && (
            <p className="text-xl md:text-2xl mb-8">
              {aiContent.hero.subheadline}
            </p>
          )}

          {business?.phoneNumbers?.primaryPhone && (
            <a
              href={`tel:${business.phoneNumbers.primaryPhone}`}
              className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              {aiContent?.hero?.ctaPrimary || "Call Now"}
            </a>
          )}
        </div>
      </section>

      {/* ABOUT */}
      {aiContent?.about?.content && (
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            {aiContent.about.title || "About Us"}
          </h2>
          <p className="text-gray-700 text-lg">
            {aiContent.about.content}
          </p>
        </section>
      )}
      

      {/* SERVICES */}
      {Array.isArray(aiContent?.services) &&
        aiContent.services.length > 0 && (
          <section className="bg-gray-50 py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                Our Services
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {aiContent.services.map((service, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow p-6"
                  >
                    <h3 className="font-semibold text-xl mb-3">
                      {service?.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {service?.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* CONTACT */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Get in Touch
        </h2>

        {business?.storefrontAddress?.addressLines?.[0] && (
          <p className="mb-4">
            📍 {business.storefrontAddress.addressLines[0]}
          </p>
        )}

        {business?.phoneNumbers?.primaryPhone && (
          <p className="mb-4">
            ☎️{" "}
            <a
              href={`tel:${business.phoneNumbers.primaryPhone}`}
              className="text-blue-600 hover:underline"
            >
              {business.phoneNumbers.primaryPhone}
            </a>
          </p>
        )}

        {metadata?.contactEmail && (
          <p>
            ✉️{" "}
            <a
              href={`mailto:${metadata.contactEmail}`}
              className="text-blue-600 hover:underline"
            >
              {metadata.contactEmail}
            </a>
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 text-center">
        <p>
          © {new Date().getFullYear()} {business?.title}. All rights reserved.
        </p>
        <p className="text-sm mt-2 text-gray-400">
          Powered by Limbu Sites
        </p>
      </footer>
    </div>
  );
}
