
// next.js ka rsponse object api se JSON RESPONCE BHEJNE ke liye use hota he agr isko hata de to API response nahi bhej paoge
import { NextResponse } from "next/server";

// Database connect karne ka function Mongodb  aur kaam iska Mongodb se connection establish karta te agr hata diya database query error dega "not connected"
import dbConnect from "@/lib/dbConnect";

// ye mongoose models he user  user data ke liye
import User from "@/models/User";

// OTP store karne ke liye 
import OTP from "@/models/Otp";

// admin agents ke liye agr ye hata diye to db se data read/write nahi kar paoge
import Admin from "@/models/Admin";

// ye external SMS API ko call karnne ke liye agr ye hata diya to OTP SMS nahi bhej paoge
import axios from "axios";

// login ke bad token generate karta he agr ye remove kar diya to Authentication toot jayega 
import jwt from "jsonwebtoken";

// ye custom schema banane ke liye (settingschema)
import mongoose from "mongoose";

// ye token sighn karne ka secret key || important prodution me kabhi hardcoded secret nahi rakhte agr same secret sabko pata ho koi bhi fake token bana sakta he 
const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";



// 🔴 TEST CONFIG testing ke liye fixed otp 
const TEST_PHONE = "7740847114";
const TEST_OTP = 1234;

// Define Setting Schema for Round Robin
const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
}); // database me counter store karne ke liye 

// important he ye check karta he agar model already bana hua he use karo warna naya model create karo agr ye condition na lagaya next.js reaload mein error aayega 
const Setting = mongoose.models.settings || mongoose.model("settings", SettingSchema);

export async function POST(req) { // ye API ka post handler he 
  try {
    await dbConnect(); // har reauest pe DB connect ensure karta hai
    const { phone, otp, name, email, referCode } = await req.json(); // ye fronted se data read karta he
    if (!phone) { // agr otp nahi aya matlab user OTP request kar raha he 
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    /* ======================================================
       STEP 1: SEND OTP
    ====================================================== */
    if (!otp) {
      const existingUser = await User.findOne({ phone }); // check karta he user pehle se he ya nahi 

      // 🔴 TEST OTP HANDLING
      let generatedOtp;
      if (phone === TEST_PHONE) {
        generatedOtp = TEST_OTP;
      } else {
        generatedOtp = Math.floor(1000 + Math.random() * 9000); // 4 digit otp bana raha he 

        const msg = `Dear Customer, Your OTP for Limbu AI profile verification is ${generatedOtp}. Regards, Limbu AI`;
        const tmpid = "1007299270481342940";
        const key = "kD4WSoAW";
        const from = "TLGCRO";
        const entityid = "1401519300000012435";
        const encodedMsg = encodeURIComponent(msg);

        const url = `https://api.savshka.co.in/api/sms?key=${key}&from=${from}&to=${phone}&body=${encodedMsg}&entityid=${entityid}&templateid=${tmpid}`;

        await axios.get(url).catch(() => { // ye Externl SMS server ko call karta he 
          throw new Error("Failed to send OTP via Savshka");
        });
      }

      // Save OTP in DB
      await OTP.findOneAndUpdate(
        { phone },
        { otp: generatedOtp, createdAt: new Date() },
        { upsert: true }
      ); // important agar phone already exist karta he update karega agr nahi karta  naya record banayega

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
    const otpRecord = await OTP.findOne({ phone }); // DB se OTP nikaal raha he 

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP not sent yet. Please request a new one." },
        { status: 400 }
      );
    }

    // 🔴 Skip expiry check for test number
    if (phone !== TEST_PHONE) {
      const isExpired =
        (Date.now() - otpRecord.createdAt.getTime()) / 1000 / 60 > 5;  // ye check karta he hai 5minute se jayada ho gaye ya nahi 

      if (isExpired) {
        return NextResponse.json(
          { error: "OTP expired. Please request a new one." },
          { status: 400 }
        );
      }
    }

    if (otpRecord.otp.toString() !== otp.toString()) { // kyuntoString kabhi number kabhi string ata he mismatch avoid karne ke liye
      return NextResponse.json(
        { error: "OTP not correct. Please try again." },
        { status: 400 }
      );
    }

    /* ======================================================
       STEP 3: CHECK USER
    ====================================================== */
    let user = await User.findOne({ phone }); // ye user allreday registerd he ya nahi 

    if (!user && (!name || !email)) { // ye agr new user hai aur name/email nahi diya details mango
      return NextResponse.json({
        step: "collect_details",
        message: "New user — please provide name and email",
      });
    }

    /* ======================================================
       STEP 4: REGISTER USER
    ====================================================== */
    if (!user) {
      const existingEmail = await User.findOne({ email }); //  ye duplicat email allow nahi karta 
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
        }).sort({ createdAt: 1 }); // active agent nikal raha he 
        console.log("activeAgents", activeAgents);

        if (activeAgents.length > 0) {
          // DB based Round Robin;
          let rrDoc = await Setting.findOne({ key: "agentLeadRR" }); // ye Database se counter nikal raha hai
          if (!rrDoc) {
            rrDoc = await Setting.create({ key: "agentLeadRR", value: 0 });
          }

          let rrValue = parseInt(rrDoc.value, 10);
          if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0;

          assignedAgentId = activeAgents[rrValue % activeAgents.length]._id; // ye important line he agent = index counter % total agents isse leads equal distribute hoti hai

          await Setting.updateOne({ key: "agentLeadRR" }, { $inc: { value: 1 } }); // ye counter +1 kar raha he 
        }
      } catch (err) {
        console.error("Agent assign error:", err);
      }
      user = await User.create({  // ye new user database me save ho raha he 
        userId: `USR${Date.now()}`,
        fullName: name,
        email,
        phone,
        referCode,
        wallet: 500,
        freeUsedCount: 2, // ye user ko signup bonus mil raha he 
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
    await OTP.deleteOne({ phone }); // ye OTP verify hone ke baad delete kar diya kyunki security reason he 

    const token = jwt.sign( // ye token bana raha he 
      {
        id: user._id,
        userId: user.userId,
        fullName: user.fullName,
        phone: user.phone,
        subscription: user.subscription || {},
      },
      JWT_SECRET,
      { expiresIn: "7d" } // ye 7 din baad expire ho jayega || agr expire nahi lagaya to  token lifetime infinete ho jayega ye unsafe he
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      user,
      redirectTo:
        user.subscription?.status === "active" // agr subscription active dashbord nahi subscription page
          ? "/dashboard"
          : "/subscription",
    });
  } catch (err) { // error handle karta he
    console.error("OTP API Error:", err);

    if (err.code === 11000 && err.keyPattern?.email) {  // ye Mongodb duplicate key error handle karta he 
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