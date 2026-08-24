import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

export async function GET() {
  try {
    await dbConnect();

    const franchises = await FranchisePanel.find({})
      .select("-password") // password hide
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: franchises.length,
      data: franchises,
    });
  } catch (error) {
    console.error("Get All Franchises Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const { id, password } = await req.json();

    if (!id || !password) {
      return NextResponse.json(
        { success: false, message: "id and password are required" },
        { status: 400 }
      );
    }

    if (password !== "Manoj@321#") {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    const franchise = await FranchisePanel.findById(id);

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 }
      );
    }

    franchise.isActive = !franchise.isActive;
    await franchise.save();

    return NextResponse.json({
      success: true,
      message: franchise.isActive
        ? "Franchise activated successfully"
        : "Franchise suspended successfully",
      data: {
        _id: franchise._id,
        isActive: franchise.isActive,
      },
    });
  } catch (error) {
    console.error("Update Franchise Status Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * Franchise ko permanently delete karta hai.
 * Admin password mandatory hai — PATCH (suspend/activate) wala hi password.
 */
export async function DELETE(req) {
  try {
    await dbConnect();

    const { id, password } = await req.json();

    if (!id || !password) {
      return NextResponse.json(
        { success: false, message: "id and password are required" },
        { status: 400 }
      );
    }

    if (password !== "Manoj@321#") {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    const franchise = await FranchisePanel.findByIdAndDelete(id);

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 }
      );
    }

    console.log(
      `[Franchise] Deleted ${franchise.franchiseCode} (${franchise.franchiseName})`
    );

    return NextResponse.json({
      success: true,
      message: "Franchise deleted successfully",
      data: {
        _id: franchise._id,
        franchiseName: franchise.franchiseName,
      },
    });
  } catch (error) {
    console.error("Delete Franchise Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
