import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";
import { transactionLabel } from "@/lib/transactionLabels";

const DEFAULT_LIMIT = 100; // callers that don't paginate (profile stats) keep the old behaviour
const MAX_LIMIT = 200;

/**
 * GET /api/transactions?userId=
 *   &limit=50                       page size (default 100, max 200)
 *   &before=<createdAtISO>|<_id>    cursor from the previous page's `nextBefore`
 *   &type=credit|debit              filter on the server, across the whole history
 *
 * Pehle sirf aakhri 100 transactions aati thi (baaki history kabhi nahi dikhti) aur
 * `createdAt` response me tha hi nahi — Vault Logs date-only string padh kar har
 * entry par 12:00 AM dikhata tha.
 */
export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
    });
  }

  const requestedLimit = parseInt(searchParams.get("limit"), 10);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const query = { userId };

  const type = searchParams.get("type");
  if (type === "credit") query.type = { $in: ["credit", "add"] };
  else if (type === "debit") query.type = { $in: ["debit", "subtract"] };

  // Cursor = createdAt + _id, so rows sharing the same millisecond are never skipped.
  const before = searchParams.get("before");
  if (before) {
    const [iso, id] = before.split("|");
    const at = new Date(iso);
    if (!Number.isNaN(at.getTime())) {
      const olderThan = [{ createdAt: { $lt: at } }];
      if (id && mongoose.Types.ObjectId.isValid(id)) {
        olderThan.push({ createdAt: at, _id: { $lt: new mongoose.Types.ObjectId(id) } });
      }
      query.$or = olderThan;
    }
  }

  try {
    // One extra row tells us whether another page exists.
    const rows = await Transaction.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const formatted = page.map((tx) => {
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
        _id: tx._id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        reason: tx.reason,
        label: transactionLabel(tx.reason),
        metadata: tx.metadata || {},
        message: detailMessage,
        createdAt: tx.createdAt,
        date: new Date(tx.createdAt).toLocaleDateString(),
        time: new Date(tx.createdAt).toLocaleTimeString(),
        timestamp: tx.createdAt,
      };
    });

    const last = page[page.length - 1];
    const nextBefore =
      hasMore && last ? `${new Date(last.createdAt).toISOString()}|${last._id}` : null;

    return new Response(
      JSON.stringify({ transactions: formatted, hasMore, nextBefore }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Transaction Fetch Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
