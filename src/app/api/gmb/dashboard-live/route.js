import { NextResponse } from "next/server";
import { getGmbSession } from '@/lib/gmbSession';
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getGmbSession(request);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    let allListings = [];
    try {
      allListings = await fetchAllUserGmbListings(session.accessToken);
    } catch (e) {
      return NextResponse.json(
        { error: e?.message || "Failed to load Google Business data" },
        { status: 502 }
      );
    }

    // Format matches what useGMB.js expects
    const finalData = [{ 
      email: email, 
      listings: allListings.map(loc => ({
        ...loc,
        verified: loc.hasVoiceOfMerchant // sync for legacy components
      }))
    }];

    return NextResponse.json({
      success: true,
      accounts: finalData,
      noAccountsFound: allListings.length === 0,
    });
  } catch (error) {
    console.error("dashboard-live error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
