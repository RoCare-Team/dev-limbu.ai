import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { cleanPhone, isIndianMobile, maskName, phoneVariants } from "@/lib/walletTopup";

/**
 * POST /api/wallet/lookup { phone }
 * Is there a Limbu AI account on this number? Returns only a masked name, never
 * the userId, email or balance, because anyone can type any number here.
 */
export async function POST(req) {
  try {
    const { phone: raw } = await req.json();
    const phone = cleanPhone(raw);
    if (!isIndianMobile(phone)) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ phone: { $in: phoneVariants(phone) } }).select("fullName").lean();
    return NextResponse.json({
      success: true,
      found: !!user,
      name: user ? maskName(user.fullName) || "Limbu AI user" : null,
    });
  } catch (err) {
    console.error("wallet lookup error:", err);
    return NextResponse.json({ success: false, error: "Could not check this number right now." }, { status: 500 });
  }
}
