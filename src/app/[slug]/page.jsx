import dbConnect from "@/lib/dbConnect";
import Site from "@/models/Site";

/* =========================================
   Fetch Site Data + Google Media
========================================= */
async function getSiteData(slug) {
  if (!slug) return null;

  try {
    await dbConnect();
    const site = await Site.findOne({ slug }).lean();
    if (!site) return null;

    let googleImages = [];

    const business = site.business || {};

    /* ================= GOOGLE MEDIA FETCH ================= */
    if (
      business?.accountId &&
      business?.locationId &&
      site?.googleAccessToken
    ) {
      try {
        const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${business.accountId}/locations/${business.locationId}/media`;

        const mediaRes = await fetch(mediaUrl, {
          headers: {
            Authorization: `Bearer ${site.googleAccessToken}`,
          },
          cache: "no-store",
        });

        const mediaData = await mediaRes.json();

        if (mediaRes.ok) {
          googleImages =
            mediaData.mediaItems
              ?.filter((item) => item.mediaFormat === "PHOTO")
              ?.map((item) => item.sourceUrl) || [];
        } else {
          console.log("Google media error:", mediaData);
        }
      } catch (err) {
        console.log("Media fetch error:", err);
      }
    }

    return JSON.parse(
      JSON.stringify({
        ...site,
        googleImages,
      })
    );
  } catch (error) {
    console.error("Fetch Site Error:", error);
    return null;
  }
}

/* =========================================
   SEO META
========================================= */
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  const site = await getSiteData(slug);
console.log("slug",slug,site);

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
   PAGE
========================================= */
export default async function SitePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  const siteData = await getSiteData(slug);

  if (!siteData) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-3xl font-bold">Site Not Found</h1>
      </div>
    );
  }

  const business = siteData.business || {};
  const aiContent = siteData.aiContent || {};
  const theme = aiContent?.theme || {};

  /* ================= MEDIA ================= */
  const mediaImages =
    siteData.googleImages?.length > 0
      ? siteData.googleImages
      : siteData.mediaImages || [];

  const heroImage =
    mediaImages[0] ||
    `https://source.unsplash.com/1600x900/?${
      business?.primaryCategory || "business"
    }`;

  return (
    <div className="font-sans text-gray-800">

      {/* ================= HERO ================= */}
      <section
        className="relative text-white min-h-screen flex items-center justify-center text-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-indigo-900/75 to-purple-900/85"></div>

        {/* LOGO */}
        {business?.logoUrl && (
          <div className="absolute top-6 left-6 z-20">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <img
                src={business.logoUrl}
                alt="logo"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 px-6 max-w-5xl mx-auto py-20">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            {aiContent?.hero?.headline || business?.title}
          </h1>

          {aiContent?.hero?.subheadline && (
            <p className="text-xl md:text-2xl mb-8">
              {aiContent.hero.subheadline}
            </p>
          )}

          <div className="flex gap-4 justify-center flex-wrap">
            {business?.phoneNumbers?.primaryPhone && (
              <a
                href={`tel:${business.phoneNumbers.primaryPhone}`}
                className="bg-white text-black px-8 py-4 rounded-full font-bold"
              >
                Call Now
              </a>
            )}

            {business?.phoneNumbers?.primaryPhone && (
              <a
                href={`https://wa.me/${business.phoneNumbers.primaryPhone}`}
                target="_blank"
                className="bg-green-600 text-white px-8 py-4 rounded-full font-bold"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      {aiContent?.about?.content && (
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              {aiContent?.about?.title || "About Us"}
            </h2>
            <p className="text-lg text-gray-700 whitespace-pre-wrap">
              {aiContent.about.content}
            </p>
          </div>
        </section>
      )}

      {/* ================= SERVICES ================= */}
      {Array.isArray(aiContent?.services) &&
        aiContent.services.length > 0 && (
          <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16">
                Our Services
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {aiContent.services.map((service, i) => (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-2xl shadow-lg"
                  >
                    <h3 className="text-xl font-bold mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ================= GALLERY ================= */}
      {mediaImages.length > 0 && (
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              Gallery
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaImages.slice(0, 12).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CONTACT ================= */}
      <section className="py-24 px-6 bg-black text-white text-center">
        <h2 className="text-4xl font-bold mb-6">
          Contact Us
        </h2>

        {business?.phoneNumbers?.primaryPhone && (
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href={`tel:${business.phoneNumbers.primaryPhone}`}
              className="bg-white text-black px-8 py-4 rounded-full font-bold"
            >
              Call Now
            </a>

            <a
              href={`https://wa.me/${business.phoneNumbers.primaryPhone}`}
              target="_blank"
              className="bg-green-600 text-white px-8 py-4 rounded-full font-bold"
            >
              WhatsApp
            </a>
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 bg-gray-900 text-center text-gray-400">
        © {new Date().getFullYear()} {business?.title}
      </footer>
    </div>
  );
}
