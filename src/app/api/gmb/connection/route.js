import { NextResponse } from "next/server";
import { getAppUser, getGmbPhone } from "@/lib/appSession";
import { getGmbConnection, getGmbConnectionByPhone } from "@/lib/gmbSession";

export const dynamic = "force-dynamic";

/**
 * Client ke `useGmbConnection()` hook ke liye connection status.
 * `useSession()` ki jagah — par ye app login ke baare me kuch nahi kehta,
 * sirf GMB connected hai ya nahi.
 *
 * Do identities support karta hai:
 *   • app session cookie (normal dashboard users)
 *   • GMB-only phone cookie (WhatsApp chatbot flow)
 */
export async function GET(request) {
  const appUser = getAppUser(request);
  const phone = appUser?.userId ? null : getGmbPhone(request);

  if (!appUser?.userId && !phone) {
    return NextResponse.json({ loggedIn: false, connected: false }, { status: 200 });
  }

  const conn = appUser?.userId
    ? await getGmbConnection(appUser.userId)
    : await getGmbConnectionByPhone(phone);

  return NextResponse.json({
    loggedIn: true,
    connected: !!conn && !conn.invalid,
    // invalid = token revoke/expire ho gaya. UI "Reconnect" dikhaye, logout na kare.
    needsReconnect: !!conn?.invalid,
    reason: conn?.invalidReason || null,
    email: conn?.email || null,
    name: conn?.name || null,
    image: conn?.image || null,
    connectedAt: conn?.connectedAt || null,
  });
}
