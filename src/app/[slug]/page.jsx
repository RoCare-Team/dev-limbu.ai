import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

/* =========================================
   Fetch Site Data (Server Side - Direct DB)
========================================= */
async function getSiteData(slug) {
  if (!slug) return null;

  try {
    await dbConnect();

    const site = await Site.findOne({ slug }).lean();

    if (!site) return null;

    return JSON.parse(JSON.stringify(site));
  } catch (error) {
    console.error("Fetch Site Error:", error);
    return null;
  }
}

/* =========================================
   Dynamic SEO Metadata (Next 15 Safe)
========================================= */
export async function generateMetadata({ params }) {
  const resolvedParams = await params; // ✅ important in Next 15
  const slug = resolvedParams?.slug;

  if (!slug) {
    return {
      title: "Business Website",
      description: "Professional business website",
    };
  }

  const site = await getSiteData(slug);

  if (!site) {
    return {
      title: "Business Website",
      description: "Professional business website",
    };
  }

  return {
    title:
      site?.aiContent?.meta?.title ||
      site?.business?.title ||
      "Business Website",
    description:
      site?.aiContent?.meta?.description ||
      "Business website",
  };
}

/* =========================================
   Page Component
========================================= */
export default async function SitePage({ params }) {
  const resolvedParams = await params; // ✅ Next 15 fix
  const slug = resolvedParams?.slug;

  if (!slug) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-3xl font-bold">Invalid URL</h1>
      </div>
    );
  }

  const siteData = await getSiteData(slug);

  if (!siteData) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-3xl font-bold">Site Not Found</h1>
        <p className="mt-4 text-gray-500">Slug: {slug}</p>
      </div>
    );
  }

  const business = siteData.business || {};
  const aiContent = siteData.aiContent || {};
  const theme = aiContent?.theme || {};

  const mediaImages =
    (siteData.mediaImages || []).filter(
      (img) =>
        typeof img === "string" &&
        img.trim().startsWith("http")
    ) || [];

  const heroImage =
    mediaImages[0] ||
    `https://source.unsplash.com/1600x900/?${
      business?.primaryCategory || "business"
    }`;

  return (
    <div
      className="bg-white text-gray-800"
      style={{
        fontFamily: theme?.font || "sans-serif",
      }}
    >
      {/* ================= HERO ================= */}
      <section
        className="relative text-white py-32 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(${theme?.primaryColor || "#000"}cc, ${
            theme?.secondaryColor || "#000"
          }cc), url(${heroImage})`,
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {aiContent?.hero?.headline || business?.title}
          </h1>

          {aiContent?.hero?.subheadline && (
            <p className="text-xl mb-6">
              {aiContent.hero.subheadline}
            </p>
          )}

          {aiContent?.hero?.ctaPrimary && (
            <a
              href="#contact"
              className="px-6 py-3 bg-white text-black rounded-lg font-semibold"
            >
              {aiContent.hero.ctaPrimary}
            </a>
          )}
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      {aiContent?.about?.content && (
        <section className="py-20 px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            {aiContent?.about?.title || "About Us"}
          </h2>
          <p>{aiContent.about.content}</p>
        </section>
      )}

      {/* ================= SERVICES ================= */}
      {Array.isArray(aiContent?.services) &&
        aiContent.services.length > 0 && (
          <section className="bg-gray-100 py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-10">
                Our Services
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {aiContent.services.map((service, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl shadow"
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

      {/* ================= CONTACT ================= */}
      <section
        id="contact"
        className="text-white py-20 text-center"
        style={{
          backgroundColor:
            theme?.primaryColor || "#000",
        }}
      >
        <h2 className="text-3xl font-bold mb-4">
          {aiContent?.ctaSection?.headline}
        </h2>

        {aiContent?.ctaSection?.subheadline && (
          <p className="mb-6">
            {aiContent.ctaSection.subheadline}
          </p>
        )}

        {business?.phoneNumbers?.primaryPhone && (
          <a
            href={`tel:${business.phoneNumbers.primaryPhone}`}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
          >
            Call Now
          </a>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        © {new Date().getFullYear()} {business?.title}
      </footer>
    </div>
  );
}
