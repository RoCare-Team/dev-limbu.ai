import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import OTP from "@/models/Otp";
import Admin from "@/models/Admin";
import axios from "axios";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

// 🔴 TEST CONFIG
const TEST_PHONE = "7740847114";
const TEST_OTP = 1234;

export async function POST(req) {
  try {
    await dbConnect();
    const { phone, otp, name, email, refer_code } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    /* ======================================================
       STEP 1: SEND OTP
    ====================================================== */
    if (!otp) {
      const existingUser = await User.findOne({ phone });

      // 🔴 TEST OTP HANDLING
      let generatedOtp;
      if (phone === TEST_PHONE) {
        generatedOtp = TEST_OTP;
      } else {
        generatedOtp = Math.floor(1000 + Math.random() * 9000);

        const msg = `Dear Customer, Your OTP for Limbu AI profile verification is ${generatedOtp}. Regards, Limbu AI`;
        const tmpid = "1007299270481342940";
        const key = "kD4WSoAW";
        const from = "TLGCRO";
        const entityid = "1401519300000012435";
        const encodedMsg = encodeURIComponent(msg);

        const url = `https://api.savshka.co.in/api/sms?key=${key}&from=${from}&to=${phone}&body=${encodedMsg}&entityid=${entityid}&templateid=${tmpid}`;

        await axios.get(url).catch(() => {
          throw new Error("Failed to send OTP via Savshka");
        });
      }

      // Save OTP in DB
      await OTP.findOneAndUpdate(
        { phone },
        { otp: generatedOtp, createdAt: new Date() },
        { upsert: true }
      );

      return NextResponse.json({
        message:
          phone === TEST_PHONE
            ? "Test OTP generated successfully"
            : "OTP sent successfully",
        isExistingUser: !!existingUser,
        status: 200,
      });
    }

    /* ======================================================
       STEP 2: VERIFY OTP
    ====================================================== */
    const otpRecord = await OTP.findOne({ phone });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP not sent yet. Please request a new one." },
        { status: 400 }
      );
    }

    // 🔴 Skip expiry check for test number
    if (phone !== TEST_PHONE) {
      const isExpired =
        (Date.now() - otpRecord.createdAt.getTime()) / 1000 / 60 > 5;

      if (isExpired) {
        return NextResponse.json(
          { error: "OTP expired. Please request a new one." },
          { status: 400 }
        );
      }
    }

    if (otpRecord.otp.toString() !== otp.toString()) {
      return NextResponse.json(
        { error: "OTP not correct. Please try again." },
        { status: 400 }
      );
    }

    /* ======================================================
       STEP 3: CHECK USER
    ====================================================== */
    let user = await User.findOne({ phone });

    if (!user && (!name || !email)) {
      return NextResponse.json({
        step: "collect_details",
        message: "New user — please provide name and email",
      });
    }

    /* ======================================================
       STEP 4: REGISTER USER
    ====================================================== */
    if (!user) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "This email address is already registered. Please use another one.",
          },
          { status: 400 }
        );
      }

      // Round-robin Agent Assignment
      let assignedAgentId = null;
      try {
        const activeAgents = await Admin.find({
          role: "agent",
          isActive: true,
        }).sort({ createdAt: 1 });

        console.log("activeAgents",activeAgents);
        

        if (activeAgents.length > 0) {
          // Static index storage (in memory or DB)
          if (!global.agentIndex) global.agentIndex = 0;

          assignedAgentId =
            activeAgents[global.agentIndex % activeAgents.length]._id;

          global.agentIndex++;
        }
      } catch (err) {
        console.error("Agent assign error:", err);
      }
      user = await User.create({
        userId: `USR${Date.now()}`,
        fullName: name,
        email,
        phone,
        refer_code,
        wallet: 500,
        freeUsedCount: 2,
        assignedAgentId,
        igPrice: 0,
        fbPrice: 0,
        gmbPrice: 20,
        imgGeneratePrice: 80,
        subscription: {
          status: "inactive",
          plan: "Free",
          startDate: null,
          endDate: null,
        },
      });
    }

    /* ======================================================
       CLEANUP + TOKEN
    ====================================================== */
    await OTP.deleteOne({ phone });

    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        fullName: user.fullName,
        phone: user.phone,
        subscription: user.subscription || {},
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      user,
      redirectTo:
        user.subscription?.status === "active"
          ? "/dashboard"
          : "/subscription",
    });
  } catch (err) {
    console.error("OTP API Error:", err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return NextResponse.json(
        {
          error:
            "This email address is already registered. Please use another one.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error. Please try again later." },
      { status: 500 }
    );
  }
}


// action button