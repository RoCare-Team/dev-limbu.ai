/**
 * Server-only: fetch all GBP locations for a Google access token (same shape as dashboard).
 *
 * Used by the connect screen (/api/gmb/my-locations, /api/gmb/sync-and-save) and
 * the dashboard (/api/gmb/dashboard-live), so every location the Google login can
 * reach — across its personal account and every location group — must come back.
 */
import {
  GmbScopeInsufficientError,
  isScopeInsufficientResponse,
} from "@/lib/gmbSession";

const BUSINESS_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const LOCATION_READ_MASK =
  "name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata";

// Pehle saare accounts ki locations aur har location ke 2 enrichment calls ek saath
// jaate the. Bahut saare location groups wale login par Google 429 deta tha, aur
// fail hua account chupchaap [] ban jata — us group ki saari locations gayab.
const ACCOUNT_CONCURRENCY = 4;
const ENRICH_CONCURRENCY = 12;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET with retry on rate limits / transient Google errors (honours Retry-After). */
async function googleGet(url, accessToken, { retries = 4 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!RETRYABLE_STATUS.has(res.status) || attempt >= retries) return res;

    const retryAfterSec = Number(res.headers.get("retry-after"));
    const backoff =
      Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? retryAfterSec * 1000
        : 500 * 2 ** attempt + Math.floor(Math.random() * 250);
    await sleep(Math.min(backoff, 8000));
  }
}

/** Promise.all with at most `limit` tasks in flight; keeps input order. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Every account the login can reach: its personal account plus each location group.
 * Google returns at most 20 accounts per page — the old code read only the first page,
 * so logins with more than 20 groups silently lost every location in groups 21+.
 */
async function fetchGMBAccounts(accessToken) {
  const accounts = [];
  let pageToken = null;
  do {
    let url = `${BUSINESS_INFO_BASE}/accounts?pageSize=20`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    const res = await googleGet(url, accessToken);
    if (!res.ok) {
      const errText = await res.text();
      // Token zinda hai par usme business.manage scope nahi. Ye sirf reconnect se
      // theek hota hai — user ko raw Google JSON dikhane ka koi matlab nahi,
      // isliye typed error taaki UI seedha "Reconnect" flow dikhaye.
      if (isScopeInsufficientResponse(res.status, errText)) {
        throw new GmbScopeInsufficientError();
      }
      throw new Error(`accounts ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (Array.isArray(data.accounts)) accounts.push(...data.accounts);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return accounts;
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  const allLocations = [];
  let pageToken = null;
  do {
    let url = `${BUSINESS_INFO_BASE}/accounts/${accountId}/locations?readMask=${LOCATION_READ_MASK}&pageSize=100`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    const res = await googleGet(url, accessToken);
    if (!res.ok) {
      throw new Error(`locations ${accountId}: ${res.status}`);
    }
    const data = await res.json();
    if (data.locations?.length) allLocations.push(...data.locations);
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return allLocations;
}

async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const res = await googleGet(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
      accessToken,
      { retries: 2 }
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
    const res = await googleGet(
      `https://mybusiness.googleapis.com/v4/${locationName}/media`,
      accessToken,
      { retries: 2 }
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

  const failedAccounts = [];
  const perAccount = await mapWithConcurrency(
    accountsData,
    ACCOUNT_CONCURRENCY,
    async (account) => {
      const accountId = account.name.replace("accounts/", "");
      try {
        const locations = await fetchAllLocationsByAccount(accessToken, accountId);
        return locations.map((loc) => ({
          loc,
          accountId,
          accountName: account.accountName || account.name,
        }));
      } catch (err) {
        failedAccounts.push(`${account.accountName || accountId} (${err.message})`);
        return [];
      }
    }
  );

  // A location reachable both directly and through a location group is listed under
  // each account — keep it once.
  const seen = new Set();
  const uniqueEntries = [];
  for (const entry of perAccount.flat()) {
    const key = entry.loc?.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueEntries.push(entry);
  }

  const listings = await mapWithConcurrency(
    uniqueEntries,
    ENRICH_CONCURRENCY,
    async ({ loc, accountId, accountName }) => {
      const [vomStatus, logoUrl] = await Promise.all([
        checkVoiceOfMerchant(accessToken, loc.name),
        fetchLocationLogo(accessToken, `accounts/${accountId}/${loc.name}`),
      ]);
      return {
        ...loc,
        accountId,
        accountName,
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
    }
  );

  console.log(
    `[gmb listings] accounts=${accountsData.length} locations=${listings.length}` +
      (failedAccounts.length
        ? ` — FAILED after retries: ${failedAccounts.join("; ")}`
        : "")
  );

  return listings;
}
