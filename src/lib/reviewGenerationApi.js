const REVIEW_GENERATION_URL =
  "https://review-generation.limbutech.in/generate-reviews";
const REVIEW_GENERATION_TOKEN =
  "sk_8FvK92mQxL7pN4RwZc5TgH1yUa6BdE3JnX9sPmQ2VkL8";

/**
 * Calls the external review-generation webhook.
 *
 * Response shapes handled:
 *  - with keywords:    { reviews: { "RO repair": "...", "AC service": "..." } }
 *  - without keywords: { reviews: { "review_1": "...", "review_2": "..." } }
 *
 * @param {Object} args
 * @param {string} args.businessName
 * @param {string[]} [args.keywords]
 * @returns {Promise<{ businessName: string, count: number, reviews: {key: string, text: string}[] }>}
 */
export async function generateReviews({ businessName, keywords = [] }) {
  const res = await fetch(REVIEW_GENERATION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${REVIEW_GENERATION_TOKEN}`,
    },
    body: JSON.stringify({
      business_name: businessName || "",
      keywords: Array.isArray(keywords) ? keywords : [],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Review generation failed (${res.status}): ${detail || res.statusText}`
    );
  }

  const data = await res.json();
  const reviewsObj = data?.reviews || {};
  const reviews = Object.entries(reviewsObj)
    .map(([key, text]) => ({ key, text: String(text || "").trim() }))
    .filter((r) => r.key && r.text);

  return {
    businessName: data?.business_name || businessName || "",
    count: typeof data?.count === "number" ? data.count : reviews.length,
    reviews,
  };
}
