import { NextResponse } from "next/server";
import { requireGmbSession, markConnectionScopeInsufficient } from '@/lib/gmbSession';
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Pehle yahan har failure 401 tha, isliye cookie ka chhota sa hiccup bhi
    // "Session Expired" modal dikha deta tha. Ab codes alag hain:
    // 401 = app login, 409 = GMB reconnect, 503 = Google transient.
    const { session, error } = await requireGmbSession(request);
    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    const email = session.user.email;
    let allListings = [];
    try {
      allListings = await fetchAllUserGmbListings(session.accessToken);
    } catch (e) {
      // Token zinda hai par usme business.manage scope nahi (user ne consent
      // screen par Business Profile ka checkbox tick nahi kiya). Pehle ye 502
      // ke saath poora Google JSON toast me chala jata tha aur user kuch kar
      // nahi sakta tha. Ab reconnect flow trigger hota hai.
      if (e?.code === "GMB_RECONNECT_REQUIRED") {
        await markConnectionScopeInsufficient(session.user?.id || session.userId);
        return NextResponse.json(
          { error: e.message, code: e.code, reason: e.reason },
          { status: 409 },
        );
      }
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
