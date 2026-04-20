import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Franchise from "@/models/Franchise";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { name, email, phone, city, investment } = body;

    if (!name || !email || !phone || !city || !investment) {
      return NextResponse.json(
        { success: false, message: "Please fill all required fields" },
        { status: 400 }
      );
    }

    const franchise = await Franchise.create(body);

    return NextResponse.json(
      { success: true, message: "Application submitted successfully", data: franchise },
      { status: 201 }
    );
  } catch (error) {
    console.error("Franchise API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Franchise ID is required" },
        { status: 400 }
      );
    }

    const franchise = await Franchise.findByIdAndUpdate(id, updateData, { new: true });

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Payment status updated successfully", data: franchise },
      { status: 200 }
    );
  } catch (error) {
    console.error("Franchise PUT API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const franchises = await Franchise.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: franchises }, { status: 200 });
  } catch (error) {
    console.error("Franchise GET API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}