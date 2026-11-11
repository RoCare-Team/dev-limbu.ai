// app/api/razorpay/verify/route.js

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { decodeCart, priceCart } from "@/lib/planOffers";

const CYCLE_MONTHS = { monthly: 1, quarterly: 3, "half-yearly": 6, yearly: 12 };

// Map plan name → maxAccounts (GMB accounts the plan may connect)
const MAX_ACCOUNTS = {
  "Basic Plan":        3,
  "Professional Plan": 6,
  "Premium Plan":      10,
};

/**
 * The Razorpay order, for the notes create-order wrote on it (plan_cycle /
 * cart). Server-written, so the browser cannot claim a longer or extra plan.
 * null if it cannot be read.
 */
async function fetchOrder(orderId) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET,
    });
    return await razorpay.orders.fetch(orderId);
  } catch (err) {
    console.error("Could not read Razorpay order:", err?.message);
    return null;
  }
}

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Cart order: every plan in it goes to user.planPurchases with its own length.
 * Paying again for the same order is a no-op.
 */
async function activateCart(user, order, payment) {
  const { razorpay_payment_id, razorpay_order_id } = payment;
  if ((user.planPurchases || []).some((p) => p.orderId === razorpay_order_id)) {
    return { alreadyActive: true, plans: user.planPurchases.filter((p) => p.orderId === razorpay_order_id) };
  }

  const priced = priceCart(decodeCart(order.notes.cart));
  if (priced.error) throw new Error(`Cart order ${razorpay_order_id}: ${priced.error}`);

  const now = new Date();
  const purchases = priced.lines.map((line) => ({
    plan: line.title,
    cycle: line.cycle,
    date: now,
    expiry: addMonths(now, line.months),
    amount: line.total,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  }));
  user.planPurchases = [...(user.planPurchases || []), ...purchases];

  // A GMB tier also fills subscription (it sets how many GMB accounts can be
  // connected), but never replaces a subscription that is still running.
  const gmbLine = priced.lines.find((l) => l.offerKey === "gmb");
  const current = user.subscription;
  const running = current?.status === "active" && current?.expiry && new Date(current.expiry) > now;
  if (gmbLine && !running) {
    user.subscription = {
      plan: gmbLine.title,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      date: now,
      expiry: addMonths(now, gmbLine.months),
      status: "active",
      accounts: current?.accounts ?? [],
      maxAccounts: MAX_ACCOUNTS[gmbLine.title] ?? 3,
    };
  }

  await user.save({ validateBeforeSave: true });
  return { alreadyActive: false, plans: purchases };
}

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    // ── iOS in-app purchase (unchanged) ───────────────────────────────────
    if (body.platform === "ios") {
      const { userId, transactionId, productId, purchaseToken } = body;

      if (!userId || !transactionId || !productId || !purchaseToken) {
        return NextResponse.json(
          { success: false, message: "Missing required fields" },
          { status: 400 }
        );
      }

      const appleResponse = await fetch(
        "https://buy.itunes.apple.com/verifyReceipt",
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": purchaseToken,
            password: process.env.APPLE_IAP_SHARED_SECRET,
          }),
        }
      );

      const appleData = await appleResponse.json();

      if (appleData.status === 0) {
        return NextResponse.json({
          success: true,
          message: "Wallet credited successfully",
          appleData,
        });
      }

      return NextResponse.json(
        { success: false, message: "Invalid receipt", appleStatus: appleData.status },
        { status: 400 }
      );
    }

    // ── Razorpay web payment ──────────────────────────────────────────────
    const { userId, plan, payment } = body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payment || {};

    // Validate required fields
    if (!userId || !plan || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment info" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Find user — supports both ObjectId (_id) and custom userId field
    const user =
      (await User.findById(userId).catch(() => null)) ||
      (await User.findOne({ userId }));

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const order = await fetchOrder(razorpay_order_id);

    // ── Cart: several plans in one payment ──
    if (order?.notes?.cart) {
      const result = await activateCart(user, order, payment);
      return NextResponse.json(
        {
          success: true,
          message: result.alreadyActive ? "Plans already active" : "Plans activated successfully",
          plans: result.plans,
        },
        { status: 200 }
      );
    }

    // Validity = the billing cycle that was paid for (monthly 1, quarterly 3, yearly 12 months)
    const months     = CYCLE_MONTHS[order?.notes?.plan_cycle] || 1;
    const startDate  = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // Activate subscription
    user.subscription = {
      plan,
      paymentId:   razorpay_payment_id,
      orderId:     razorpay_order_id,
      date:        startDate,
      expiry:      expiryDate,
      status:      "active",
      accounts:    user.subscription?.accounts ?? [],
      maxAccounts: MAX_ACCOUNTS[plan] ?? 3,
    };

    await user.save({ validateBeforeSave: true });

    return NextResponse.json(
      {
        success:      true,
        message:      "Subscription activated successfully",
        subscription: user.subscription,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}