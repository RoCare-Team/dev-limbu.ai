import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const DB_NAME = "gmb_dashboard";
const COLLECTION = "users";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

let clientPromise;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined`);
  return value;
}

function getMongoClientPromise() {
  if (!clientPromise) {
    const mongoUri = getRequiredEnv("MONGODB_URI");
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * 🔁 AUTH CODE → REFRESH TOKEN
 */
async function exchangeAuthCode(authCode) {
  const params = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    code: authCode,
    grant_type: "authorization_code",
    redirect_uri: getRequiredEnv("GOOGLE_REDIRECT_URI"), // MUST MATCH FLUTTER
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
    const mongoClient = await getMongoClientPromise();
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
      const project = user.projects[user.projects.length - 1]; // 👈 LAST PROJECT

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
