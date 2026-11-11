import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { encodeCart, offerPricing, offerTierByTitle, priceCart } from "@/lib/planOffers";

const CYCLES = ["monthly", "quarterly", "half-yearly", "yearly"];

export async function POST(request) {
  try {
    const { amount, receipt, notes, planId, planDuration, cart } = await request.json();
    let orderAmount = Number(amount);
    const cycle = CYCLES.includes(planDuration) ? planDuration : null;
    let cartNote = null;

    // Cart checkout: several plans in one payment, priced entirely on the server.
    if (cart) {
      const priced = priceCart(cart);
      if (priced.error) return NextResponse.json({ error: priced.error }, { status: 400 });
      orderAmount = priced.total;
      cartNote = encodeCart(priced.lines);
    }

    // Plans sold from the home page offers (GMB, Social, Outreach, SEO) are priced
    // on the server in their offer's cycle, so the browser cannot pay less. Other
    // cycles of the pricing-page plans keep the sent amount.
    const match = cart ? null : offerTierByTitle(planId);
    if (match) {
      if (match.fixedCycle && planDuration !== match.offer.cycle) {
        return NextResponse.json({ error: `${planId} is billed ${match.offer.cycle} only` }, { status: 400 });
      }
      if (planDuration === match.offer.cycle) orderAmount = offerPricing(match.offer, match.tier).total;
    }

    if ((!amount && !cart) || !receipt) {
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
      // plan_cycle / cart are read back in /api/razorpay/verify to activate the plans
      notes: {
        ...(notes || {}),
        ...(cartNote ? { cart: cartNote } : cycle ? { plan_cycle: cycle } : {}),
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
