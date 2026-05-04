import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";
import { getBaseUrl } from "@/utils/urlHelper";

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state"); 
    
    const baseUrl = getBaseUrl(req);

    if (!code || !userId) {
      return NextResponse.redirect(`${baseUrl}/dashboard?pinterest=missing_params`);
    }

    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/pinterest/callback`;

    // Pinterest requires Basic Auth header for token exchange
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 1️⃣ Exchange Authorization Code for Access Token
    const tokenRes = await axios.post(
      "https://api.pinterest.com/v5/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      { 
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${authHeader}`
        } 
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // 2️⃣ Fetch User Profile Data
    let profileData = {};
    try {
      const profileRes = await axios.get("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      profileData = profileRes.data || {};
    } catch (error) {
      console.error("Failed to fetch Pinterest profile:", error.response?.data || error.message);
      return NextResponse.redirect(`${baseUrl}/dashboard?pinterest=profile_error`);
    }

    // 3️⃣ Fetch User Boards
    let boardsList = [];
    try {
      const boardsRes = await axios.get("https://api.pinterest.com/v5/boards", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      boardsList = boardsRes.data.items || [];
    } catch (error) {
      console.error("Failed to fetch Pinterest boards:", error.response?.data || error.message);
    }

    // 4️⃣ Fetch Pins per Board & format the boards array
    const boardsWithPins = [];
    for (const board of boardsList) {
      let boardPins = [];
      try {
        const pinsRes = await axios.get(`https://api.pinterest.com/v5/boards/${board.id}/pins`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        boardPins = pinsRes.data.items || [];
      } catch (error) {
        console.error(`Failed to fetch pins for board ${board.id}:`, error.response?.data || error.message);
      }

      boardsWithPins.push({
        boardId: board.id,
        boardName: board.name,
        boardUrl: board.url,
        description: board.description,
        pins: boardPins
      });
    }

    // 5️⃣ Save/Update the entire Profile Document
    await PinterestProfile.findOneAndUpdate(
      { userId, pinterestUserId: profileData.account_type === 'BUSINESS' ? profileData.id : (profileData.username || profileData.id) },
      {
        userId,
        pinterestUserId: profileData.id,
        username: profileData.username,
        profileImage: profileData.profile_image,
        websiteUrl: profileData.website_url,
        accountType: profileData.account_type,
        boards: boardsWithPins, // Nested boards with their pins
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        platform: "pinterest",
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(`${baseUrl}/dashboard?pinterest=connected`);
  } catch (err) {
    console.error("PINTEREST CALLBACK ERROR:", err.response?.data || err.message);
    const baseUrl = getBaseUrl(req);
    return NextResponse.redirect(`${baseUrl}/dashboard?pinterest=error`);
  }
}
