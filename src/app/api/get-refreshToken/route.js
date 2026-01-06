import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "gmb_dashboard";
const COLLECTION = "users";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

let clientPromise;

if (!MONGO_URI) {
  throw new Error("MONGODB_URI not defined");
}

if (!clientPromise) {
  const client = new MongoClient(MONGO_URI);
  clientPromise = client.connect();
}

/**
 * 🔁 AUTH CODE → REFRESH TOKEN
 */
async function exchangeAuthCode(authCode) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    code: authCode,
    grant_type: "authorization_code",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI, // MUST MATCH FLUTTER
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error_description || "Google token exchange failed");
  }

  if (!data.refresh_token) {
    throw new Error(
      "Refresh token not returned. Google already connected earlier."
    );
  }

  return data.refresh_token;
}

export async function POST(req) {
  try {
    const { email, authCode } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    // 🔗 CONNECT DB
    const mongoClient = await clientPromise;
    const db = mongoClient.db(DB_NAME);
    const usersCol = db.collection(COLLECTION);

    // 🔍 FIND USER (CASE-INSENSITIVE EMAIL)
    const user = await usersCol.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });

    /**
     * ===============================
     * CASE 1️⃣ : USER EXISTS → RETURN DB TOKEN
     * ===============================
     */
    if (user?.projects?.length > 0) {
      const project = user.projects[0];

      if (project?.refreshToken) {
        return NextResponse.json({
          success: true,
          email: user.email,
          refreshToken: project.refreshToken,
          source: "db",
        });
      }
    }

    /**
     * ===============================
     * CASE 2️⃣ : FIRST TIME (FLUTTER)
     * ===============================
     */
    if (!authCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Google not connected. authCode required.",
        },
        { status: 400 }
      );
    }

    // 🔁 EXCHANGE AUTH CODE → REFRESH TOKEN
    const refreshToken = await exchangeAuthCode(authCode);

    const newProject = {
      refreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user) {
      // 🆕 NEW USER
      await usersCol.insertOne({
        email: email.toLowerCase(),
        projects: [newProject],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // 🔁 EXISTING USER (NO TOKEN BEFORE)
      await usersCol.updateOne(
        { _id: user._id },
        {
          $push: { projects: newProject },
          $set: { updatedAt: new Date() },
        }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      refreshToken,
      source: "google-auth-code",
      message: "Google connected successfully",
    });

  } catch (err) {
    console.error("❌ GetRefreshToken API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
