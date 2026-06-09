


import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import AuditTracking from "@/models/AuditTracking";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  console.log("AUDIT TRACKING DATA");

  await AuditTracking.create({
    email: body.email,
    locationId: body.locationId,
    accountId: body.accountId,
    businessName: body.businessName,
    createdAt: new Date(),
  });

  return NextResponse.json({
    success: true,
  });
}