import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
    });
  }

  try {
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100) // ✅ yaha limit lagayi
      .lean();

    const formatted = transactions.map((tx) => {
      let detailMessage = "Wallet updated";

      if (tx.reason === "wallet_add") {
        detailMessage = `Added ${tx.amount} coins`;
      } else if (tx.reason === "wallet_deduct") {
        detailMessage = `Deducted ${tx.amount} coins`;
      } else if (tx.reason === "image_generated") {
        detailMessage = `Generated AI Post (Used ${tx.amount} coins)`;
      } else if (tx.reason === "video_generated") {
        detailMessage = `Image → video (Used ${tx.amount} coins)`;
      } else if (tx.reason === "subscription_purchase") {
        detailMessage = `Subscription purchased (${tx.amount} coins)`;
      }

      return {
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        reason: tx.reason,
        metadata: tx.metadata || {},
        message: detailMessage,
        date: new Date(tx.createdAt).toLocaleDateString(),
        time: new Date(tx.createdAt).toLocaleTimeString(),
        timestamp: tx.createdAt,
      };
    });

    return new Response(JSON.stringify({ transactions: formatted }), {
      status: 200,
    });
  } catch (err) {
    console.error("Transaction Fetch Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}