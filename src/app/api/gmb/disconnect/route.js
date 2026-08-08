import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import GmbUser from "@/models/GmbUser";
import { getAppUser, getGmbPhone } from "@/lib/appSession";
import { getGmbConnectionByPhone } from "@/lib/gmbSession";
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
    // Apna scoped slot hi hatao — impersonated session sirf admin_impersonation
    // wala slot disconnect kare, real client login sirf apna "self" wala.
    // Warna self-login user disconnect kare to admin ka manager-access
    // connection bhi mit jata (ya ulta), jabki dono independent hone chahiye.
    const conn = appUser?.userId
      ? await GmbConnection.findOne({
          userId: appUser.userId,
          connectedBy: appUser.impersonated ? "admin_impersonation" : "self",
        })
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

    // Legacy record se bhi wahi googleId nikaal do.
    if (conn?.email && conn?.googleId) {
      await GmbUser.updateOne(
        { email: conn.email },
        { $pull: { projects: { googleId: conn.googleId } } },
      ).catch(() => {});
    }

    // Dashboard `useGMB` hook GMB live disconnect hote hi ye purani DB-cached
    // listings (`AdminBusiness`, `/api/admin/saveBussiness`) wapas dikhata
    // reh jata tha — kyunki wo cache GMB connection se independent hai aur
    // disconnect isse chhuta nahi tha. Isliye dashboard refresh na karo tab
    // tak purana data dikhta rehta ("disconnect ho gaya par dikh raha hai").
    if (appUser?.email) {
      try {
        const AdminBusiness = await getAdminBusinessModel();
        await AdminBusiness.deleteOne({ userEmail: appUser.email.toLowerCase() });
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
