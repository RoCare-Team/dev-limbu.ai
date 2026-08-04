import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import { getAppUser, getGmbPhone } from "@/lib/appSession";
import { getGmbConnectionByPhone } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

/**
 * GMB connection hatao. App login par koi asar nahi —
 * user logged in rehta hai, bas GMB disconnected ho jata hai.
 *
 * Chatbot flow (phone cookie) bhi support karta hai, kyunki wahan "Switch
 * account" ke liye pehle purana connection hatana padta hai.
 */
export async function POST(request) {
  try {
    const appUser = getAppUser(request);
    const phone = appUser?.userId ? null : getGmbPhone(request);

    if (!appUser?.userId && !phone) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    await dbConnect();
    const conn = appUser?.userId
      ? await GmbConnection.findOne({ userId: appUser.userId })
      : await getGmbConnectionByPhone(phone);

    // Google ka `revoke` ek token nahi, POORA GRANT hatata hai — us Google
    // account ke saare access + refresh token, chahe wo doosre app users ke
    // connections me store hon. Ek agency account 50+ businesses par juda hota
    // hai, to ek disconnect sabki automation tod deta tha.
    //
    // Isliye revoke sirf tab jab ye us account ka AAKHRI connection ho. Warna
    // apni copy hata dena hi kaafi hai; user chahe to Google account settings
    // se access khud hata sakta hai.
    if (conn?.refreshToken) {
      const siblings = conn.googleId
        ? await GmbConnection.countDocuments({
            googleId: conn.googleId,
            userId: { $ne: conn.userId },
          })
        : 0;

      if (siblings > 0) {
        console.log(
          `[gmb/disconnect] skipping Google revoke — ${siblings} other connection(s) share this Google account`,
        );
      } else {
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
    }

    // Jo record actually mila usi ko hatao — phone flow me userId app ka
    // userId bhi ho sakta hai aur `phone:<digits>` bhi.
    if (conn?.userId) {
      await GmbConnection.deleteOne({ userId: conn.userId });
    }

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
