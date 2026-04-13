import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();
    let allListings = [];
    try {
      allListings = await fetchAllUserGmbListings(session.accessToken);
    } catch (e) {
      return NextResponse.json(
        { error: e?.message || "Failed to load listings" },
        { status: 502 }
      );
    }

    if (!allListings.length) {
      return NextResponse.json({
        success: true,
        count: 0,
        listings: [],
        message: "No Google Business locations found for this login.",
      });
    }

    const origin = new URL(request.url).origin;
    const saveRes = await fetch(`${origin}/api/admin/saveBussiness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, listings: allListings }),
    });
    const saveJson = await saveRes.json().catch(() => ({}));
    if (!saveRes.ok) {
      return NextResponse.json(
        { error: saveJson?.error || "Failed to save listings" },
        { status: saveRes.status >= 400 ? saveRes.status : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: allListings.length,
      listings: allListings,
    });
  } catch (error) {
    console.error("sync-and-save:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
