
// Next.js ka built-in response helper. || API se JSON format me response bhejne ke liye.
import { NextResponse } from "next/server";

// Custom function jo MongoDB se connection karta hai. || kya kaam Database connect kiye bina query nahi chalegi.|| agar hata de Admin.find() pe error aayega → DB connected nahi.
import dbConnect from "@/lib/dbConnect";

// Admin model (Mongoose schema). || kya kaam Admin collection me data read karne ke liye.
import Admin from "@/models/Admin";

// Next.js App Router me by default GET request kabhi-kabhi static caching kar deta hai. || force-dynamic ka matlab: Har request pe fresh data fetch karo  Cache use mat karo
export const dynamic = "force-dynamic";

export async function GET() { // GET request ka handler.  || Jab koi frontend se request kare:
  try {
    await dbConnect(); // Database connection ensure karta hai. || Har API request pe ye call hota hai.
    // Fetch only admins with role 'franchiseAdmin'
    // Admin collection me search karta hai: || Sirf woh admins lao jinka role franchiseAdmin hai. || Sab admins aa jayenge (superAdmin, agent, sab).
    const admins = await Admin.find({ role: "franchiseAdmin" }) 
      .select("fullName email _id") // Sirf ye fields return kare: fullName email id
      .lean(); // Normal Mongoose query return karta hai: \\  Mongoose Document Object || .lean() use karne se: || Plain JavaScript object milta hai

    return NextResponse.json({ success: true, data: admins }); // Client ko JSON response bhej raha hai.
  } catch (error) { // Agar DB error aaye to handle karega.
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Toggle isActive status
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { adminId, isActive } = body;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "adminId is required" },
        { status: 400 }
      );
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true }
    ).select("fullName email _id isActive");

    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isActive ? "Admin activated successfully" : "Admin deactivated successfully",
      data: updatedAdmin
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error: error.message },
      { status: 500 }
    );
  }
}
