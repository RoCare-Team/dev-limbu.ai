import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(req, { params }) {
  try {
    // More robust way to get the slug, especially with special characters
    const urlParts = req.url.split('/');
    const slug = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]);


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

    // Get all businesses
    const businesses = await collection.find({}).toArray();

    console.log("📊 Total businesses found:", businesses.length);

    let matchedListing = null;
    let matchedAccountName = "";

    // Search through all businesses and their listings
    for (const business of businesses) {
      if (!business.listings || !Array.isArray(business.listings)) {
        continue;
      }

      console.log(`🔎 Checking business account: ${business.accountName || 'Unknown'}`);

      for (const listing of business.listings) {
        // Get title and locality from storefrontAddress
        const title = (listing.title || "").trim();
        const locality = (listing.storefrontAddress?.locality || "").trim();
        const address = (listing.storefrontAddress?.addressLines?.[0] || "").trim();

        if (!title) {
          console.log("⚠️ Skipping listing with no title");
          continue;
        }

        // Create slug from title + locality + address
        const listingSlug = `${title}${locality ? `-${locality}` : ""}${address ? `-${address}` : ""}`
          .toLowerCase()
          .replace(/\s+/g, "-")           // Replace spaces with hyphens
          .replace(/[^a-z0-9-]/g, "")     // Remove special characters
          .replace(/-+/g, "-")            // Replace multiple hyphens with single
          .replace(/^-|-$/g, "");         // Remove leading/trailing hyphens

        console.log(`   Comparing: "${listingSlug}" === "${slug}"`);

        // Check if slug matches
        if (listingSlug === slug) {
          matchedListing = listing;
          matchedAccountName = business.accountName || "";
          
          break;
        }
      }
      if (matchedListing) break;
    }
    // If no match found
    if (!matchedListing) {
      console.log("❌ No matching listing found for slug:", slug);
      return new Response(
        JSON.stringify({ 
          error: "Business location not found",
          message: "This review link is invalid or the business location does not exist. Please scan the QR code again.",
          slug: slug
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract data from matched listing
    const responseData = {
      title: matchedListing.title || "",
      locality: matchedListing.storefrontAddress?.locality || "",
      locationId: matchedListing.name || "",
      placeId: matchedListing.metadata?.placeId || "",
      newReviewUri: matchedListing.metadata?.newReviewUri || null,
      accountName: matchedAccountName,
      
      // Additional useful data
      websiteUri: matchedListing.websiteUri || null,
      phoneNumbers: matchedListing.phoneNumbers || null,
      storefrontAddress: matchedListing.storefrontAddress || null
    };

    console.log("📤 Sending response:", JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Review Page API Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error",
        message: "Something went wrong while fetching business data. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}