const BASE_URL = "https://review.limbutech.in";

/**
 * Helper to get locationDetails from localStorage and extract business info.
 */
function getBusinessInfo(locationId) {
  try {
    if (!locationId) {
      throw new Error(`LOCATION_ID_MISSING: locationId is undefined or null`);
    }

    const raw = localStorage.getItem("locationDetails");
    if (!raw) throw new Error("LOCATION_NOT_FOUND: locationDetails not in localStorage");

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const locations = Array.isArray(parsed) ? parsed : [parsed];

    const matched = locations.find((loc) => loc.locationId === locationId);

    if (!matched) {
      console.warn(
        `[getBusinessInfo] No location matched for locationId: "${locationId}". Available IDs:`,
        locations.map((l) => l.locationId)
      );
      throw new Error(`LOCATION_NOT_MATCHED: No location found for locationId "${locationId}"`);
    }

    const businessCategory =
      matched?.categories?.primaryCategory?.displayName || matched?.title || null;
    const businessName = matched?.title || null;

    if (!businessCategory) {
      throw new Error(
        `BUSINESS_CATEGORY_MISSING: No category or title found for locationId "${locationId}"`
      );
    }

    if (!businessName) {
      throw new Error(
        `BUSINESS_NAME_MISSING: No title found for locationId "${locationId}"`
      );
    }

    console.log(
      `[getBusinessInfo] ✅ Matched — name: "${businessName}", category: "${businessCategory}"`
    );

    return { businessName, businessCategory };
  } catch (err) {
    console.error("[getBusinessInfo] Error:", err.message);
    throw err;
  }
}

export const reviewService = {
  /**
   * Fetches all paginated reviews for given location IDs.
   */
  async fetchAllReviews(accId, locationIds, accessToken) {
    const allReviews = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 10;

    do {
      pageCount++;
      const requestBody = {
        acc_id: accId,
        locationIds,
        access_token: accessToken,
        ...(pageToken && { pageToken }),
      };

      const res = await fetch(`${BASE_URL}/fetch-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

      let data;
      const responseText = await res.text();
      if (!responseText || responseText.trim() === "") {
        data = { reviews: [] };
      } else {
        data = JSON.parse(responseText);
      }

      if (data.reviews && Array.isArray(data.reviews)) {
        allReviews.push(...data.reviews);
        pageToken = data.nextPageToken || null;
      } else {
        pageToken = null;
      }

      if (pageCount >= maxPages) break;
    } while (pageToken);

    return allReviews;
  },

  /**
   * Generates and sends an AI reply to a specific review.
   */
  async sendAIReply(accessToken, accId, locationId, reviewerName, starRatingMapVal, comment, reviewId) {
    const { businessName, businessCategory } = getBusinessInfo(locationId);

    const payload = {
      acc_id: accId,
      access_token: accessToken,
      locationIds: locationId,
      Review_ID: reviewId,
      Reviewer_Name: reviewerName,
      Star_Rating: starRatingMapVal,
      Review_Content: comment,
      Business_Language: "English",
      ...(businessCategory && { Business_Category: businessCategory }),
      ...(businessName && { Business_Name: businessName }),
    };

    const res = await fetch(`${BASE_URL}/reply-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    return res.json();
  },

  /**
   * Sends a manual reply to a specific review.
   */
  async sendManualReply(accessToken, accId, locationId, reviewId, replyText) {
    const res = await fetch(`${BASE_URL}/manual-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acc_id: accId,
        access_token: accessToken,
        locationIds: locationId,
        Review_ID: reviewId,
        reply: replyText,
      }),
    });

    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    return res.json();
  },

  /**
   * Toggle autoReply for one connected GMB account.
   */
  async toggleAutoReply(userId, refreshToken, accountId, locations, autoReply) {
    const res = await fetch("/api/saveAutoReply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        refreshToken,
        accountId,
        locations,
        autoReply,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save settings");
    }

    return res.json();
  },

  /**
   * Fetch autoReply status for all connected GMB accounts of a user.
   */
  async getAutoReplySettings(userId, accountId = null) {
    const params = new URLSearchParams({ userId });
    if (accountId) params.append("accountId", accountId);

    const res = await fetch(`/api/saveAutoReply?${params.toString()}`);
    if (!res.ok) return { locations: [] };

    return res.json();
  },
};
