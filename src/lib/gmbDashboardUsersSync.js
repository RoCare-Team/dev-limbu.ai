import { clientPromise } from "@/lib/mongodb";
import { resolveDashboardUserIdByPhone } from "@/lib/metaChatbotResolveUser";

/** Same database/collection as `auth.js` Google signIn callback. */
export const GMB_DASHBOARD_DB = "gmb_dashboard";
export const GMB_DASHBOARD_USERS_COLLECTION = "users";

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeProjectLists(...lists) {
  const byGid = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      if (p?.googleId) byGid.set(p.googleId, p);
    }
  }
  return [...byGid.values()];
}

/**
 * Mirror `auth.js` signIn `projects` shape after WhatsApp /connect-google-business "Continue".
 * Ensures a **single** `users` row: merges email-based (OAuth) + phone-based (USR) docs if both existed.
 * Sets `source: "chatbot"` and normalises `userId` to the OTP `USR…` id when phone resolves.
 */
export async function upsertChatbotGmbUserDashboardRow({
  phoneDigits,
  userEmail,
  userName,
  userImage,
  googleId,
  accessToken,
  refreshToken,
  /** When user reconnects with a new Google account for the same phone — only keep this session’s project. */
  replaceExistingConnection = false,
}) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email || !googleId) {
    console.warn("[gmbDashboardUsersSync] skip: missing email or googleId");
    return { ok: false, reason: "missing email or googleId" };
  }

  const client = await clientPromise;
  if (!client || typeof client.db !== "function") {
    console.error("[gmbDashboardUsersSync] Mongo client unavailable");
    return { ok: false, reason: "no client" };
  }

  const db = client.db(GMB_DASHBOARD_DB);
  const col = db.collection(GMB_DASHBOARD_USERS_COLLECTION);
  const now = new Date();

  let resolvedUserId = null;
  try {
    resolvedUserId = await resolveDashboardUserIdByPhone(phoneDigits || "");
  } catch (e) {
    console.warn("[gmbDashboardUsersSync] resolve user by phone:", e?.message);
  }

  const emailFilter = {
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") },
  };

  const byUsr = resolvedUserId ? await col.findOne({ userId: resolvedUserId }) : null;
  const byEmail = await col.findOne(emailFilter);

  let duplicateToDelete = null;
  let targetDoc = byUsr || byEmail;

  if (byUsr && byEmail && String(byUsr._id) !== String(byEmail._id)) {
    targetDoc = byUsr;
    duplicateToDelete = byEmail._id;
  }

  const combinedProjects = replaceExistingConnection
    ? []
    : mergeProjectLists(byUsr?.projects, byEmail?.projects);
  const prev = combinedProjects.find((p) => p.googleId === googleId);
  const mergedProject = {
    googleId,
    accessToken: accessToken || "",
    refreshToken: refreshToken ?? prev?.refreshToken ?? null,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  const projects = [
    ...combinedProjects.filter((p) => p.googleId !== googleId),
    mergedProject,
  ];

  const canonicalUserId =
    resolvedUserId || targetDoc?.userId || `GGL-${googleId}`;

  const commonSet = {
    email,
    name: userName || targetDoc?.name || "",
    fullName:
      userName || targetDoc?.fullName || targetDoc?.name || "",
    image: userImage ?? targetDoc?.image ?? "",
    userId: canonicalUserId,
    ...(phoneDigits ? { phone: phoneDigits } : {}),
    projects,
    source: "chatbot",
    updatedAt: now,
  };

  if (duplicateToDelete) {
    await col.updateOne({ _id: targetDoc._id }, { $set: commonSet });
    await col.deleteOne({ _id: duplicateToDelete });
    console.log(
      `[gmbDashboardUsersSync] deduped users _id=${targetDoc._id} removedDup=${duplicateToDelete}`
    );
    return { ok: true, deduped: true };
  }

  if (targetDoc) {
    const writeResult = await col.updateOne(
      { _id: targetDoc._id },
      { $set: commonSet }
    );
    if (!writeResult.acknowledged) {
      console.error("[gmbDashboardUsersSync] users write not acknowledged");
      return { ok: false, reason: "not acknowledged" };
    }
    console.log(`[gmbDashboardUsersSync] users OK _id=${targetDoc._id}`);
    return { ok: true };
  }

  const upsertFilter = resolvedUserId
    ? { userId: resolvedUserId }
    : emailFilter;

  const writeResult = await col.updateOne(
    upsertFilter,
    {
      $set: {
        ...commonSet,
        userId: canonicalUserId,
      },
      $setOnInsert: {
        userId: canonicalUserId,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  if (!writeResult.acknowledged) {
    console.error("[gmbDashboardUsersSync] users write not acknowledged");
    return { ok: false, reason: "not acknowledged" };
  }

  console.log(`[gmbDashboardUsersSync] users upsert OK filter=${JSON.stringify(upsertFilter)}`);
  return { ok: true };
}
