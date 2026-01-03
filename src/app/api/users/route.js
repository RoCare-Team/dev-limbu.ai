import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// 🧩 Schema Definition
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  email: { type: String, unique: true },
  fullName: String,
  phone: String,
  passwordHash: String,
  subscription: {
    plan: String,
    paymentId: String,
    orderId: String,
    date: Date,
    status: String,
  },
  createdAt: Date,
});

const User = mongoose.models.users || mongoose.model("users", UserSchema);

// 🔗 MongoDB Connection
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

// ✅ GET: Fetch all users
// ✅ GET: Fetch all users (Newest first)
// ✅ GET: Fetch users with pagination (Newest first)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1; // default page = 1
    const searchQuery = searchParams.get("search") || "";
    const filterStatus = searchParams.get("status");
    const filterDate = searchParams.get("date");
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");
    const limit = 70; // fixed limit = 70 users per request

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (searchQuery) {
      query.$or = [
        { email: { $regex: searchQuery, $options: "i" } },
        { userId: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
        { fullName: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (filterDate && filterDate !== "All") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate;
      let endDate;

      switch (filterDate) {
        case "Today":
          startDate = today;
          break;
        case "Last 7 Days":
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "Last 30 Days":
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "This Month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "Custom":
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setDate(end.getDate() + 1); // Move to next day to include the full end date
            endDate = end;
          }
          break;
      }
      if (startDate && endDate) {
        query.createdAt = { $gte: startDate, $lt: endDate };
      } else if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 }) // newest first
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


// ✅ POST: Dashboard stats + monthly growth
// ✅ POST: Dashboard stats + monthly growth + plan breakdown + total revenue
export async function POST(req) {
  try {
    await connectDB();
    const users = await User.find({});

    const totalUsers = users.length;

    // Active/inactive counts
    const activeUsers = users.filter(
      (u) => u.subscription?.status === "active"
    ).length;
    const inactiveUsers = totalUsers - activeUsers;

    // Latest signup
    const latestUser = users.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    // 📊 Monthly user growth
    const monthlyData = Array(12).fill(0);
    users.forEach((user) => {
      if (user.createdAt) {
        const month = new Date(user.createdAt).getMonth();
        monthlyData[month]++;
      }
    });

    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const userGrowth = monthLabels.map((m, i) => ({
      month: m,
      users: monthlyData[i],
    }));

    // 💳 Plan breakdown
    const planCounts = {
      basic: users.filter((u) => u.subscription?.plan?.toLowerCase() === "basic").length,
      standard: users.filter((u) => u.subscription?.plan?.toLowerCase() === "standard").length,
      premium: users.filter((u) => u.subscription?.plan?.toLowerCase() === "premium").length,
    };

    // 💰 Calculate total revenue (assuming you have revenue info)
    // If each plan has a fixed price, you can define them here:
    const PLAN_PRICES = {
      basic: 499,
      standard: 999,
      premium: 1999,
    };

    const totalRevenue =
      planCounts.basic * PLAN_PRICES.basic +
      planCounts.standard * PLAN_PRICES.standard +
      planCounts.premium * PLAN_PRICES.premium;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        latestSignup: latestUser?.createdAt || null,
        totalRevenue,
        planCounts,
      },
      userGrowth,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


// ✅ PUT: Update user's subscription plan
export async function PUT(req) {
  try {
    await connectDB();

    const { userId, newPlan } = await req.json();
    if (!userId || !newPlan)
      return NextResponse.json(
        { success: false, error: "Missing userId or newPlan" },
        { status: 400 }
      );

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        $set: {
          "subscription.plan": newPlan,
          "subscription.status": "active",
          "subscription.date": new Date(),
        },
      },
      { new: true }
    );

    if (!updatedUser)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );

    return NextResponse.json({
      success: true,
      message: `Plan updated to ${newPlan}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Remove user by userId
export async function DELETE(req) {
  try {
    await connectDB();

    const { userId } = await req.json();
    if (!userId)
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );

    const deletedUser = await User.findOneAndDelete({ userId });

    if (!deletedUser)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );

    return NextResponse.json({
      success: true,
      message: `User with ID ${userId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
