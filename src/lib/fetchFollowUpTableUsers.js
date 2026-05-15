/**
 * Load full user rows for follow-up buckets (agent table is paginated; IDs come from follow-up-stats).
 */
/** Chunked GET /api/users?byUserIds= for agent follow-up table rows. */
export async function fetchFollowUpTableUsersByIds(
  adminEmail,
  uniqueIds,
  conversationStage = "All",
) {
  if (!adminEmail || !uniqueIds.length) return [];
  const CHUNK = 35;
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += CHUNK) {
    chunks.push(uniqueIds.slice(i, i + CHUNK));
  }
  const results = await Promise.all(
    chunks.map((chunk) => {
      const params = new URLSearchParams({
        email: adminEmail,
        byUserIds: chunk.join(","),
      });

      if (conversationStage !== "All") {
        params.set("conversationStage", conversationStage);
      }

      return fetch(`/api/users?${params.toString()}`).then((r) => r.json());
    }),
  );
  const merged = [];
  const seen = new Set();
  for (const data of results) {
    if (data.success && Array.isArray(data.users)) {
      for (const u of data.users) {
        const id = String(u.userId);
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(u);
        }
      }
    }
  }
  const order = new Map(uniqueIds.map((id, i) => [id, i]));
  merged.sort(
    (a, b) =>
      (order.has(String(a.userId)) ? order.get(String(a.userId)) : 9999) -
      (order.has(String(b.userId)) ? order.get(String(b.userId)) : 9999),
  );
  return merged;
}
