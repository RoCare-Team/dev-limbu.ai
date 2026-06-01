import axios from "axios";
import GoogleBusinessProfile from "@/models/GoogleBusinessProfile";

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

function listingMatchesLocation(listing, locationId) {
  if (!locationId) return false;
  const name = String(listing?.name || "");
  return (
    name === `locations/${locationId}` ||
    name.endsWith(`/locations/${locationId}`) ||
    name.split("/").pop() === locationId ||
    listing?.locationId === locationId
  );
}

export async function getGoogleBusinessAccessToken({ userId, locationId }) {
  const profiles = await GoogleBusinessProfile.find({ userId }).sort({
    updatedAt: -1,
  });

  const profile =
    profiles.find((item) =>
      (item.listings || []).some((listing) =>
        listingMatchesLocation(listing, locationId),
      ),
    ) || profiles[0];

  if (!profile) {
    throw new Error("Google Business Profile is not connected");
  }

  let accessToken = profile.accessToken;
  let tokenExpiresAt = profile.tokenExpiresAt;
  const tokenExpired =
    !tokenExpiresAt || new Date(tokenExpiresAt).getTime() < Date.now() + 60000;

  if (tokenExpired) {
    if (!profile.refreshToken) {
      throw new Error("Google Business refresh token is missing");
    }

    const tokenData = await refreshAccessToken(profile.refreshToken);
    accessToken = tokenData.access_token;
    tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : tokenExpiresAt;

    await GoogleBusinessProfile.findByIdAndUpdate(profile._id, {
      $set: { accessToken, tokenExpiresAt },
    });
  }

  return accessToken;
}
