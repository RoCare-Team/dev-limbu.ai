import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

// ✅ SIGNUP (same as before)
export async function POST(req) {
  await dbConnect();

  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Full name, email, and password are required" }),
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists with this email" }),
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const lastUser = await User.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;

    if (lastUser && lastUser.userId) {
      const lastNumber = parseInt(lastUser.userId.replace("MB-", ""), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const formattedUserId = `MB-${String(nextNumber).padStart(2, "0")}`;

    // Round-robin Agent Assignment
    let assignedAgentId = null;
    try {
      const activeAgents = await Admin.find({ role: "agent", isActive: true }).sort({ createdAt: 1 });
      
      if (activeAgents.length > 0) {
        const lastUser = await User.findOne({ assignedAgentId: { $ne: null } }).sort({ createdAt: -1 });
        let nextIndex = 0;
        
        if (lastUser && lastUser.assignedAgentId) {
          const lastAgentId = lastUser.assignedAgentId.toString();
          const lastIndex = activeAgents.findIndex(a => a._id.toString() === lastAgentId);
          if (lastIndex !== -1) {
            nextIndex = (lastIndex + 1) % activeAgents.length;
          }
        }
        assignedAgentId = activeAgents[nextIndex]._id;
      }
    } catch (error) {
      console.error("Agent assignment error:", error);
    }

    const newUser = new User({
      userId: formattedUserId,
      fullName,
      email,
      passwordHash,
      wallet: 0,
      assignedAgentId,
    });

    await newUser.save();

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

    const { amount, type, reason, metadata } = await req.json();

    if (!userId || typeof amount !== "number") {
      return new Response(
        JSON.stringify({ error: "userId and numeric amount required" }),
        { status: 400 }
      );
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    let transactionType = type === "add" ? "credit" : "debit";
    let finalReason = reason || (type === "deduct" ? "wallet_deduct" : "wallet_add");

    // WALLET UPDATE
    if (type === "add") {
      user.wallet += amount;

    } else if (type === "deduct") {
      if (user.wallet < amount) {
        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400 }
        );
      }
      user.wallet -= amount;

    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });
    }

    await user.save();

    // SAVE TRANSACTION
    await Transaction.create({
      userId,
      type: transactionType,
      amount,
      balanceAfter: user.wallet,
      reason: finalReason,
      metadata: metadata || {},
    });

    return new Response(
      JSON.stringify({
        message: "Wallet updated",
        wallet: user.wallet,
      }),
      { status: 200 }
    );
    
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
