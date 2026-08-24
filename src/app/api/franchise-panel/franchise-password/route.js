import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import FranchisePanel from "@/models/franchisePanel";

const REVEAL_PASSKEY = process.env.FRANCHISE_PASSWORD_PASSKEY || "limbu007";

export async function POST(req) {
  try {
    await dbConnect();

    const { id, passkey } = await req.json();

    if (!id || !passkey) {
      return NextResponse.json(
        { success: false, message: "id and passkey are required" },
        { status: 400 }
      );
    }

    if (passkey !== REVEAL_PASSKEY) {
      return NextResponse.json(
        { success: false, message: "Invalid passkey" },
        { status: 401 }
      );
    }

    const franchise = await FranchisePanel.findById(id).select(
      "+plainPassword franchiseName"
    );

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 }
      );
    }

    // Older accounts only have a bcrypt hash, which cannot be reversed.
    // The client uses `needsReset` to offer setting a new password instead.
    if (!franchise.plainPassword) {
      return NextResponse.json({
        success: true,
        data: {
          _id: franchise._id,
          password: null,
          needsReset: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: franchise._id,
        password: franchise.plainPassword,
        needsReset: false,
      },
    });
  } catch (error) {
    console.error("Reveal Franchise Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const { id, passkey, newPassword } = await req.json();

    if (!id || !passkey || !newPassword?.trim()) {
      return NextResponse.json(
        { success: false, message: "id, passkey and newPassword are required" },
        { status: 400 }
      );
    }

    if (passkey !== REVEAL_PASSKEY) {
      return NextResponse.json(
        { success: false, message: "Invalid passkey" },
        { status: 401 }
      );
    }

    const password = newPassword.trim();

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const franchise = await FranchisePanel.findById(id);

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: "Franchise not found" },
        { status: 404 }
      );
    }

    franchise.password = await bcrypt.hash(password, 10);
    franchise.plainPassword = password;
    await franchise.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      data: {
        _id: franchise._id,
        password,
      },
    });
  } catch (error) {
    console.error("Set Franchise Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
