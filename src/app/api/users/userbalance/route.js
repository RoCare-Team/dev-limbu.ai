import User from "@/models/User";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import { getUserActivePlans, planGroupsOf } from "@/lib/userPlans";

// ✅ GET: Fetch all users or single user by userId
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
      bufferCommands: false,
    });
  }
}
export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId"); // Optional query param

    if (userId) {
      // Fetch single user by userId
      const user = await User.findOne({ userId });

if (!user) {
  return NextResponse.json(
    { success: false, error: "User not found" },
    { status: 404 }
  );
}

const today = new Date();

const activePackages = await FranchiseRevenue.find({
  leadId: user.userId,
  type: { $in: ["user_onboard", "plan"] },
  status: { $in: ["active", "user_onboard"] },
});



const activeServices = await FranchiseRevenue.find({
  leadId: user.userId,
  type: "service",
});

const now = new Date();

const validPackages = activePackages.filter(
  (p) =>
    p.packageExpiryDate &&
    new Date(p.packageExpiryDate) >= now
);

const validServices = activeServices.filter(
  (p) =>
    p.packageExpiryDate &&
    new Date(p.packageExpiryDate) >= now
);

console.log(
  "PACKAGES =>",
  validPackages.map((p) => ({
    plan: p.plan,
    type: p.type,
    status: p.status,
    expiry: p.packageExpiryDate,
  }))
);


const uniquePackages = Object.values(
  validPackages.reduce((acc, item) => {
    if (
      item.plan &&
      (
        !acc[item.plan] ||
        new Date(item.createdAt) > new Date(acc[item.plan].createdAt)
      )
    ) {
      acc[item.plan] = item;
    }

    return acc;
  }, {})
);

const uniqueServices = Object.values(
  validServices.reduce((acc, item) => {
    if (
      item.plan &&
      (
        !acc[item.plan] ||
        new Date(item.createdAt) > new Date(acc[item.plan].createdAt)
      )
    ) {
      acc[item.plan] = item;
    }

    return acc;
  }, {})
);




// Feature groups ("gmb", "social") the user's active plans unlock — drives the sidebar.
const planGroups = planGroupsOf(await getUserActivePlans(user));

return NextResponse.json({
  success: true,
  user: {
    ...user.toObject(),
    planGroups,

    activePackages: uniquePackages.map((p) => ({
  _id: p._id,
  plan: p.plan,
})),

activeServices: uniqueServices.map((p) => ({
  _id: p._id,
  plan: p.plan,
})),
  },
});
    }

    // If no userId, fetch all users
    const users = await User.find({});
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
