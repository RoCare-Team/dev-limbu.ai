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

      const res = await fetch(
        "https://n8n.srv968758.hstgr.cloud/webhook/b3f4dda4-aef1-4e87-a426-b503cee3612b",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );

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
   */
  async sendAIReply(accessToken, accId, locationId, reviewerName, starRatingMapVal, comment, reviewId) {
    const res = await fetch(
      "https://n8n.srv968758.hstgr.cloud/webhook/59634515-0550-4cb5-9031-0d82bc0a303d",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          acc_id: accId,
          locationIds: locationId,
          Reviewer_Name: reviewerName,
          Star_Rating: starRatingMapVal,
          Review_Content: comment,
          Review_ID: reviewId,
        }),
      },
    );

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
  }
};