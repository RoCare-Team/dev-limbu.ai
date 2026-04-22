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

// Local helper to generate slug variations
function createSlug(str) {
  if (!str) return "";
  return str
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
    let matchedAccountName = "";
    let highestScore = 0;

    for (const business of businesses) {
      if (!Array.isArray(business.listings)) continue;

      for (const listing of business.listings) {
        const title = (listing.title || "").trim();
        if (!title) continue;

        const locality = listing.storefrontAddress?.locality?.trim() || listing.address?.locality?.trim() || listing.profile?.address?.locality?.trim() || "";
        const addressLines = listing.storefrontAddress?.addressLines || listing.address?.addressLines || [];
        const firstLineAddress = addressLines[0]?.trim() || "";
        
        let subLocality = "";
        if (addressLines.length > 0) {
          const lastLine = addressLines[addressLines.length - 1] || "";
          const parts = lastLine.split(',').map(p => p.trim()).filter(p => p);
          if (parts.length > 0) {
            subLocality = parts[parts.length - 1];
          }
        }

        const idPart = (listing.locationId || listing.name || "00000").substring(0, 5);

        // VARIATION 1: New Universal Slug (Title + Locality + Sub-locality)
        const newUniversalSlug = createSlug(`${title}-${locality}${subLocality ? `-${subLocality}` : ""}`);
        
        // VARIATION 2: Old Short Slug (Title + Locality)
        const oldShortSlug = createSlug(`${title}-${locality}`);
        
        // VARIATION 3: Old Long Slug (Title + Locality + Full First Line Address)
        const oldLongSlug = createSlug(`${title}-${locality}${firstLineAddress ? `-${firstLineAddress}` : ""}`);

        let currentScore = 0;

        // Exact Match Checks (including fallback ID variants)
        if (
          slug === newUniversalSlug || slug === `${newUniversalSlug}-${idPart}` ||
          slug === oldShortSlug || slug === `${oldShortSlug}-${idPart}` ||
          slug === oldLongSlug || slug === `${oldLongSlug}-${idPart}`
        ) {
          currentScore = 10; // Exact match is perfect
        } 
        // Prefix Match Fallback for potentially truncated old QR codes
        else if (oldLongSlug.startsWith(slug)) {
          currentScore = 4;
        } else if (newUniversalSlug.startsWith(slug)) {
          currentScore = 3;
        } else if (oldShortSlug.startsWith(slug)) {
          currentScore = 2;
        }

        // Keep the best scoring match
        if (currentScore > highestScore) {
          highestScore = currentScore;
          bestMatch = listing;
          matchedAccountName = business.accountName || "";
        }

        if (highestScore === 10) break; // Perfect match found, stop inner loop
      }
      if (highestScore === 10) break; // Perfect match found, stop outer loop
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
