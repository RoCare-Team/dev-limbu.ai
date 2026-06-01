import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GoogleBusinessProfile from "@/models/GoogleBusinessProfile";
import { fetchAllUserGmbListings } from "@/lib/gmbUserListingsServer";

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  return response.data;
}

async function refreshProfile(profile) {
  if (!profile.refreshToken) return profile;

  const tokenExpired =
    !profile.tokenExpiresAt || new Date(profile.tokenExpiresAt).getTime() < Date.now() + 60000;

  let accessToken = profile.accessToken;
  let tokenExpiresAt = profile.tokenExpiresAt;

  if (tokenExpired) {
    const tokenData = await refreshAccessToken(profile.refreshToken);
    accessToken = tokenData.access_token;
    tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : tokenExpiresAt;
  }

  const listings = await fetchAllUserGmbListings(accessToken);

  return GoogleBusinessProfile.findByIdAndUpdate(
    profile._id,
    {
      $set: {
        accessToken,
        tokenExpiresAt,
        listings,
      },
    },
    { new: true },
  );
}

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const refresh = url.searchParams.get("refresh") !== "false";

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    const profiles = await GoogleBusinessProfile.find({ userId }).sort({
      updatedAt: -1,
    });

    const finalProfiles = refresh
      ? await Promise.all(
          profiles.map(async (profile) => {
            try {
              return await refreshProfile(profile);
            } catch (error) {
              console.error("GMB profile refresh failed:", error.response?.data || error.message);
              return profile;
            }
          }),
        )
      : profiles;

    const accounts = finalProfiles.map((profile) => ({
      userId: profile.userId,
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      listings: (profile.listings || []).map((loc) => ({
        ...loc,
        verified: loc.hasVoiceOfMerchant,
      })),
    }));

    return NextResponse.json({
      success: true,
      accounts,
      noAccountsFound: accounts.every((account) => account.listings.length === 0),
    });
  } catch (error) {
    console.error("Fetch GMB Pages Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
