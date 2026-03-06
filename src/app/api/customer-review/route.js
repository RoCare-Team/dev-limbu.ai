import { MongoClient } from "mongodb";

function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  return new MongoClient(uri);
}

// -------------------- CREATE / SAVE REVIEW (POST) --------------------
export async function POST(req) {
  const client = getMongoClient();
  try {
    const body = await req.json();
    const { name, feedback, rating, business } = body;

    if (!rating || !business) {
      return new Response(
        JSON.stringify({ success: false, message: "Rating & Business are required" }),
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("test");
    const collection = db.collection("reviews");

    await collection.insertOne({
      name: name?.trim() || "Anonymous",
      business: business.trim(),
      feedback: feedback || "",
      rating,
      createdAt: new Date()
    });

    return new Response(
      JSON.stringify({ success: true, message: "Review saved successfully" }),
      { status: 200 }
    );

  } catch (err) {
    console.error("POST Error:", err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  } finally {
    await client.close();
  }
}


// -------------------- GET REVIEWS (ALL OR BY NAME) --------------------
// -------------------- GET ALL REVIEWS --------------------
// -------------------- GET REVIEWS (ALL OR BY BUSINESS) --------------------
export async function GET(req) {
    const client = getMongoClient();
    try {
        await client.connect();
        const db = client.db("test");
        const collection = db.collection("reviews");

        const { searchParams } = new URL(req.url);

        let business = searchParams.get("business")
            ? decodeURIComponent(searchParams.get("business")).trim()
            : null;

        const query = {};

        // If business name is sent → filter reviews (case-insensitive)
        if (business) {
            query.business = { 
                $regex: new RegExp(`^${business}$`, "i") 
            };
        }

        const reviews = await collection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        return new Response(
            JSON.stringify({
                success: true,
                type: business ? "filtered" : "all",
                business: business || null,
                count: reviews.length,
                reviews,
            }),
            { status: 200 }
        );

    } catch (err) {
        console.error("GET Error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}
