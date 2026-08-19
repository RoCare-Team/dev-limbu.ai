import jwt from "jsonwebtoken";
import User from "@/models/User";
import GmbUser from "@/models/GmbUser";
import Admin from "@/models/Admin";
import connectDB from "@/lib/dbConnect";
import { APP_JWT_SECRET } from "@/lib/appSession";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    // 1️⃣ ADMIN TOKEN CHECK
    //
    // Client `/api/admin/login` ka apna JWT bhejta hai ({id, role,
    // permissions}, JWT_SECRET se signed) — koi static ADMIN_MASTER_TOKEN
    // nahi. Pehle isi wajah se ye check hamesha fail hota aur COMMENTED OUT
    // pada tha — matlab koi bhi bina kisi valid admin session ke, sirf
    // userId jaan kar, kisi bhi user ko impersonate kar sakta tha.
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return Response.json({ error: "Admin token missing" }, { status: 401 });
    }

    const adminToken = authHeader.replace("Bearer ", "").trim();

    let decodedAdmin;
    try {
      decodedAdmin = jwt.verify(adminToken, APP_JWT_SECRET);
    } catch {
      return Response.json({ error: "Invalid admin token" }, { status: 401 });
    }

    if (!decodedAdmin?.id) {
      return Response.json({ error: "Invalid admin token" }, { status: 401 });
    }

    const admin = await Admin.findById(decodedAdmin.id).select("isActive").lean();
    if (!admin || admin.isActive === false) {
      return Response.json({ error: "Admin account not found or inactive" }, { status: 401 });
    }

    // 2️⃣ OTP USER
    const otpUser = await User.findOne({ userId }).lean();
    if (!otpUser) {
      return Response.json({ error: "OTP user not found" }, { status: 404 });
    }

    // 3️⃣ GMB USER (EMAIL MATCH)
    const gmbUser = await GmbUser.findOne({ email: otpUser.email }).lean();

    const googleData = gmbUser || null;
    const googleProjects = gmbUser?.projects || [];

    // 4️⃣ JWT TOKEN
    // Wahi secret jisse appSession verify karta hai — apna fallback rakhne se
    // JWT_SECRET-less environment par ye token banate hi invalid ho jata tha.
    const secret = APP_JWT_SECRET;

    const userToken = jwt.sign(
      {
        userId: otpUser.userId,
        email: otpUser.email,
        role: "user",
        impersonated: true,
      },
      secret,
      { expiresIn: "6h" }
    );

    // 5️⃣ FINAL MERGED RESPONSE
    return Response.json({
      success: true,
      message: "User impersonated successfully",
      token: userToken,
      user: {
        ...otpUser,
        gmbData: googleData,
        gmbProjects: googleProjects,
      },
    });
  } catch (err) {
    console.log("🚨 ERROR in login-as-user:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}