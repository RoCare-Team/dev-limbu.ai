import dbConnect from "@/lib/dbConnect";// Mongodb se connection banane ka function || agar hata diya database operations fail ho jayenga 

import Transaction from "@/models/Transaction";  // ye transaction wallet history 

import User from "@/models/User"; // ye user data store 

import Admin from "@/models/Admin"; // admin agents assign karne ke liye

import bcrypt from "bcryptjs"; // password ko hash karta hai (encrypt nahi, hash) kabhi bhi plain passord database me store nahi karte 
import mongoose from "mongoose";// custom schema banane ke liye 

import { runNewUserOnboarding } from "@/lib/onboardingNewUser";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";

// Define Setting Schema for Round Robin
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
}); // ye database me counter store karta he

const Setting = mongoose.models.settings || mongoose.model("settings", SettingSchema); // ye nextjs hot reload error avoid karta he  ager ye comnnditon na ho  connaot overwritter model once complied

// ✅ SIGNUP (same as before)
export async function POST(req) { // Ye Signup API hai.
  await dbConnect(); // Har request pe DB connect ensure karta hai.

  try {
    const { fullName, email, password } = await req.json(); // Frontend se data receive kar raha hai.

    if (!fullName || !email || !password) { // Empty data allow nahi karte.
      return new Response(
        JSON.stringify({ error: "Full name, email, and password are required" }),
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email }); // Same email se multiple accounts prevent karta hai.
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists with this email" }),
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10); // 10 = salt rounds. // Agar 5 kar do? Fast hoga but less secure. Agar 15 kar do? Secure but slow.

    const lastUser = await User.findOne().sort({ createdAt: -1 }); // Sabse last created user nikaal raha hai.
    let nextNumber = 1;

    if (lastUser && lastUser.userId) {
      const lastNumber = parseInt(lastUser.userId.replace("MB-", ""), 10); // MB-01 → 01 nikaal raha hai.
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const formattedUserId = `MB-${String(nextNumber).padStart(2, "0")}`;

    // Round-robin Agent Assignment
    let assignedAgentId = null;
    try {
      const activeAgents = await Admin.find({ role: "agent", isActive: true })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

      if (activeAgents.length > 0) {
        const RR_KEY = "agentLeadRR";
        const rrDoc = await Setting.findOneAndUpdate(
          { key: RR_KEY },
          [
            {
              $set: {
                key: RR_KEY,
                value: { $add: [{ $ifNull: ["$value", -1] }, 1] },
              },
            },
          ],
          { new: true, upsert: true },
        );

        let rrValue = parseInt(rrDoc.value, 10);
        if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

        assignedAgentId = activeAgents[rrValue % activeAgents.length]._id;
      }
    } catch (error) {
      console.error("Agent assignment error:", error);
    }

    const newUser = new User({ // New document create kar raha hai.
      userId: formattedUserId,
      fullName,
      email,
      passwordHash,
      wallet: 0, // Initial balance zero.
      assignedAgentId,
      source: "signup",
    });

    await newUser.save(); // Database mein save kar diya.

    void runWelcomeBonusForUserId(newUser.userId).catch((err) =>
      console.error("runWelcomeBonusForUserId", err),
    );

    void runNewUserOnboarding(newUser.userId).catch((err) =>
      console.error("runNewUserOnboarding", err),
    );

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        userId: newUser.userId,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// ✅ WALLET UPDATE (Add / Deduct / Replace)
export async function PUT(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const body = await req.json();
    const { amount, type, reason, metadata } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), { status: 400 });
    }

    // ── increment_posts_used ──────────────────────────────────────────
    if (type === "increment_posts_used") {
      const updated = await User.findOneAndUpdate(
        { userId },
        { $inc: { postsUsed: 1 } },
        { new: true, runValidators: false }
      );
      if (!updated) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      return new Response(JSON.stringify({ message: "postsUsed incremented", postsUsed: updated.postsUsed }), { status: 200 });
    }

    // ── wallet add ────────────────────────────────────────────────────
    if (type === "add" || type === "credit") {
      const updated = await User.findOneAndUpdate(
        { userId },
        { $inc: { wallet: amount } },
        { new: true, runValidators: false }
      );
      if (!updated) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

      await Transaction.create({
        userId,
        type: "credit",
        amount,
        balanceAfter: updated.wallet,
        reason: reason || "wallet_add",
        metadata: metadata || {},
      });

      return new Response(JSON.stringify({ message: "Wallet updated", wallet: updated.wallet }), { status: 200 });
    }

    // ── wallet deduct ─────────────────────────────────────────────────
    if (type === "deduct" || type === "debit") {
      // Check balance first without saving
      const user = await User.findOne({ userId }).select("wallet");
      if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

      if (user.wallet < amount) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400 });
      }

      const updated = await User.findOneAndUpdate(
        { userId, wallet: { $gte: amount } }, // double-check atomically
        { $inc: { wallet: -amount } },
        { new: true, runValidators: false }
      );

      if (!updated) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400 });
      }

      await Transaction.create({
        userId,
        type: "debit",
        amount,
        balanceAfter: updated.wallet,
        reason: reason || "wallet_deduct",
        metadata: metadata || {},
      });

      return new Response(JSON.stringify({ message: "Wallet updated", wallet: updated.wallet }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

  } catch (error) {
    console.error("Wallet Update Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

// ✅ GET USER BY userId
export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required in query params" }),
        { status: 400 }
      );
    }

    // PasswordHash response mein remove kar diya. || Agar ye na kare: || Password hash client ko visible ho sakta hai.
    const user = await User.findOne({ userId }).select("-passwordHash");
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error("Get User Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// ✅ DELETE USER
export async function DELETE(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const phone = searchParams.get("phone");

    if (!userId && !phone) {
      return new Response(
        JSON.stringify({ error: "userId or phone is required" }),
        { status: 400 }
      );
    }

    let deletedUser;
    if (userId) {
      deletedUser = await User.findOneAndDelete({ userId });
    } else {
      deletedUser = await User.findOneAndDelete({ phone });
    }

    if (!deletedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("Delete User Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
