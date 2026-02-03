import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    const admins = await Admin.find();
    let hashedCount = 0;
    let skippedCount = 0;

    for (const admin of admins) {
      if (admin.password && !admin.password.startsWith("$2")) {
        admin.password = await bcrypt.hash(admin.password, 10);
        await admin.save();
        hashedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Password migration completed",
      totalAdmins: admins.length,
      hashed: hashedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Password hash migration error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
