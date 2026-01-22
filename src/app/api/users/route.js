import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/* ------------------ SCHEMA ------------------ */
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  email: { type: String, unique: true },
  fullName: String,
  phone: String,
  passwordHash: String,

  paidService: String,
  paidPackage: String,
  planDuration: String,

  subscription: {
    plan: String,
    paymentId: String,
    orderId: String,
    date: Date,
    status: String,
  },

  remarksHistory: [
    {
      text: String,
      createdAt: Date,
    },
  ],

  Remarks: String,
  createdAt: Date,
});

const User =
  mongoose.models.users || mongoose.model("users", UserSchema);

/* ------------------ DB CONNECT ------------------ */
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB Connected");
}

/* ------------------ GET USERS ------------------ */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const searchQuery = searchParams.get("search") || "";
    const userId = searchParams.get("userId");

    if (userId) {
      const user = await User.findOne({ userId });
      return NextResponse.json({ success: true, user });
    }

    const limit = 70;
    const skip = (page - 1) * limit;

    const query = {};

    if (searchQuery) {
      query.$or = [
        { email: { $regex: searchQuery, $options: "i" } },
        { userId: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
        { fullName: { $regex: searchQuery, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
      users,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ------------------ DASHBOARD STATS ------------------ */
export async function POST() {
  try {
    await connectDB();

    const users = await User.find();

    const totalUsers = users.length;
    const activeUsers = users.filter(
      (u) => u.subscription?.status === "active"
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ------------------ UPDATE USER (MERGED) ------------------ */
export async function PUT(req) {
  try {
    await connectDB();

    const {
      userId,
      newPlan,
      remark,
      paidService,
      paidPackage,
      planDuration,
      isServiceBooked,
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    let updateData = {};

    /* -------- REMARK UPDATE -------- */
    if (remark) {
      updateData.$set = { Remarks: remark };
      updateData.$push = {
        remarksHistory: { text: remark, createdAt: new Date() },
      };
    }

    /* -------- PLAN UPDATE -------- */
    if (newPlan) {
      updateData.$set = {
        ...updateData.$set,
        "subscription.plan": newPlan,
        "subscription.status": "active",
        "subscription.date": new Date(),
      };
    }

    /* -------- SERVICE UPDATE (ONLY IF BOOKED) -------- */
    if (isServiceBooked === true) {
      updateData.$set = {
        ...updateData.$set,
        ...(paidService && { paidService }),
        ...(paidPackage && { paidPackage }),
        ...(planDuration && { planDuration }),
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* ------------------ DELETE USER ------------------ */
export async function DELETE(req) {
  try {
    await connectDB();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const deletedUser = await User.findOneAndDelete({ userId });

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User with ID ${userId} deleted successfully`,
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
