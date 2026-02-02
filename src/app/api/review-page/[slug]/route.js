import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req, { params }) {
  try {
    // Robust slug extraction
    const urlParts = req.url.split("/");
    const slug = decodeURIComponent(
      urlParts[urlParts.length - 1].split("?")[0]
    );

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Searching for slug:", slug);

    await client.connect();
    const db = client.db("test");
    const collection = db.collection("adminbusinesses");

    // Fetch all businesses
    const businesses = await collection.find({}).toArray();
    console.log("Total businesses found:", businesses.length);

    let matchedListing = null;
    let matchedAccountName = "";

    // Loop through businesses
    for (const business of businesses) {
      if (!Array.isArray(business.listings)) continue;

      console.log(
        `🔎 Checking business account: ${business.accountName || "Unknown"}`
      );

      for (const listing of business.listings) {
        // ---- CLEANED VALUES ----
        const title = (listing.title || "").replace(/,+$/, "").trim();
        const locality = (listing.storefrontAddress?.locality || "")
          .replace(/,+$/, "")
          .trim();
        const address = (listing.storefrontAddress?.addressLines?.[0] || "")
          .replace(/,+$/, "")
          .trim();

        if (!title) continue;

        // ---- CATEGORIES ----
        const primaryCategory =
          listing.categories?.primaryCategory?.displayName || "";

        const additionalCategories =
          listing.categories?.additionalCategories?.map(
            (cat) => cat.displayName
          ) || [];

        // ---- SLUG CREATION ----
        const listingSlug = `${title}${locality ? `-${locality}` : ""}${
          address ? `-${address}` : ""
        }`
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        console.log(`   Comparing: "${listingSlug}" === "${slug}"`);

        // ---- MATCH FOUND ----
        if (listingSlug === slug) {
          matchedListing = {
            ...listing,
            _computed: {
              primaryCategory,
              additionalCategories,
            },
          };
          matchedAccountName = business.accountName || "";
          break;
        }
      }

      if (matchedListing) break;
    }

    // ---- NO MATCH ----
    if (!matchedListing) {
      console.log("❌ No matching listing found for slug:", slug);
      return new Response(
        JSON.stringify({
          error: "Business location not found",
          message:
            "This review link is invalid or the business location does not exist. Please scan the QR code again.",
          slug,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ---- FINAL RESPONSE ----
    const responseData = {
      title: matchedListing.title || "",
      locality: matchedListing.storefrontAddress?.locality || "",
      locationId: matchedListing.name || "",
      placeId: matchedListing.metadata?.placeId || "",
      newReviewUri: matchedListing.metadata?.newReviewUri || null,
      accountName: matchedAccountName,

      // ADD-ON DATA
      primaryCategory: matchedListing._computed?.primaryCategory || "",
      additionalCategories:
        matchedListing._computed?.additionalCategories || [],

      websiteUri: matchedListing.websiteUri || null,
      phoneNumbers: matchedListing.phoneNumbers || null,
      storefrontAddress: matchedListing.storefrontAddress || null,
    };

    console.log("📤 Sending response:", JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Review Page API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message:
          "Something went wrong while fetching business data. Please try again later.",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}
