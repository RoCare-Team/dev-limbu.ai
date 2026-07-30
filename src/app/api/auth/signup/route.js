import dbConnect from "@/lib/dbConnect"; // Mongodb se connection banane ka function || agar hata diya database operations fail ho jayenga

import Transaction from "@/models/Transaction"; // ye transaction wallet history

import User from "@/models/User"; // ye user data store

import Admin from "@/models/Admin"; // admin agents assign karne ke liye

import bcrypt from "bcryptjs"; // password ko hash karta hai (encrypt nahi, hash) kabhi bhi plain passord database me store nahi karte
import mongoose from "mongoose"; // custom schema banane ke liye

import { runNewUserOnboarding } from "@/lib/onboardingNewUser";
import { getEffectivePackageExpiry } from "@/utils/userPlanExpiry";
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp";
import { pickAgentIdForLead } from "@/lib/leadAgentAssign";

// Define Setting Schema for Round Robin
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
}); // ye database me counter store karta he

const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema); // ye nextjs hot reload error avoid karta he  ager ye comnnditon na ho  connaot overwritter model once complied

// ✅ SIGNUP (same as before)
export async function POST(req) {
  // Ye Signup API hai.
  await dbConnect(); // Har request pe DB connect ensure karta hai.

  try {
    const { fullName, email, password } = await req.json(); // Frontend se data receive kar raha hai.

    if (!fullName || !email || !password) {
      // Empty data allow nahi karte.
      return new Response(
        JSON.stringify({
          error: "Full name, email, and password are required",
        }),
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email }); // Same email se multiple accounts prevent karta hai.
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists with this email" }),
        { status: 400 },
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

    // Least-loaded Agent Assignment (dekho lib/leadAgentAssign.js)
    let assignedAgentId = null;
    try {
      assignedAgentId = await pickAgentIdForLead();
    } catch (error) {
      console.error("Agent assignment error:", error);
    }

    const newUser = new User({
      // New document create kar raha hai.
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
      { status: 201 },
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

    // Sabhi fields nikaal lo
    const { amount, type, reason, metadata, GstNumber, fullName, email } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), {
        status: 400,
      });
    }

    // ── STEP 1: AUTO-UPDATE PROFILE FIELDS (GST, Name, etc.) ─────────
    // Agar body mein GST ya koi aur info hai, toh pehle use update karo
    if (GstNumber !== undefined || fullName || email) {
      const updateData = {};
      if (GstNumber !== undefined) updateData.GstNumber = GstNumber;
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;

      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: false },
      );

      if (!updatedUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
        });
      }

      // Agar sirf update tha (wallet operation nahi), toh yahi se return kar do
      if (!type) {
        return new Response(
          JSON.stringify({
            message: "User info updated",
            GstNumber: updatedUser.GstNumber,
          }),
          { status: 200 },
        );
      }
    }

    // ── STEP 2: WALLET OPERATIONS (Requires 'type') ──────────────────

    // 1. Increment Posts
    if (type === "increment_posts_used") {
      const updated = await User.findOneAndUpdate(
        { userId },
        { $inc: { postsUsed: 1 } },
        { new: true },
      );
      return new Response(
        JSON.stringify({
          message: "postsUsed incremented",
          postsUsed: updated?.postsUsed,
        }),
        { status: 200 },
      );
    }

    // 2. Wallet Add
    if (type === "add" || type === "credit") {
      const updated = await User.findOneAndUpdate(
        { userId },
        { $inc: { wallet: amount } },
        { new: true },
      );
      await Transaction.create({
        userId,
        type: "credit",
        amount,
        balanceAfter: updated.wallet,
        reason: reason || "wallet_add",
      });
      return new Response(
        JSON.stringify({ message: "Wallet credited", wallet: updated.wallet }),
        { status: 200 },
      );
    }

    // 3. Wallet Deduct
    if (type === "deduct" || type === "debit") {
      const updated = await User.findOneAndUpdate(
        { userId, wallet: { $gte: amount } },
        { $inc: { wallet: -amount } },
        { new: true },
      );
      if (!updated)
        return new Response(JSON.stringify({ error: "Insufficient balance" }), {
          status: 400,
        });

      await Transaction.create({
        userId,
        type: "debit",
        amount,
        balanceAfter: updated.wallet,
        reason: reason || "wallet_deduct",
      });
      return new Response(
        JSON.stringify({ message: "Wallet debited", wallet: updated.wallet }),
        { status: 200 },
      );
    }

    // Agar na update info thi, na sahi type tha
    return new Response(
      JSON.stringify({ error: "Invalid request or missing type" }),
      { status: 400 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
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
        { status: 400 },
      );
    }

    // PasswordHash response mein remove kar diya. || Agar ye na kare: || Password hash client ko visible ho sakta hai.
    const user = await User.findOne({ userId }).select("-passwordHash");
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Self-heal a stale packageExpiryDate: a renewal may have updated
    // subscription.expiry (shown on /profile) while packageExpiryDate — the field
    // automation/user-settings read — stayed stale, wrongly showing "expired".
    // Sync it forward (never shorten) so every reader sees the real expiry.
    try {
      const eff = getEffectivePackageExpiry(user);
      const cur = user.packageExpiryDate ? new Date(user.packageExpiryDate).getTime() : 0;
      if (eff && eff.getTime() > cur) {
        user.packageExpiryDate = eff;
        await user.save();
        console.log(`[auth/signup] Synced packageExpiryDate → ${eff.toISOString()} for ${userId} (was ${cur ? new Date(cur).toISOString() : 'unset'})`);
      }
    } catch (e) {
      console.warn("[auth/signup] packageExpiryDate self-heal skipped:", e.message);
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
        { status: 400 },
      );
    }

    let deletedUser;
    if (userId) {
      deletedUser = await User.findOneAndDelete({ userId });
    } else {
      deletedUser = await User.findOneAndDelete({ phone });
    }

    if (!deletedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete User Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
