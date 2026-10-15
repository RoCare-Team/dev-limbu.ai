import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import { canManageRole } from "@/lib/adminAccess";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";
const REVEAL_PASSKEY = process.env.USER_PASSWORD_PASSKEY || "limbu007";

/** Only these roles may see or reset another user's password. */
const ALLOWED_ROLES = ["superAdmin", "seniorManager", "admin"];

function authorize(req) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET);
  } catch {
    return { error: "Invalid token", status: 401 };
  }

  if (!ALLOWED_ROLES.includes(decoded.role)) {
    return { error: "No permission to view passwords", status: 403 };
  }

  return { decoded };
}

export async function POST(req) {
  try {
    await dbConnect();

    const auth = authorize(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

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

    const user = await Admin.findById(id).select("+plainPassword fullName role");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!canManageRole(auth.decoded.role, user.role)) {
      return NextResponse.json(
        { success: false, message: "No permission for a superAdmin account" },
        { status: 403 }
      );
    }

    // Older accounts only have a bcrypt hash, which cannot be reversed.
    // The client uses `needsReset` to offer setting a new password instead.
    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        password: user.plainPassword || null,
        needsReset: !user.plainPassword,
      },
    });
  } catch (error) {
    console.error("Reveal User Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const auth = authorize(req);
    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

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

    const user = await Admin.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!canManageRole(auth.decoded.role, user.role)) {
      return NextResponse.json(
        { success: false, message: "No permission for a superAdmin account" },
        { status: 403 }
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.plainPassword = password;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      data: {
        _id: user._id,
        password,
      },
    });
  } catch (error) {
    console.error("Set User Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
