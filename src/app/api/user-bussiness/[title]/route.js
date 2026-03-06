import { MongoClient } from "mongodb";

function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  return new MongoClient(uri);
}

export async function GET(req, { params }) {
  const client = getMongoClient();
  try {
    const { title } = params;

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required in params" }),
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("test");
    const collection = db.collection("adminbusinesses");

    // CASE-INSENSITIVE MATCH
    const business = await collection.findOne({
      "listings.title": { $regex: new RegExp(`^${title}$`, "i") }
    });

    if (!business) {
      return new Response(
        JSON.stringify({ error: "No business found" }),
        { status: 404 }
      );
    }

    // Extract listing where title matches (case-insensitive)
    const listing =
      business.listings.find(
        (item) => item.title.toLowerCase() === title.toLowerCase()
      ) || business.listings[0];

    const responseData = {
      title: listing.title,
      locality: listing.locality || null,
      locationId: listing.locationId || null,
      newReviewUri: listing.metadata?.newReviewUri || null
    };

    return new Response(JSON.stringify(responseData), { status: 200 });

  } catch (error) {
    console.error("GET API Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}