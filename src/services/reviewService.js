const BASE_URL = "https://review.limbutech.in";

/**
 * Helper to get locationDetails from localStorage and extract business info.
 */
function getBusinessInfo() {
  try {
    const raw = localStorage.getItem("locationDetails");
    if (!raw) return {};
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const location = Array.isArray(parsed) ? parsed[0] : parsed;
    return {
      businessName: location?.title || "",
      businessCategory: location?.categories?.primaryCategory?.displayName || "Water Purification Company",
    };
  } catch {
    return {
      businessName: "",
      businessCategory: "Water Purification Company",
    };
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