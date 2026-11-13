import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { cleanPhone, isIndianMobile, phoneVariants, topupPricing, validTopupAmount } from "@/lib/walletTopup";

/**
 * POST /api/wallet/order { phone, amount, name?, email? }
 * Razorpay order for a wallet top-up, priced on the server. The account is found
 * by mobile number; a new number needs name + email and gets a new account (same
 * fields as /api/create-or-find). The userId and amount travel in the order's
 * notes, so /api/wallet/verify never trusts the browser for either.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const phone = cleanPhone(body.phone);
    const amount = validTopupAmount(body.amount);
    if (!isIndianMobile(phone)) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!amount) {
      return NextResponse.json({ success: false, error: "Choose an amount between ₹200 and ₹1,00,000." }, { status: 400 });
    }

    await dbConnect();
    let user = await User.findOne({ phone: { $in: phoneVariants(phone) } }).select("userId").lean();

    if (!user) {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[A-Za-z\s]{2,40}$/.test(name)) {
        return NextResponse.json({ success: false, needsDetails: true, error: "Enter your name (letters only)." }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ success: false, needsDetails: true, error: "Enter a valid email address." }, { status: 400 });
      }
      if (await User.exists({ email })) {
        return NextResponse.json({ success: false, error: "This email is already used by another account." }, { status: 400 });
      }
      user = await User.create({
        userId: `USR${Date.now()}`,
        fullName: name,
        email,
        phone,
        source: "website",
        leadStage: "Active",
      });
    }

    const { gst, total } = topupPricing(amount);
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `wal_${Date.now()}`,
      payment_capture: 1,
      notes: { purpose: "wallet_topup", userId: user.userId, amount: String(amount), gst: String(gst) },
    });

    return NextResponse.json({ success: true, id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("wallet order error:", err);
    return NextResponse.json({ success: false, error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
