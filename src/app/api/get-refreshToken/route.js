import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const DB_NAME = "gmb_dashboard";
const COLLECTION = "users";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

let clientPromise;

/* ================= SAFE ENV ================= */
function getEnv(name, required = true) {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`${name} not defined`);
  }
  return value || "";
}

/* ================= MONGO ================= */
function getMongoClientPromise() {
  if (!clientPromise) {
    const mongoUri = getEnv("MONGODB_URI");
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

/* ================= AUTH CODE → REFRESH TOKEN ================= */
async function exchangeAuthCode(authCode) {
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI", false);

  if (!redirectUri) {
    throw new Error(
      "GOOGLE_REDIRECT_URI missing. Please add it in .env"
    );
  }

  const params = new URLSearchParams({
    client_id: getEnv("GOOGLE_CLIENT_ID"),
    client_secret: getEnv("GOOGLE_CLIENT_SECRET"),
    code: authCode,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Google token exchange failed"
    );
  }

  // ⚠️ IMPORTANT: Google kabhi refresh token nahi deta agar pehle connect ho chuka hai
  if (!data.refresh_token) {
    throw new Error(
      "No refresh token returned. Revoke access & try again OR use prompt=consent"
    );
  }

  return data.refresh_token;
}

/* ================= MAIN API ================= */
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, authCode } = body || {};

    if (!email) {
      return NextResponse.json(
        { success: false, error: "email is required" },
        { status: 400 }
      );
    }

    /* ================= DB CONNECT ================= */
    const mongoClient = await getMongoClientPromise();
    const db = mongoClient.db(DB_NAME);
    const usersCol = db.collection(COLLECTION);

    /* ================= FIND USER ================= */
    const user = await usersCol.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });

    /* ================= CASE 1: TOKEN ALREADY EXISTS ================= */
    if (user?.projects?.length > 0) {
      const project = user.projects[user.projects.length - 1];

      if (project?.refreshToken) {
        return NextResponse.json({
          success: true,
          email: user.email,
          refreshToken: project.refreshToken,
          source: "db",
        });
      }
    }

    /* ================= CASE 2: FIRST TIME ================= */
    if (!authCode) {
      return NextResponse.json(
        {
          success: false,
          error: "authCode required for first-time Google connection",
        },
        { status: 400 }
      );
    }

    /* ================= EXCHANGE TOKEN ================= */
    const refreshToken = await exchangeAuthCode(authCode);

    const newProject = {
      refreshToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user) {
      await usersCol.insertOne({
        email: email.toLowerCase(),
        projects: [newProject],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
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
    });

  } catch (err) {
    console.error("❌ API Error:", err.message);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 400 }
    );
  }
}