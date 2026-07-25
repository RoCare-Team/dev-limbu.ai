import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GmbConnection from "@/models/GmbConnection";
import { getAppUser, getGmbPhone } from "@/lib/appSession";
import { getGmbConnection, getGmbConnectionByPhone, ensureFreshToken } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

/**
 * Token ke "session expired" ki asli wajah dekhne ke liye diagnostic.
 *
 * GET /api/gmb/debug            → current user/phone ka connection
 * GET /api/gmb/debug?refresh=1  → live refresh bhi try karke result batata hai
 *
 * Sensitive tokens NAHI dikhata — sirf status, expiry, aur invalidReason.
 */
export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);

  // Admin diagnostic: ?userId=USR… kisi bhi user ka status dekhne ke liye.
  // CRON_SECRET set ho to Authorization: Bearer <secret> chahiye (warna khula
  // rahega jaise baaki cron routes EC2 par).
  const adminUserId = searchParams.get("userId")?.trim();
  if (adminUserId) {
    const secret = process.env.CRON_SECRET;
    const auth = request.headers.get("authorization") || "";
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const appUser = adminUserId ? { userId: adminUserId } : getAppUser(request);
  const phone = appUser?.userId ? null : getGmbPhone(request);

  if (!appUser?.userId && !phone) {
    return NextResponse.json(
      { ok: false, error: "Not logged in (no app cookie / phone cookie)" },
      { status: 401 },
    );
  }

  const conn = appUser?.userId
    ? await getGmbConnection(appUser.userId)
    : await getGmbConnectionByPhone(phone);

  if (!conn) {
    return NextResponse.json({
      ok: true,
      identity: appUser?.userId ? { userId: appUser.userId } : { phone },
      connection: null,
      note: "Koi GmbConnection record nahi mila — connect karna padega.",
    });
  }

  const now = Date.now();
  const info = {
    userId: conn.userId,
    phone: conn.phone || null,
    email: conn.email || null,
    hasRefreshToken: !!conn.refreshToken,
    hasAccessToken: !!conn.accessToken,
    invalid: !!conn.invalid,
    invalidReason: conn.invalidReason || null,
    accessTokenExpires: conn.accessTokenExpires || 0,
    accessTokenExpiredNow: !conn.accessTokenExpires || now >= conn.accessTokenExpires,
    connectedAt: conn.connectedAt || null,
    updatedAt: conn.updatedAt || null,
  };

  // ?refresh=1 → asli refresh try karke batao kya hota hai.
  if (new URL(request.url).searchParams.get("refresh") === "1") {
    const fresh = await ensureFreshToken(conn);
    const after = await GmbConnection.findOne({ userId: conn.userId }).lean();
    info.refreshAttempt = {
      gotFreshToken: !!fresh,
      invalidAfter: !!after?.invalid,
      invalidReasonAfter: after?.invalidReason || null,
    };
  }

  return NextResponse.json({ ok: true, connection: info });
}
