/**
 * Server-only: fetch all GBP locations for a Google access token (same shape as dashboard).
 */

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
    if (data.locations?.length)
      allLocations = [...allLocations, ...data.locations];
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

export async function fetchAllUserGmbListings(accessToken) {
  const accountsData = await fetchGMBAccounts(accessToken);
  if (!accountsData.length) return [];

  const listingsPromises = accountsData.map(async (account) => {
    const accountId = account.name.replace("accounts/", "");
    const accountName = account.accountName;
    try {
      const locations = await fetchAllLocationsByAccount(accessToken, accountId);
      if (!locations?.length) return [];
      return Promise.all(
        locations.map(async (loc) => {
          const vomStatus = await checkVoiceOfMerchant(accessToken, loc.name);
          const logoUrl = await fetchLocationLogo(
            accessToken,
            `accounts/${accountId}/${loc.name}`
          );
          return {
            ...loc,
            accountId,
            accountName: accountName || account.name,
            hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
            hasBusinessAuthority: vomStatus.hasBusinessAuthority,
            logoUrl,
            // `metadata` readMask me pehle se hai, par ye do fields itni baar
            // chahiye hote hain ki top level par expose kar dete hain —
            // har caller ko `metadata?.placeId` likhna na pade.
            placeId: loc.metadata?.placeId || "",
            mapsUri: loc.metadata?.mapsUri || "",
            newReviewUri: loc.metadata?.newReviewUri || "",
          };
        })
      );
    } catch (err) {
      console.error(`gmb listings account ${accountId}:`, err);
      return [];
    }
  });

  return (await Promise.all(listingsPromises)).flat();
}
