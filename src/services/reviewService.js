const BASE_URL = "https://review.limbutech.in";

/**
 * Helper to get locationDetails from localStorage and extract business info.
 */
function getBusinessInfo(locationId) {
  try {
    const raw = localStorage.getItem("locationDetails");
    if (!raw) return {};
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const locations = Array.isArray(parsed) ? parsed : [parsed];

    const matched = locations.find((loc) => loc.locationId === locationId);

    if (!matched) {
      console.warn(`[getBusinessInfo] No location matched for locationId: "${locationId}". Available IDs:`, locations.map((l) => l.locationId));
      throw new Error(`LOCATION_NOT_MATCHED: No location found for locationId "${locationId}"`);
    }

    console.log(`[getBusinessInfo] Matched location for "${locationId}":`, matched);

    const businessCategory = matched?.categories?.primaryCategory?.displayName || matched?.title || null;
    const businessName = matched?.title || null;

    if (!businessCategory) {
      console.error(`[getBusinessInfo] Neither "primaryCategory.displayName" nor "title" found for locationId: "${locationId}"`, matched);
      throw new Error(`BUSINESS_CATEGORY_MISSING: No category or title found for locationId "${locationId}"`);
    }

    if (!businessName) {
      console.error(`[getBusinessInfo] "title" not found for locationId: "${locationId}"`, matched);
      throw new Error(`BUSINESS_NAME_MISSING: No title found for locationId "${locationId}"`);
    }

    return { businessName, businessCategory };
  } catch (err) {
    console.error("[getBusinessInfo] Error:", err.message);
    throw err; // re-throw so sendAIReply also fails loudly
  }
}

export const reviewService = {
  /**
   * Fetches all paginated reviews for given location IDs.
   * POST https://review.limbutech.in/fetch-reviews
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

      if (!res.ok) {
        throw new Error(`API_ERROR_${res.status}`);
      }

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
   * POST https://review.limbutech.in/reply-review
   *
   * - Business_Name: pulled from locationDetails.title in localStorage
   * - Business_Category: pulled from locationDetails.categories.primaryCategory.displayName
   * - Business_Language: always "English"
   */
  async sendAIReply(accessToken, accId, locationId, reviewerName, starRatingMapVal, comment, reviewId) {
    const { businessName, businessCategory } = getBusinessInfo();

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

    return res.json();
  },

  /**
   * Sends a manual reply to a specific review.
   * POST https://review.limbutech.in/manual-reply
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

    if (!res.ok) {
      throw new Error(`API_ERROR_${res.status}`);
    }

    return res.json();
  },

  /**
   * Toggles the auto-reply configuration.
   */
  async toggleAutoReply(userId, refreshToken, locations, isAuto) {
    const res = await fetch("/api/saveAutoReply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        refreshToken,
        locations,
        autoReply: isAuto,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save settings");
    }

    return res;
  },
};