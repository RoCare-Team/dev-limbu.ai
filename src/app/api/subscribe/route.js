// app/api/subscribe/route.js
import dbConnect from "@/lib/dbConnect";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";


export async function POST(req) {
  await dbConnect();

  try {
    const { userId, plan, amount } = await req.json();

    if (!userId || !plan) {
      return new Response(JSON.stringify({ error: "User or plan missing" }), {
        status: 400,
      });
    }

    // ✅ Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // ✅ Default plan amounts (as fallback)
    const planAmounts = {
      Basic: 250 * 100,
      Standard: 500 * 100,
      Premium: 1000 * 100,
    };

    // ✅ Use dynamic amount if provided, otherwise fallback
    const finalAmount =
      amount && !isNaN(amount) ? Number(amount) * 100 : planAmounts[plan] || planAmounts.Basic;

    // ✅ Create Razorpay order
    const options = {
      amount: finalAmount,
      currency: "INR",
  receipt: `rcpt_${uuidv4().replace(/-/g, "").slice(0, 32)}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    return new Response(
      JSON.stringify({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Order creation failed",
      }),
      { status: 500 }
    );
  }
}