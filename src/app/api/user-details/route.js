import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  return new MongoClient(uri);
}

// ------------------ GET API ------------------
export async function GET(req) {
  const client = getMongoClient();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("test");

    const user = await db.collection("users").findOne({ userId });
    const posts = await db
      .collection("posts")
      .find({ userId })
      .project({ aiOutput: 1, description: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      wallet: user?.wallet || 0,
      gst: user?.gst || "",
      totalPosts: posts.length,
      posts,
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

// ------------------ PUT API (Update GST Only) ------------------
export async function PUT(req) {
  const client = getMongoClient();
  try {
    const body = await req.json();
    const { userId, gst, coins } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("test");

    /* ---------- UPDATE GST ---------- */
    if (gst) {
      await db.collection("users").updateOne(
        { userId },
        { $set: { gst } }
      );
    }

    let walletUpdateResult = null;

    /* ---------- ADD WALLET COINS ---------- */
    if (coins && Number(coins) > 0) {
      // 1. Update wallet balance
      walletUpdateResult = await db.collection("users").findOneAndUpdate(
        { userId },
        { $inc: { wallet: Number(coins) } },
        { returnDocument: "after" }
      );

      // 2. Insert wallet transaction log
      await db.collection("wallet_transactions").insertOne({
        userId,
        amount: Number(coins),
        type: "add",
        reason: "wallet Recharge",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "GST & Wallet updated successfully",
      wallet: walletUpdateResult?.value?.wallet,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
