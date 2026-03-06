import { MongoClient } from "mongodb";

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please define MONGODB_URI in .env");
  if (process.env.NODE_ENV === "development") {
    if (!global._reviewPageClientPromise) {
      global._reviewPageClientPromise = new MongoClient(uri).connect();
    }
    return global._reviewPageClientPromise;
  }
  if (!global._reviewPageClientPromise) {
    global._reviewPageClientPromise = new MongoClient(uri).connect();
  }
  return global._reviewPageClientPromise;
}

// ✅ Slug generator
function createSlug(title = "", locality = "", address = "") {
  return `${title}${locality ? `-${locality}` : ""}${address ? `-${address}` : ""}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req, context) {
  try {
    let slug = context?.params?.slug;

    if (!slug) {
      const pathname = req.nextUrl.pathname;
      slug = pathname.split("/").pop();
    }

    slug = decodeURIComponent(slug || "").trim();

    if (!slug) {
      return Response.json({ error: "Slug is required" }, { status: 400 });
    }

    console.log("🔍 Incoming slug:", slug);

    const client = await getClientPromise();
    const db = client.db("test");
    const collection = db.collection("adminbusinesses");

    const businesses = await collection.find({}).toArray();

    let matchedListing = null;
    let matchedAccountName = "";

    for (const business of businesses) {
      if (!Array.isArray(business.listings)) continue;

      for (const listing of business.listings) {
        const title = (listing.title || "").trim();
        const locality =
          listing.storefrontAddress?.locality?.trim() || "";
        const address =
          listing.storefrontAddress?.addressLines?.[0]?.trim() || "";

        if (!title) continue;

        const fullSlug = createSlug(title, locality, address);
        const shortSlug = createSlug(title, locality);

        console.log(
          `Compare → full: ${fullSlug} | short: ${shortSlug}`
        );

        // ✅ Strong matching logic
        if (
          slug === fullSlug ||
          slug === shortSlug ||
          fullSlug.startsWith(slug) ||
          shortSlug.startsWith(slug)
        ) {
          matchedListing = listing;
          matchedAccountName = business.accountName || "";
          break;
        }
      }

      if (matchedListing) break;
    }

    if (!matchedListing) {
      return Response.json(
        { error: "Business location not found", slug },
        { status: 404 }
      );
    }

    return Response.json({
      title: matchedListing.title || "",
      locality:
        matchedListing.storefrontAddress?.locality || "",
      locationId: matchedListing.name || "",
      placeId:
        matchedListing.metadata?.placeId || "",
      newReviewUri:
        matchedListing.metadata?.newReviewUri || null,
      accountName: matchedAccountName,
      primaryCategory:
        matchedListing.categories?.primaryCategory
          ?.displayName || "",
      additionalCategories:
        matchedListing.categories?.additionalCategories?.map(
          (cat) => cat.displayName
        ) || [],
      websiteUri: matchedListing.websiteUri || null,
      accountId: matchedListing.accountId || null,
      phoneNumbers:
        matchedListing.phoneNumbers || null,
      storefrontAddress:
        matchedListing.storefrontAddress || null,
    });

  } catch (error) {
    console.error("❌ Review API Error:", error);

    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
