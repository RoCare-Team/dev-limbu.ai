import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";

export async function GET() {
  await dbConnect();

  const managers = await Admin.find({
    role: "manager",
    isActive: true,
  }).select("fullName email");

  return NextResponse.json({
    success: true,
    data: managers,
  });
}