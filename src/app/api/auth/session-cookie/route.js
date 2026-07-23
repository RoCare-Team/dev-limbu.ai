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

    const res = NextResponse.json({
      success: true,
      userId: decoded.userId,
      impersonated: decoded.impersonated === true,
    });
    res.cookies.set({
      ...appSessionCookieOptions(),
      value: createAppSessionToken({
        userId: decoded.userId,
        email: decoded.email,
        impersonated: decoded.impersonated,
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

/** Cookie maujood hai ya nahi — client sirf tab POST kare jab zaroorat ho. */
export async function GET(request) {
  const cookie = request.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ active: false });
  try {
    const decoded = jwt.verify(cookie, JWT_SECRET);
    return NextResponse.json({
      active: true,
      userId: decoded.userId,
      impersonated: decoded.impersonated === true,
    });
  } catch {
    return NextResponse.json({ active: false });
  }
}
