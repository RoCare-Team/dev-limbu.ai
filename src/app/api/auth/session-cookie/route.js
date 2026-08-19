import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  APP_SESSION_COOKIE,
  appSessionCookieOptions,
  createAppSessionToken,
} from "@/lib/appSession";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

/**
 * localStorage me pada app login token ek httpOnly cookie me mirror karta hai.
 *
 * Iske bina har `fetch()` call site par Authorization header lagana padta —
 * ye ek jagah set hokar sabhi API routes ko authenticated bana deta hai.
 * Client ise SessionCookieSync se ek baar call karta hai.
 */
export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const impersonated = decoded.impersonated === true;
    const res = NextResponse.json({
      success: true,
      userId: decoded.userId,
      impersonated,
    });
    res.cookies.set({
      ...appSessionCookieOptions({ impersonated }),
      value: createAppSessionToken({
        userId: decoded.userId,
        email: decoded.email,
        impersonated,
      }),
    });
    return res;
  } catch (error) {
    console.error("session-cookie error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Logout — cookie clear. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ ...appSessionCookieOptions(), value: "", maxAge: 0 });
  return res;
}

/**
 * Cookie maujood hai ya nahi — client sirf tab POST kare jab zaroorat ho.
 *
 * Ye ROLLING session bhi hai: har valid check par cookie dobara issue ho jati
 * hai (poore 30 din aage). SessionCookieSync ise har page load aur window focus
 * par call karta hai, isliye regular user ka session kabhi expire nahi hota.
 * Pehle ye fixed 7-din ka tha — user 8ve din "Your login session isn't active"
 * dekhta tha, jabki UI use logged-in dikha raha hota tha.
 *
 * Impersonation session (6h) jaan-boojhkar extend NAHI hota — wo short-lived
 * hi rehna chahiye.
 */
export async function GET(request) {
  const cookie = request.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ active: false });
  try {
    const decoded = jwt.verify(cookie, JWT_SECRET);

    const res = NextResponse.json({
      active: true,
      userId: decoded.userId,
      impersonated: decoded.impersonated === true,
    });

    if (decoded.impersonated !== true) {
      res.cookies.set({
        ...appSessionCookieOptions(),
        value: createAppSessionToken({
          userId: decoded.userId,
          email: decoded.email,
          impersonated: false,
        }),
      });
    }

    return res;
  } catch {
    return NextResponse.json({ active: false });
  }
}
