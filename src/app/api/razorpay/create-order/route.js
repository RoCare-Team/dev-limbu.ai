import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request) {
  try {
    const { amount, receipt, notes } = await request.json();
    const orderAmount = Number(amount);

    if (!amount || !receipt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (receipt.length > 40) {
      return NextResponse.json(
        { error: "Receipt ID too long" },
        { status: 400 },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys missing");
      return NextResponse.json(
        { error: "Razorpay environment variables missing" },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100),
      currency: "INR",
      receipt,
      notes: notes || {},
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
