import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const valid = password === admin.password;
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        permissions: admin.permissions || {},
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      email: admin.email,
      fullName: admin.fullName,
      token,
      role: admin.role,
      permissions: admin.permissions || {},
    });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
