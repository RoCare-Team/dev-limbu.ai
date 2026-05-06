  import { NextResponse } from "next/server";
  import dbConnect from "@/lib/dbConnect";
  
  import FranchiseRevenue from "@/models/FranchiseRevenue";
  import Admin from "@/models/Admin";
  import User from "@/models/User";
  import { getServerSession } from "next-auth";

  // ==================
  // GET: FETCH REVENUE DATA (ROLE-BASED)
  // ==================
  export async function GET(req) {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const email = searchParams.get("email");
      const role = searchParams.get("role");

      if (!email || !role) {
        return NextResponse.json(
          { success: false, message: "Email and role are required" },
          { status: 400 }
        );
      }

      const dateFilter = searchParams.get("dateFilter");
      const startDateParam = searchParams.get("startDate");
      const endDateParam = searchParams.get("endDate");
      
      let dateMatchQuery = {};
      if (dateFilter && startDateParam && endDateParam && dateFilter !== "all") {
         const startDate = new Date(startDateParam);
         startDate.setHours(0, 0, 0, 0);
         const endDate = new Date(endDateParam);
         endDate.setHours(23, 59, 59, 999);
         dateMatchQuery = { createdAt: { $gte: startDate, $lte: endDate } };
      }

      // Find the admin
      const admin = await Admin.findOne({ email }).lean();
      
      if (!admin) {
        return NextResponse.json(
          { success: false, message: "Admin not found" },
          { status: 404 }
        );
      }

      let revenueData;
      let totalRevenue = 0;
      
      // Separate breakdowns
      let userOnboardRevenue = 0;
      let franchiseLeadRevenue = 0;
      let userOnboardCount = 0;
      let franchiseLeadCount = 0;
      let paidLeads = []; // For tracking which leads have paid

      // SuperAdmin: See ALL revenue (both user onboarding and franchise leads)
     // SuperAdmin: See ALL revenue (both user onboarding and franchise leads)
if (role === "superAdmin" || role === "superFranchiseAdmin") {
  revenueData = await FranchiseRevenue.find({
    status: "active",
    ...dateMatchQuery,
  })
    .populate("onboardedBy", "fullName email role")
    .sort({ createdAt: -1 })
    .lean();

  // Calculate totals
  totalRevenue = revenueData.reduce(
    (sum, rev) => sum + (rev.amount || 0),
    0
  );

  userOnboardRevenue = revenueData
    .filter((rev) => rev.type === "user_onboard")
    .reduce((sum, rev) => sum + (rev.amount || 0), 0);

  franchiseLeadRevenue = revenueData
    .filter((rev) => rev.type === "franchise_lead")
    .reduce((sum, rev) => sum + (rev.amount || 0), 0);

  userOnboardCount = revenueData.filter(
    (rev) => rev.type === "user_onboard"
  ).length;

  franchiseLeadCount = revenueData.filter(
    (rev) => rev.type === "franchise_lead"
  ).length;

  paidLeads = revenueData
    .filter((rev) => rev.type === "franchise_lead")
    .map((rev) => rev.leadId);
}

// FranchiseAdmin: See only their own franchise lead revenue
else if (role === "franchiseAdmin") {
  revenueData = await FranchiseRevenue.find({
    onboardedBy: admin._id,
    status: "active",
    type: { $ne: "user_onboard" },
    ...dateMatchQuery,
  })
    .populate("onboardedBy", "fullName email role")
    .sort({ createdAt: -1 })
    .lean();

  totalRevenue = revenueData.reduce(
    (sum, rev) => sum + (rev.amount || 0),
    0
  );

  franchiseLeadRevenue = totalRevenue;
  franchiseLeadCount = revenueData.length;

  paidLeads = revenueData.map((rev) => rev.leadId);
}

// Agent: See only their own user onboarding revenue
else if (role === "agent") {
  revenueData = await FranchiseRevenue.find({
    onboardedBy: admin._id,
    status: "active",
    type: "user_onboard",
    ...dateMatchQuery,
  })
    .populate("onboardedBy", "fullName email role")
    .sort({ createdAt: -1 })
    .lean();

  totalRevenue = revenueData.reduce(
    (sum, rev) => sum + (rev.amount || 0),
    0
  );

  userOnboardRevenue = totalRevenue;
  userOnboardCount = revenueData.length;
}

else {
  return NextResponse.json(
    { success: false, message: "Unauthorized role" },
    { status: 403 }
  );
}

/* 🔥 USER EXPIRY FETCH FOR ALL ROLES */

const userIds = revenueData.map((item) => item.leadId);

const users = await User.find({
  userId: { $in: userIds },
})
  .select("userId packageExpiryDate packageStartDate")
  .lean();



const userMap = {};

users.forEach((user) => {
  userMap[String(user.userId).trim()] = user;
});



revenueData = revenueData.map((item) => ({
  ...item,

  userPackageExpiryDate:
    userMap[String(item.leadId).trim()]
      ?.packageExpiryDate || null,

  userPackageStartDate:
    userMap[String(item.leadId).trim()]
      ?.packageStartDate || null,
}));

// console.log("FINAL RESPONSE:", revenueData);

      return NextResponse.json({
  success: true,
  revenue: revenueData,
  totalRevenue,
  totalUserOnboardRevenue: userOnboardRevenue,
  totalFranchiseRevenue: franchiseLeadRevenue,
  userOnboardCount,
  franchiseLeadCount,
  count: revenueData.length,
  paidLeads,
});
    } catch (error) {
      console.error("Revenue Fetch Error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Server error" },
        { status: 500 }
      );
    }
  }

  // ==================
  // POST: ADD NEW REVENUE ENTRY
  // ==================
  export async function POST(req) {
    try {
      await dbConnect();

      const body = await req.json();
      console.log("API RECEIVED:", body);
      const { leadId, leadName, amount, paymentScreenshot, email, notes, planRemarks, plan, type, utrNumber,  packageStartDate,   packageExpiryDate    } = body;

      // Validation
      if (!leadId || !leadName || !amount || !paymentScreenshot || !email) {
        return NextResponse.json(
          { success: false, message: "All fields are required" },
          { status: 400 }
        );
      }

      // Find the admin who is onboarding
      const admin = await Admin.findOne({ email }).lean();
      
      if (!admin) {
        return NextResponse.json(
          { success: false, message: "Admin not found" },
          { status: 404 }
        );
      }

      // NOTE: The check for existing revenue has been removed to allow multiple payments 
      // (e.g., renewals, upgrades) for the same user/lead.

      // Create new revenue entry
      const newRevenue = new FranchiseRevenue({
  leadId,
  leadName,
  amount: parseFloat(amount),
  paymentScreenshot,
  onboardedBy: admin._id,
  onboardedByName: admin.fullName,
  onboardedByRole: admin.role,

  notes: notes || "",
  planRemarks: planRemarks || "",
  plan: plan || "",

  // 🔥 FIX HERE
  packageStartDate: packageStartDate ? new Date(packageStartDate) : null,
  packageExpiryDate: packageExpiryDate ? new Date(packageExpiryDate) : null,

  utrNumber: utrNumber || "",

  ...(type === "user_onboard" ? { planApprovalStatus: "pending" } : {}),
  type: type || "franchise_lead",
  status: "active",
});

      await newRevenue.save();

      return NextResponse.json({
        success: true,
        message: "Revenue added successfully",
        revenue: newRevenue,
      });
    } catch (error) {
      console.error("Revenue Add Error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Server error" },
        { status: 500 }
      );
    }
  }

  // ==================
  // PATCH: UPDATE REVENUE STATUS
  // ==================
  export async function PATCH(req) {
    try {
      await dbConnect();

      const body = await req.json();
      const { revenueId, status } = body;

      if (!revenueId || !status) {
        return NextResponse.json(
          { success: false, message: "Revenue ID and status are required" },
          { status: 400 }
        );
      }

      const validStatuses = ["active", "inactive"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value" },
          { status: 400 }
        );
      }

      const updatedRevenue = await FranchiseRevenue.findByIdAndUpdate(
        revenueId,
        { status },
        { new: true }
      ).lean();

      if (!updatedRevenue) {
        return NextResponse.json(
          { success: false, message: "Revenue entry not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Revenue status updated",
        revenue: updatedRevenue,
      });
    } catch (error) {
      console.error("Revenue Update Error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Server error" },
        { status: 500 }
      );
    }
  }


 export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      id,
      plan,
      amount,
      notes,
      planRemarks,
      packageStartDate,
      packageExpiryDate,
      type, // 🔥 ADD THIS
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    // ========================
    // 🔥 SERVICE UPDATE
    // ========================
    if (type === "service") {
  console.log("SERVICE UPDATE BODY:", body);

  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      ...(amount && { amount }),

      ...(notes !== undefined && { notes }),
      ...(notes !== undefined && { remarks: notes }), // 🔥 IMPORTANT

      ...(packageStartDate && {
        packageStartDate: new Date(packageStartDate),
      }),
      ...(packageExpiryDate && {
        packageExpiryDate: new Date(packageExpiryDate),
      }),
    },
    { new: true }
  );

  return NextResponse.json({
    success: true,
    user: updatedUser,
  });
}

    // ========================
    // 📦 PACKAGE UPDATE
    // ========================
    const updated = await FranchiseRevenue.findByIdAndUpdate(
      id,
      {
        ...(plan && { plan }),
        ...(amount && { amount }),
        ...(notes && { notes }),
        ...(planRemarks && { planRemarks }),

        ...(packageStartDate && {
          packageStartDate: new Date(packageStartDate),
        }),
        ...(packageExpiryDate && {
          packageExpiryDate: new Date(packageExpiryDate),
        }),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      revenue: updated,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
  // ==================
  // DELETE: DELETE REVENUE ENTRY
  // ==================
 
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    // 🔥 SERVICE DELETE
    if (type === "service") {
      await User.findByIdAndUpdate(id, {
        paidService: "",
        packageStartDate: null,
        packageExpiryDate: null,
        amount: 0,
        isServiceBooked: false,
      });

      return NextResponse.json({
        success: true,
        message: "Service deleted successfully",
      });
    }

    // 📦 PACKAGE DELETE
    const deleted = await FranchiseRevenue.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);

    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}