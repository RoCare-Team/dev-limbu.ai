// ye Next.js ka response helper.|| Redirect ya JSON response bhejne ke liye.|| Agar ye hata dein → NextResponse.redirect() error dega.
import { NextResponse } from "next/server";

//  Ye GET request handler hai. || Jab user browser me hit kare:
export async function GET(req) {
  const { searchParams } = new URL(req.url); // ye Request ke URL ko parse kar raha hai.
  const userId = searchParams.get("userId"); // ye URL se userId nikaal raha hai.

  if (!userId) { // ye Check kar raha hai ki userId mila ya nahi.
    return NextResponse.json({ error: "userId required" }, { status: 400 }); // Bad request. Agar userId nahi bheja to error return karega.
  }

  const params = new URLSearchParams({ // ye Query string parameters banane ka object. || Ye automatically encode karta hai URL ko.
    client_id: process.env.GOOGLE_CLIENT_ID, // ye Ye batata hai kaunsi app login kar rahi hai. || Agar galat ID ho → Google error dega.
    redirect_uri: `${process.env.BASE_URL}/api/youtube/callback`, // ye Login ke baad Google user ko yaha bhejega.|| Agar mismatch ho → "Redirect URI mismatch" error.
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly",
    response_type: "code", // ye Hum Google se authorization code chahte hain.|| OAuth flow me pehle code milta hai, || phir us code se token milta hai.
    state: userId, // 🔥 Secure user mapping
    access_type: "offline", // For refresh token
    prompt: "consent", // To get refresh token
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  ); // ye  User ko Google login page par bhej raha hai.
}