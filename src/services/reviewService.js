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
  async fetchAllReviews(userId, accId, locationIds) {
    const allReviews = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 10;

    do {
      pageCount++;
      const requestBody = {
        userId,
        accountId: accId,
        locationIds,
        ...(pageToken && { pageToken }),
      };

      const res = await fetch("/api/gmb/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

      const data = await res.json();
      if (data.success === false) throw new Error(data.error || "API_ERROR");

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
  async sendAIReply(userId, accId, locationId, reviewerName, starRatingMapVal, comment, reviewId) {
    const { businessName, businessCategory } = getBusinessInfo(locationId);

    const payload = {
      userId,
      accountId: accId,
      locationId,
      reviewId,
      reviewerName,
      starRating: starRatingMapVal,
      comment,
      businessCategory,
      businessName,
    };

    const res = await fetch("/api/gmb/review-ai-reply", {
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
  async sendManualReply(userId, accId, locationId, reviewId, replyText) {
    const res = await fetch("/api/gmb/review-manual-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        accountId: accId,
        locationId,
        reviewId,
        replyText,
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
