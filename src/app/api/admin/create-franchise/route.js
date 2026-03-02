
// ye Next.js ka response object. || kaam Database ke bina Admin create nahi ho sakta. || agr hata  diya Admin.create() pe error aayega: || Mongoose not connected
import { NextResponse } from "next/server";

// ye Custom function jo MongoDB se connect karta hai. || kya kaam Database ke bina Admin create nahi ho sakta.|| agr hata diya Admin.create() pe error aayega:
import dbConnect from "@/lib/dbConnect";

// ye Admin ka Mongoose model. || kya kaam Admin collection me data insert/read karne ke liye. || agar hata diya Admin.findOne() aur Admin.create() kaam nahi karenge.
import Admin from "@/models/Admin";

// ye Password hashing library. || kya kaam Plain password ko secure hash me convert karta hai. || agar hata de to Password plain text me store hoga → security risk 
import bcrypt from "bcryptjs";

export async function POST(req) { // Password plain text me store hoga → security risk || Jab frontend POST request karega tab ye function chalega.
  try {
    await dbConnect(); // Database connection ensure karta hai. || hata de to DB query fail hogi.

    const { email, password, fullName } = await req.json(); // Frontend se bheja hua JSON data read karta hai.

    // Check if already exists
    // Check karta hai same email wala admin already exist karta hai ya nahi.
    const existing = await Admin.findOne({ email });
    if (existing) { // Agar email already DB me hai → new admin create mat karo.
      return NextResponse.json(
        { message: "Franchise admin already exists" },
        { status: 400 }
      ); // isko hata de to Same email se multiple admins create ho sakte hain.
    }

    // Hash password
    // bcrypt.hash(password, 10) || password → plain text || 10 → salt rounds || Salt rounds jitna zyada: || Security zyada || Speed kam
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create franchise admin
    const admin = await Admin.create({ // Ye DB me naya document create kar raha hai.
      email,
      fullName,
      password: hashedPassword,
      role: "franchiseAdmin", // Future me role-based access control ke liye. || Ye future ke liye ho sakta hai multi-franchise system me use ho.
    //   franchiseId: franchiseId || null,
    });

    return NextResponse.json({
      message: "Franchise Admin created successfully",
      adminId: admin._id,
    }); // Client ko success message + new admin ka ID bhej raha hai.

  } catch (err) { // Agar koi error aata hai to handle karega.
    console.error("Create franchise admin error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
