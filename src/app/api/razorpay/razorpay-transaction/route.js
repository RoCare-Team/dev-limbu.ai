import dbConnect from "@/lib/dbConnect";
import RazorpayTransaction from "@/models/RazorpayTransaction";
import User from "@/models/User"; // <-- Add this import
import { logApiRequest } from "@/lib/apiLogger";

export async function POST(req) {
  const startedAt = Date.now();
  await dbConnect();

  try {
    const { userId, payment, amount, gstAmount, totalAmount, gstin } =
      await req.json();

    if (!userId || !payment || !amount || !totalAmount) {
      await logApiRequest({
        path: "/api/razorpay/razorpay-transaction",
        method: "POST",
        status: 400,
        durationMs: Date.now() - startedAt,
        errorMessage: "Missing required fields",
      });
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payment;

    const newTransaction = new RazorpayTransaction({
      userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      gstAmount,
      totalAmount,
      gstin: gstin || "",
    });

    await newTransaction.save();

    await logApiRequest({
      path: "/api/razorpay/razorpay-transaction",
      method: "POST",
      status: 201,
      durationMs: Date.now() - startedAt,
    });
    return new Response(
      JSON.stringify({ success: true, message: "Transaction saved successfully" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving Razorpay transaction:", error);
    await logApiRequest({
      path: "/api/razorpay/razorpay-transaction",
      method: "POST",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Error saving Razorpay transaction",
    });
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
    });
  }
}


export async function GET(req) {
  const startedAt = Date.now();
  await dbConnect();

  try {
    // 1️⃣ Get all transactions
    const transactions = await RazorpayTransaction.find().sort({ createdAt: -1 });

    // 2️⃣ Prepare array with user details inside each transaction
    const finalData = [];

    for (const tx of transactions) {
      const user = await User.findOne(
        { userId: tx.userId },
        { fullName: 1, email: 1, wallet: 1, _id: 0 }
      );

      finalData.push({
        ...tx.toObject(),
        user: user || null, // attach user details
      });
    }

    await logApiRequest({
      path: "/api/razorpay/razorpay-transaction",
      method: "GET",
      status: 200,
      durationMs: Date.now() - startedAt,
    });
    return new Response(
      JSON.stringify({
        success: true,
        totalTransactions: finalData.length,
        transactions: finalData,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    await logApiRequest({
      path: "/api/razorpay/razorpay-transaction",
      method: "GET",
      status: 500,
      durationMs: Date.now() - startedAt,
      errorMessage: error?.message || "Error fetching transactions",
    });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
