import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function fetchGMBAccounts(accessToken) {
  const res = await fetch(
    "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`accounts ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.accounts || [];
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  let allLocations = [];
  let pageToken = null;
  do {
    let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`locations ${accountId}: ${res.status}`);
    }
    const data = await res.json();
    if (data.locations?.length) allLocations = [...allLocations, ...data.locations];
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return allLocations;
}

async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const res = await fetch(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    if (!res.ok) {
      return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
    }
    return await res.json();
  } catch {
    return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
  }
}

async function fetchLocationLogo(accessToken, locationName) {
  try {
    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/media`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.mediaItems?.length) return null;
    const item =
      data.mediaItems.find((i) => i.locationAssociation?.category === "LOGO") ||
      data.mediaItems.find((i) => i.locationAssociation?.category === "PROFILE") ||
      data.mediaItems[0];
    return item?.thumbnailUrl || item?.googleUrl || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = session.accessToken;
    const userEmail = session.user.email.toLowerCase();

    const accountsData = await fetchGMBAccounts(token);
    if (!accountsData.length) {
      return NextResponse.json({
        success: true,
        count: 0,
        listings: [],
        message: "No Google Business accounts found for this login.",
      });
    }

    const listingsPromises = accountsData.map(async (account) => {
      const accountId = account.name.replace("accounts/", "");
      const accountName = account.accountName;
      try {
        const locations = await fetchAllLocationsByAccount(token, accountId);
        if (!locations?.length) return [];
        return Promise.all(
          locations.map(async (loc) => {
            const vomStatus = await checkVoiceOfMerchant(token, loc.name);
            const logoUrl = await fetchLocationLogo(
              token,
              `accounts/${accountId}/${loc.name}`
            );
            return {
              ...loc,
              accountId,
              accountName: accountName || account.name,
              hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
              hasBusinessAuthority: vomStatus.hasBusinessAuthority,
              logoUrl,
            };
          })
        );
      } catch (err) {
        console.error(`sync-and-save account ${accountId}:`, err);
        return [];
      }
    });

    const allListings = (await Promise.all(listingsPromises)).flat();

    const origin = new URL(request.url).origin;
    const saveRes = await fetch(`${origin}/api/admin/saveBussiness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, listings: allListings }),
    });
    const saveJson = await saveRes.json().catch(() => ({}));
    if (!saveRes.ok) {
      return NextResponse.json(
        { error: saveJson?.error || "Failed to save listings" },
        { status: saveRes.status >= 400 ? saveRes.status : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: allListings.length,
      listings: allListings,
    });
  } catch (error) {
    console.error("sync-and-save:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
