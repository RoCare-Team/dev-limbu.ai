import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";

export const dynamic = "force-dynamic";

/**
 * Preview listings for connect screen (Grexa-style): verified vs not fully verified.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
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

    const linkedVerified = allListings.filter(
      (l) => l.hasVoiceOfMerchant === true
    );
    const notLinkedOrUnverified = allListings.filter(
      (l) => l.hasVoiceOfMerchant !== true
    );

    return NextResponse.json({
      success: true,
      email,
      hasGoogleBusinessAccount: allListings.length > 0,
      linkedVerified,
      notLinkedOrUnverified,
      total: allListings.length,
    });
  } catch (error) {
    console.error("my-locations:", error);
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}
