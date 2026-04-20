import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { clientPromise } from "@/lib/mongodb";

// Constants for the second database
const GMB_DASHBOARD_DB = "gmb_dashboard";
const USERS_COLLECTION = "users";

export async function GET(req) {
  try {
    // 1. Get pagination parameters from the URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    // 2. Connect to the primary database via Mongoose
    await dbConnect();

    // 3. Connect to the second database (gmb_dashboard) via MongoClient
    const client = await clientPromise;
    const gmbDb = client.db(GMB_DASHBOARD_DB);
    const gmbUsersCol = gmbDb.collection(USERS_COLLECTION);

    // 4. Fetch all emails from primary database, sorted to ensure consistent pagination
    const appUsersWithEmails = await User.find({})
      .select("email")
      .sort({ createdAt: -1 })
      .lean();

    const appEmails = appUsersWithEmails.map((u) => u.email).filter(Boolean);

    // 5. Check which of these emails exist in gmb_dashboard.users
    const gmbUsers = await gmbUsersCol
      .find({
        email: { $in: appEmails },
      })
      .project({ email: 1 }) // Only need email for matching
      .toArray();

    // 6. Use a Set for fast lookup and ensure uniqueness
    const gmbEmailsSet = new Set(gmbUsers.map((g) => g.email?.toLowerCase()));

    // 7. Filter appEmails to keep only the common ones (this maintains the sort order)
    const commonEmails = appEmails.filter((email) =>
      gmbEmailsSet.has(email.toLowerCase())
    );
    
    const total = commonEmails.length;

    // 8. Apply pagination to the ordered common emails list
    const paginatedEmails = commonEmails.slice(skip, skip + limit);

    // 9. Fetch full details for ONLY the paginated subset of users
    const commonUsers = await User.find({
      email: { $in: paginatedEmails },
    })
      .select("_id userId fullName email phone wallet freeUsedCount subscription")
      .lean();

    // 10. Reorder the result to match the paginatedEmails array (since $in doesn't guarantee order)
    const orderedCommonUsers = paginatedEmails
      .map((email) => commonUsers.find((u) => u.email === email))
      .filter(Boolean);

    // 11. Return the paginated response
    return NextResponse.json(
      {
        success: true,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data: orderedCommonUsers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching common users:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
