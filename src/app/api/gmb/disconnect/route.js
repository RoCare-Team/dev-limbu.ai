import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import { getAppUser } from "@/lib/appSession";

export const dynamic = "force-dynamic";

/**
 * GMB connection hatao. App login par koi asar nahi —
 * user logged in rehta hai, bas GMB disconnected ho jata hai.
 */
export async function POST(request) {
  try {
    const appUser = getAppUser(request);
    if (!appUser?.userId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    await dbConnect();
    const conn = await GmbConnection.findOne({ userId: appUser.userId });

    if (conn?.refreshToken) {
      // Google ki taraf se bhi grant hata do, taaki agli baar saaf consent mile.
      await axios
        .post(
          "https://oauth2.googleapis.com/revoke",
          new URLSearchParams({ token: conn.refreshToken }).toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
        )
        .catch((e) =>
          console.warn("[gmb/disconnect] revoke failed:", e.response?.data || e.message),
        );
    }

    await GmbConnection.deleteOne({ userId: appUser.userId });

    // Legacy record se bhi wahi googleId nikaal do.
    if (conn?.email && conn?.googleId) {
      await GmbUser.updateOne(
        { email: conn.email },
        { $pull: { projects: { googleId: conn.googleId } } },
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gmb/disconnect]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
