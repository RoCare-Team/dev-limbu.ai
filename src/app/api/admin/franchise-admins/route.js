import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    // Fetch only admins with role 'franchiseAdmin'
    const admins = await Admin.find({ role: "franchiseAdmin" })
      .select("fullName email _id")
      .lean();

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}