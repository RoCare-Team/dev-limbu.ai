import { NextResponse } from "next/server";
import { getAdminBusinessModel } from "@/lib/adminBusinessStore";

//
// ✅ POST API (SAVE / UPDATE)
//
export async function POST(req) {
  try {
    const AdminBusiness = await getAdminBusinessModel();

    const body = await req.json();
    const { userId, userEmail, listings } = body;

    // `userId` ab asli key hai — GmbConnection jaisi hi identity.
    // `userEmail` sirf display/backward-compat ke liye chahiye.
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "userId (or userEmail) is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(listings)) {
      return NextResponse.json(
        { error: "Listings must be an array" },
        { status: 400 }
      );
    }

    const updatedBusiness = await AdminBusiness.findOneAndUpdate(
      // userId maujood ho to USI se match karo — do alag userId same email
      // share kar sakte hain, tab email-match galat user ka document
      // overwrite kar deta. Sirf userId na hone par (purana caller) email
      // par fallback.
      userId ? { userId } : { userEmail: userEmail.toLowerCase() },
      {
        ...(userId ? { userId } : {}),
        ...(userEmail ? { userEmail: userEmail.toLowerCase() } : {}),
        listings,
        timestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      listings: updatedBusiness.listings,
    });
  } catch (err) {
    console.error("Save listings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//
// ✅ GET API (FETCH LISTINGS)
//
export async function GET(req) {
  try {
    const AdminBusiness = await getAdminBusinessModel();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    // Sirf backward-compat / display ke liye — asli lookup ab userId se hoti
    // hai, kyunki do alag userId same email share kar sakte the aur email
    // se query karne par ek user ka data doosre ke dashboard par dikh jata.
    const userEmail = searchParams.get("userEmail") || searchParams.get("email");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    // If neither identifier is provided, return all businesses (paginated for Admin Dashboard)
    if (!userId && !userEmail) {
      const total = await AdminBusiness.countDocuments();
      
      // Calculate global stats using aggregation for performance
      const globalStatsResult = await AdminBusiness.aggregate([
        {
          $project: {
            totalListings: { $size: { $ifNull: ["$listings", []] } },
            verifiedCount: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$listings", []] },
                  as: "listing",
                  cond: { 
                    $or: [
                      { $eq: ["$$listing.verified", true] },
                      { $eq: ["$$listing.metadata.hasVoiceOfMerchant", true] }
                    ]
                  }
                }
              }
            },
            unverifiedCount: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$listings", []] },
                  as: "listing",
                  cond: { 
                    $not: {
                      $or: [
                        { $eq: ["$$listing.verified", true] },
                        { $eq: ["$$listing.metadata.hasVoiceOfMerchant", true] }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            globalTotalListings: { $sum: "$totalListings" },
            globalVerifiedCount: { $sum: "$verifiedCount" },
            globalUnverifiedCount: { $sum: "$unverifiedCount" }
          }
        }
      ]);

      const globalStats = globalStatsResult[0] || {
        globalTotalListings: 0,
        globalVerifiedCount: 0,
        globalUnverifiedCount: 0
      };

      const allBusinesses = await AdminBusiness.find({})
        .sort({ timestamp: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .allowDiskUse(true)
        .lean();
      
      // Map to the format expected by the frontend
      const formattedListings = allBusinesses.map(biz => ({
        userEmail: biz.userEmail || null,
        userName: biz.userEmail?.split('@')[0] || 'Unknown',
        totalListings: biz.listings?.length || 0,
        verifiedCount: biz.listings?.filter(l => l.verified || l.metadata?.hasVoiceOfMerchant)?.length || 0,
        unverifiedCount: biz.listings?.filter(l => !(l.verified || l.metadata?.hasVoiceOfMerchant))?.length || 0,
        listings: biz.listings || [],
        lastUpdated: biz.timestamp
      }));

      return NextResponse.json({
        success: true,
        listings: formattedListings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        globalStats: {
          totalUsers: total,
          totalListings: globalStats.globalTotalListings,
          verifiedListings: globalStats.globalVerifiedCount,
          unverifiedListings: globalStats.globalUnverifiedCount
        }
      });
    }

    // userId maujood ho to USI se dhoondo — email sirf tab jab caller ke
    // paas userId hi nahi hai (purana/legacy call site).
    const business = await AdminBusiness.findOne(
      userId ? { userId } : { userEmail: userEmail.toLowerCase() },
    );

    if (!business) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listings: business.listings,
    });
  } catch (err) {
    console.error("Get listings error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}