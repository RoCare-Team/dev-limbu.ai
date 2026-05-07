/**
 * GET /api/gmb/check-phone?phone=919876543210
 *
 * Check if a phone number already has a GMB connection in the database.
 * Used to determine if user is new or returning.
 *
 * Response:
 *   - exists: boolean (true if phone found in GMBConnection)
 *   - userEmail: string (email if exists, empty otherwise)
 *   - locationsCount: number (how many locations connected)
 *   - status: string (success, not_found, pending)
 */

import { NextResponse } from "next/server";
import { findGmbSessionByPhone, normalizePhone } from "@/lib/gmbSessionStore";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get("phone") || "");

    if (!phone) {
      return NextResponse.json(
        { error: "phone parameter is required" },
        { status: 400 }
      );
    }

    // Check if phone exists in database
    const existing = await findGmbSessionByPhone(phone);

    if (!existing) {
      return NextResponse.json({
        exists: false,
        userEmail: "",
        locationsCount: 0,
        status: "new_user",
      });
    }

    return NextResponse.json({
      exists: true,
      userEmail: existing.userEmail || "",
      locationsCount: (existing.locationsData || []).length,
      status: existing.status || "pending",
      createdAt: existing.createdAt,
      hasTokens: !!(existing.accessToken && existing.refreshToken),
    });
  } catch (error) {
    console.error("[check-phone]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to check phone" },
      { status: 500 }
    );
  }
}
