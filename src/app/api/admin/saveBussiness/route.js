import { NextResponse } from "next/server";
import mongoose from "mongoose";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined in environment`);
  return value;
}

const AdminBusinessSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  listings: { type: Array, required: true },
  timestamp: { type: Date, default: Date.now },
});

/** Dedicated connection */
let dashboardConn = null;

async function getDashboardConnection() {
  if (dashboardConn && dashboardConn.readyState === 1) {
    return dashboardConn;
  }

  const mongoUri = getRequiredEnv("MONGODB_URI");

  dashboardConn = mongoose.createConnection(mongoUri);

  await dashboardConn.asPromise();
  return dashboardConn;
}

async function getAdminBusinessModel() {
  const conn = await getDashboardConnection();
  return (
    conn.models.AdminBusiness ||
    conn.model("AdminBusiness", AdminBusinessSchema)
  );
}

//
// ✅ POST API (SAVE / UPDATE)
//
export async function POST(req) {
  try {
    const AdminBusiness = await getAdminBusinessModel();

    const body = await req.json();
    const { userEmail, listings } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(listings)) {
      return NextResponse.json(
        { error: "Listings must be an array" },
        { status: 400 }
      );
    }

    const updatedBusiness = await AdminBusiness.findOneAndUpdate(
      { userEmail: userEmail.toLowerCase() },
      {
        userEmail: userEmail.toLowerCase(),
        listings,
        timestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      listings: updatedBusiness.listings,
    });
  } catch (err) {
    console.error("Save listings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//
// ✅ GET API (FETCH LISTINGS)
//
export async function GET(req) {
  try {
    const AdminBusiness = await getAdminBusinessModel();

    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail");

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail is required in query" },
        { status: 400 }
      );
    }

    const business = await AdminBusiness.findOne({
      userEmail: userEmail.toLowerCase(),
    });

    if (!business) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listings: business.listings,
    });
  } catch (err) {
    console.error("Get listings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}