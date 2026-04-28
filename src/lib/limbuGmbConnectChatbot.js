/**
 * Standard contract for chatbot / n8n after Google Business connect flow.
 * @typedef {"success" | "not_found"} GmbConnectChatbotStatus
 */

function categoryLabels(categories) {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => (c && (c.displayName || c.name || c.categoryId)) || "")
    .filter(Boolean);
}

/**
 * Rich location rows for `locationsData` (from raw GMB API listing objects).
 * @param {unknown[]} listings
 */
export function buildLocationsDataFromGmbListings(listings) {
  const arr = Array.isArray(listings) ? listings : [];
  return arr.map((l) => {
    const lines    = (l?.storefrontAddress?.addressLines || []).filter(Boolean);
    const locality = l?.storefrontAddress?.locality || "";
    const region   = l?.storefrontAddress?.administrativeArea || "";
    const postal   = l?.storefrontAddress?.postalCode || "";
    const tail     = [locality, region, postal].filter(Boolean).join(", ");
    const address  = [...lines, tail].filter(Boolean).join(", ") || "";
    return {
      title:                (l?.title && String(l.title).trim()) || "Business",
      verified:             l?.hasVoiceOfMerchant === true,
      locality,                         // storefrontAddress.locality  e.g. "Ahmedabad"
      addressLine:          lines.join(", "),  // street lines only e.g. "1st Floor, Shop No.02..."
      address,
      locationResourceName: typeof l?.name === "string" ? l.name : "",
      websiteUri:           l?.websiteUri || "",
      accountId:            l?.accountId || "",
      primaryPhone:         l?.phoneNumbers?.primaryPhone || "",
      categories:           categoryLabels(l?.categories),
    };
  });
}

/**
 * Map stored `businesses` subdocs (from Mongo) into the same `locationsData` shape.
 * @param {unknown[]} businesses
 */
export function buildLocationsDataFromStoredBusinesses(businesses) {
  const arr = Array.isArray(businesses) ? businesses : [];
  return arr.map((b) => ({
    title: b?.title || "Business",
    verified: b?.verified === true,
    address: b?.address || "",
    locationResourceName: b?.locationResourceName || "",
    websiteUri: b?.websiteUri || "",
    accountId: b?.accountId || "",
    primaryPhone: b?.primaryPhone || "",
    categories: Array.isArray(b?.categories) ? b.categories : [],
  }));
}

/**
 * Primary payload for webhook + API (exact keys chatbot expects).
 * @param {GmbConnectChatbotStatus} status
 * @param {string} message
 * @param {unknown[]} locationsData
 * @param {string} userChatId
 */
export function buildChatbotConnectPayload(status, message, locationsData, userChatId) {
  return {
    status,
    message,
    locationsData: Array.isArray(locationsData) ? locationsData : [],
    user_id: userChatId,
  };
}

/**
 * From raw GMB listings array (after sync / from AdminBusiness doc).
 */
export function chatbotPayloadFromGmbListings(listings, userChatId) {
  const list = Array.isArray(listings) ? listings : [];
  const locationsData = buildLocationsDataFromGmbListings(list);
  if (list.length === 0) {
    return buildChatbotConnectPayload(
      "not_found",
      "No business locations found for this account",
      [],
      userChatId
    );
  }
  return buildChatbotConnectPayload(
    "success",
    "Business connected successfully",
    locationsData,
    userChatId
  );
}

/**
 * From Mongo `LimbuChatBusinessLink` lean doc (or null if never registered).
 */
export function chatbotPayloadFromLinkRow(row, userChatId) {
  if (!row) {
    return buildChatbotConnectPayload(
      "not_found",
      "Connection not completed yet. Open the connect-google-business link from chat, sign in with Google, and tap Continue.",
      [],
      userChatId
    );
  }
  const locationsData = buildLocationsDataFromStoredBusinesses(row.businesses);
  if (!row.connected || locationsData.length === 0) {
    return buildChatbotConnectPayload(
      "not_found",
      "No business locations found for this account",
      [],
      userChatId
    );
  }
  return buildChatbotConnectPayload(
    "success",
    "Business connected successfully",
    locationsData,
    userChatId
  );
}

/**
 * Fire-and-forget webhook with one retry on failure.
 * @param {string} url
 * @param {Record<string, string>} headers
 * @param {object} body
 */
export async function postJsonWithRetry(url, headers, body) {
  const payload = JSON.stringify(body);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
        cache: "no-store",
      });
      if (res.ok) return { ok: true, status: res.status };
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return { ok: false, status: res.status };
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return { ok: false, status: 0 };
    }
  }
  return { ok: false, status: 0 };
}
