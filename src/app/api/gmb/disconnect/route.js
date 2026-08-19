import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import { getAppUser, getGmbPhone } from "@/lib/appSession";
import { getGmbConnectionByPhone, getVisibleGmbConnection } from "@/lib/gmbSession";
import { getAdminBusinessModel } from "@/lib/adminBusinessStore";

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
    // Jo bhi connection UI ko "connected" dikha raha hai wahi hatao —
    // `getVisibleGmbConnection()` ki resolution order EXACTLY match karta hai
    // (impersonated: admin_impersonation pehle, phir self fallback; normal
    // login: sirf self). Pehle ye sirf hardcoded scope (`admin_impersonation`
    // impersonated ke liye) dhoondta tha — agar us scope me kuch nahi tha
    // (jaise yahan: user ne khud "self" connect kiya tha, admin ne nahi), to
    // `conn` null aata, kuch delete NAHI hota, phir bhi route `success: true`
    // laut deta. UI "disconnected" maan leta par agli hi refresh par wahi
    // "self" connection dobara "connected" dikha deta — Disconnect button
    // kaam hi nahi karta jaisa lagta.
    const conn = appUser?.userId
      ? await getVisibleGmbConnection(appUser.userId, appUser.impersonated)
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

    // Jo record actually mila usi ko hatao — sirf uski `_id` se, kyunki ab
    // ek `userId` ke do documents (self / admin_impersonation) ho sakte hain,
    // aur `{userId: conn.userId}` dono me se koi bhi ek uthake mita deta.
    if (conn?._id) {
      await GmbConnection.deleteOne({ _id: conn._id });
    }

    // Legacy `GmbUser.projects[]` poora saaf karo — sirf matched googleId
    // nikaalna kaafi nahi tha. `getVisibleGmbConnection()` GmbConnection row
    // na milne par `backfillFromGmbUser()` se ye legacy array padhta hai aur
    // ANY leftover project (refreshToken wala) se GmbConnection row wapas
    // bana deta ("upsert") deta hai — matlab disconnect ke turant baad, ya
    // admin ke seedhe DB se GmbConnection delete karne ke baad bhi, agli hi
    // request par GMB "connected" dikhne lagta tha. Is email ke saare
    // projects clear karke ye resurrection permanently rokte hain.
    if (conn?.email) {
      await GmbUser.updateOne(
        { email: conn.email },
        { $set: { projects: [] } },
      ).catch(() => {});
    }

    // Dashboard `useGMB` hook GMB live disconnect hote hi ye purani DB-cached
    // listings (`AdminBusiness`, `/api/admin/saveBussiness`) wapas dikhata
    // reh jata tha — kyunki wo cache GMB connection se independent hai aur
    // disconnect isse chhuta nahi tha. Isliye dashboard refresh na karo tab
    // tak purana data dikhta rehta ("disconnect ho gaya par dikh raha hai").
    if (appUser?.userId || appUser?.email) {
      try {
        const AdminBusiness = await getAdminBusinessModel();
        // userId se clear karo — email do alag userId ke beech shared ho
        // sakta hai, tab email-match doosre user ka cache bhi mita deta.
        await AdminBusiness.deleteOne(
          appUser.userId
            ? { userId: appUser.userId }
            : { userEmail: appUser.email.toLowerCase() },
        );
      } catch (e) {
        console.warn("[gmb/disconnect] AdminBusiness cache clear failed:", e.message);
      }
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
