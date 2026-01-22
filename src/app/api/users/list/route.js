import Admin from "@/models/Admin";
import dbConnect from "@/lib/dbConnect";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

export async function GET(req) {
  try {
    await dbConnect();

    /* ----------------------------
       AUTH CHECK
    ---------------------------- */
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    /* ----------------------------
       ROLE-BASED FETCH
    ---------------------------- */
    let users;

    if (user.role === "superAdmin" || user.role === "admin") {
      // Full access
      users = await Admin.find();
    } 
    else if (user.role === "franchiseAdmin") {
      // Franchise ke sab users
      users = await Admin.find({
        $or: [
          { franchiseId: user.franchiseId },
          { managerId: user.id },        // LPO created users
        ],
      });
    } 
    else if (user.role === "manager" || user.role === "subadmin") {
      // Team + franchise users
      users = await Admin.find({
        $or: [
          { managerId: user.id },
          { franchiseId: user.franchiseId },
        ],
      });
    } 
    else {
      return NextResponse.json(
        { message: "No permission to view users" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, users });

  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
