import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // ✅ ADD THIS

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    // 1️⃣ Admin find
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2️⃣ HASHED PASSWORD CHECK (IMPORTANT CHANGE)
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2.5️⃣ Block deactivated admins (isActive === false cannot log in)
    if (admin.isActive === false) {
      return NextResponse.json(
        { message: "Your account is deactivated. Please contact the administrator." },
        { status: 403 }
      );
    }

    // 3️⃣ JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        permissions: admin.permissions || {},
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4️⃣ Success response
    return NextResponse.json({
      adminId: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      token,
      role: admin.role,
      permissions: admin.permissions || {},
      // Section-wise menu access — the sidebar and route guard read this.
      access: Array.isArray(admin.access) ? admin.access : [],
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
