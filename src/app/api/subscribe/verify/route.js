// app/api/subscribe/verify/route.js

import crypto from "crypto";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import RazorpayTransaction from "@/models/RazorpayTransaction";

function generateAppleJWT() {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: process.env.APPLE_ISSUER_ID,
      iat: now,
      exp: now + 60 * 20,
      aud: "appstoreconnect-v1",
      bid: process.env.APPLE_BUNDLE_ID,
    },
    process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    {
      algorithm: "ES256",
      header: { kid: process.env.APPLE_KEY_ID },
    }
  );
}

export async function POST(req) {
  await dbConnect();

  try {
    const {
      userId,
      platform,
      plan,
      amount,
      gstAmount,
      totalAmount,
      gstin,
      payment,
      transactionId,
      referCode
    } = await req.json();

    if (!userId || !plan || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const platformType = platform || "web";

    const user = await User.findOne({ userId });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404 }
      );
    }

    let paymentRef = null;

    // ====================================================
    // 🍏 iOS VERIFICATION
    // ====================================================
    if (platformType === "ios") {
      if (!transactionId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing transactionId" }),
          { status: 400 }
        );
      }

      const appleJWT = generateAppleJWT();

      let response = await fetch(
        `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
        { headers: { Authorization: `Bearer ${appleJWT}` } }
      );

      if (!response.ok) {
        response = await fetch(
          `https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
          { headers: { Authorization: `Bearer ${appleJWT}` } }
        );
      }

      if (!response.ok) {
        await Transaction.create({
          userId,
          type: "failed",
          amount,
          reason: "invalid_ios_transaction",
          metadata: { transactionId },
        });

        return new Response(
          JSON.stringify({ success: false, error: "Invalid iOS transaction" }),
          { status: 400 }
        );
      }

      paymentRef = transactionId;
    }

    // ====================================================
    // 🤖 ANDROID + WEB (RAZORPAY)
    // ====================================================
    if (platformType === "android" || platformType === "web") {
      if (!payment) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing payment data" }),
          { status: 400 }
        );
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        payment;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payment fields" }),
          { status: 400 }
        );
      }

      // 🔒 Duplicate Razorpay check
      const existingRazorpay = await RazorpayTransaction.findOne({
        paymentId: razorpay_payment_id,
      });

      if (existingRazorpay) {
        return new Response(
          JSON.stringify({ success: false, error: "Transaction already processed" }),
          { status: 400 }
        );
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        await Transaction.create({
          userId,
          type: "failed",
          amount,
          reason: "invalid_signature",
          metadata: { razorpay_payment_id },
        });

        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 400 }
        );
      }

      console.log("eeeeeeeee",plan);
      

      await RazorpayTransaction.create({
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        gstAmount: gstAmount || 0,
        totalAmount,
        gstin: gstin || "",
        referCode: referCode || "",
      });

      paymentRef = razorpay_payment_id;
    }

    // ====================================================
    // 💰 WALLET CREDIT (COMMON FOR ALL)
    // ====================================================

    const existingWalletTxn = await Transaction.findOne({
      "metadata.paymentRef": paymentRef,
    });

    if (existingWalletTxn) {
      return new Response(
        JSON.stringify({ success: false, error: "Wallet already credited" }),
        { status: 400 }
      );
    }

    user.wallet += amount;

    await Transaction.create({
      userId,
      type: "credit",
      amount,
      balanceAfter: user.wallet,
      reason: "wallet_recharge",
      metadata: {
        paymentRef,
        platform: platformType,
      },
    });

    await user.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wallet recharge successful",
        wallet: user.wallet,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Recharge Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}