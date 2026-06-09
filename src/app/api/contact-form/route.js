import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";
import User from "@/models/User";

import nodemailer from "nodemailer";

// DB CONNECT
async function dbConnect() {
  if (mongoose.connection.readyState === 1) return;

  return mongoose.connect(mongooseConnectionUri(process.env.MONGODB_URI), {
    bufferCommands: false,
  });
}

// SCHEMA
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "contactForm",
  },
);

const Contact =
  mongoose.models.contactForm || mongoose.model("contactForm", ContactSchema);

// POST API
export async function POST(request) {
  try {
    await dbConnect();

    const { name, email, phone, message } = await request.json();

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    // SAVE CONTACT LEAD
    const saved = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    // CHECK EXISTING USER
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    // CREATE USER MANAGEMENT LEAD
    if (!existingUser) {
      await User.create({
        userId: `CF${Date.now()}`,

        fullName: name,
        email,
        phone,

        source: "signup",

        assignedAgentId: null,

        leadStage: "Active",
        leadStatus: "",

        wallet: 0,
        freeUsedCount: 0,

        subscription: {
          status: "inactive",
          plan: "Free",
          maxAccounts: 0,
        },
      });
    }

    // ==============================
// SEND CONTACT CONFIRMATION EMAIL
// ==============================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: "Limbu AI - We Received Your Message",

  html: `

<div style="background:#f4f4f5;padding:40px 20px;font-family:Arial,sans-serif;">

  <div style="
    max-width:600px;
    margin:auto;
    background:#ffffff;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.08);
  ">

<div style="
  background:#111827;
  padding:25px;
  text-align:center;
">
  <h1 style="
    margin:0;
    color:#facc15;
    font-size:28px;
  ">
    Limbu AI
  </h1>
</div>

<div style="padding:35px;">

  <h2 style="
    color:#111827;
    margin-top:0;
    margin-bottom:20px;
  ">
    Thank You For Contacting Limbu AI 🚀
  </h2>

  <p style="
    font-size:16px;
    color:#374151;
    line-height:1.8;
  ">
    Hello <b>${name}</b>,
  </p>

  <div style="
    background:#fffbeb;
    border-left:4px solid #facc15;
    padding:15px;
    border-radius:8px;
    margin:20px 0;
  ">
    <p style="
      margin:0;
      color:#374151;
      font-size:15px;
      line-height:1.7;
    ">
      ✅ We have successfully received your message.
    </p>
  </div>

  <p style="
    color:#4b5563;
    line-height:1.8;
  ">
    Our team will review your inquiry and get back to you shortly.
  </p>

  <p style="
    color:#4b5563;
    line-height:1.8;
  ">
    Thank you for reaching out to Limbu AI.
  </p>

  <div style="
    margin-top:30px;
    padding-top:20px;
    border-top:1px solid #e5e7eb;
  ">
    <p style="margin:0;color:#111827;">
      Best Regards,
    </p>

    <p style="
      margin:8px 0 0;
      font-weight:bold;
      color:#111827;
    ">
      Team Limbu AI
    </p>

    <p style="
      margin:5px 0 0;
      color:#facc15;
    ">
      info@limbu.ai
    </p>
  </div>

</div>


  </div>

</div>
`

});

    return NextResponse.json({
      success: true,
      message: "Message saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET API
export async function GET() {
  try {
    await dbConnect();

    const data = await Contact.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE API
export async function DELETE(req) {
  try {
    await dbConnect();

    const { userId } = await req.json();

    await Contact.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
