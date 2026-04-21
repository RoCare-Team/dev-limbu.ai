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

    let bestMatch = null;
    let highestScore = 0;
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

        let currentScore = 0;

        // Scoring system to find the best match
        if (slug === fullSlug) {
          currentScore = 4; // Exact match on full legacy slug
        } else if (slug === shortSlug) {
          currentScore = 3; // Exact match on title + locality
        } else if (fullSlug.startsWith(slug)) {
          currentScore = 2; // Prefix match on full slug (for our new conflict-resolved slug)
        } else if (shortSlug.startsWith(slug)) {
          currentScore = 1; // Prefix match on short slug
        }

        if (currentScore > highestScore) {
          highestScore = currentScore;
          bestMatch = listing;
          matchedAccountName = business.accountName || "";
        }
      }
    }

    if (!bestMatch) {
      return Response.json(
        { error: "Business location not found", slug },
        { status: 404 }
      );
    }

    return Response.json({
      title: bestMatch.title || "",
      locality: bestMatch.storefrontAddress?.locality || "",
      locationId: bestMatch.name || "",
      placeId: bestMatch.metadata?.placeId || "",
      newReviewUri: bestMatch.metadata?.newReviewUri || null,
      accountName: matchedAccountName,
      primaryCategory: bestMatch.categories?.primaryCategory?.displayName || "",
      additionalCategories: bestMatch.categories?.additionalCategories?.map((cat) => cat.displayName) || [],
      websiteUri: bestMatch.websiteUri || null,
      accountId: bestMatch.accountId || null,
      phoneNumbers: bestMatch.phoneNumbers || null,
      storefrontAddress: bestMatch.storefrontAddress || null,
    });

  } catch (error) {
    console.error("❌ Review API Error:", error);

    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
