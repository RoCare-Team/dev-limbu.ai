

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import JobApplication from "@/models/JobApplication";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const application = await JobApplication.create({
      jobId: body.jobId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      linkedin: body.linkedin,
      resumeUrl: body.resumeUrl,
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("CAREER APPLY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}