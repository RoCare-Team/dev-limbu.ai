import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { POST as creditWallet } from "@/app/api/subscribe/verify/route";
import { topupPricing } from "@/lib/walletTopup";

/**
 * POST /api/wallet/verify { payment: { razorpay_order_id, razorpay_payment_id, razorpay_signature } }
 * Reads the userId and amount from the Razorpay order (set by /api/wallet/order)
 * and hands over to the /wallet credit flow (app/api/subscribe/verify), which
 * checks the signature, blocks duplicates, credits the coins and logs the
 * transaction. The browser never decides whose wallet or how much.
 */
export async function POST(req) {
  try {
    const { payment } = await req.json();
    const orderId = payment?.razorpay_order_id;
    if (!orderId || !payment?.razorpay_payment_id || !payment?.razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid payment details." }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });
    const order = await razorpay.orders.fetch(orderId);
    const amount = Number(order?.notes?.amount);
    if (order?.notes?.purpose !== "wallet_topup" || !order.notes.userId || !amount) {
      return NextResponse.json({ success: false, error: "This payment is not a wallet top-up." }, { status: 400 });
    }
    const { gst, total } = topupPricing(amount);

    const res = await creditWallet(
      new Request("http://internal/api/subscribe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: order.notes.userId,
          platform: "web",
          plan: "WalletRecharge",
          amount,
          gstAmount: gst,
          totalAmount: total,
          payment,
        }),
      })
    );
    const data = await res.json();
    return NextResponse.json(
      data.success ? { success: true, coinsAdded: amount, wallet: data.wallet } : { success: false, error: data.error || "Payment verification failed." },
      { status: data.success ? 200 : res.status || 400 }
    );
  } catch (err) {
    console.error("wallet verify error:", err);
    return NextResponse.json({ success: false, error: "Could not confirm the payment. Contact support if money was deducted." }, { status: 500 });
  }
}
