import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";

export const maxDuration = 300;

const GMB_PUBLISH_URL =
  process.env.GMB_PUBLISH_URL ||
  process.env.GMB_POST_API_URL ||
  "https://gmb-post.limbutech.in/gmb-post";

const GMB_API_SECRET =
  process.env.GMB_API_SECRET || "Xk9mP2qR8vLnJ4wZ7dF3yT6hQ1GMB";

const parseUpstreamResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const DEFAULT_WHEN_POSTED = [
  { platform: "gmb", posted: false, postedDate: null, postId: "", error: "" },
  {
    platform: "facebook",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "instagram",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "pinterest",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "linkedin",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
  {
    platform: "youtube",
    posted: false,
    postedDate: null,
    postId: "",
    error: "",
  },
];

const normalizeLocationId = (value) =>
  String(value || "").replace(/^locations\//, "");

const getLocationId = (location) =>
  location?.locationId ||
  location?.location_id ||
  location?.id ||
  normalizeLocationId(location?.name);

const getPostIdentifier = (payload) =>
  payload.postId ||
  payload.post_id ||
  payload.id ||
  payload._id ||
  payload.post?._id ||
  payload.post?.id ||
  "";

const getUserIdentifier = (payload) =>
  payload.userId || payload.user_id || payload.post?.userId || "";

const getResponseBody = (data) =>
  data?.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data
    : data || {};

const mergeWhenPosted = (currentWhenPosted, postedDate, postId = "") => {
  const map = new Map(
    DEFAULT_WHEN_POSTED.map((entry) => [entry.platform, { ...entry }]),
  );

  if (Array.isArray(currentWhenPosted)) {
    currentWhenPosted.forEach((entry) => {
      const raw = entry?.toObject ? entry.toObject() : entry;
      if (raw?.platform && map.has(raw.platform)) {
        map.set(raw.platform, { ...map.get(raw.platform), ...raw });
      }
    });
  } else if (currentWhenPosted && typeof currentWhenPosted === "object") {
    Object.entries(currentWhenPosted).forEach(([platform, value]) => {
      if (!map.has(platform)) return;
      if (value && typeof value === "object") {
        map.set(platform, { ...map.get(platform), ...value, platform });
      } else if (value === true || value === "posted" || value === "true") {
        map.set(platform, {
          ...map.get(platform),
          posted: true,
          postedDate: new Date(),
        });
      }
    });
  }

  map.set("gmb", {
    ...map.get("gmb"),
    platform: "gmb",
    posted: true,
    postedDate,
    postId,
    error: "",
  });

  return DEFAULT_WHEN_POSTED.map(({ platform }) => map.get(platform));
};

const mergePostedPlatform = (currentValue) => {
  const current = String(currentValue || "")
    .trim()
    .toLowerCase();
  if (!current || current === "gmb") return "gmb";
  if (current === "both") return "both";
  return "both";
};

const buildLocationUpdates = ({
  existingLocations = [],
  payloadLocations = [],
  successList = [],
  failList = [],
  postedDate,
}) => {
  if (!payloadLocations.length) return existingLocations;

  const successIds = new Set(
    successList.map((item) =>
      normalizeLocationId(item?.location_id || item?.locationId),
    ),
  );
  const failMap = new Map(
    failList.map((item) => [
      normalizeLocationId(item?.location_id || item?.locationId),
      item?.error || item?.message || "Failed to publish",
    ]),
  );
  const assumeAllSuccess = successList.length === 0 && failList.length === 0;

  const byId = new Map();

  existingLocations.forEach((location) => {
    const raw = location?.toObject ? location.toObject() : location;
    const id = normalizeLocationId(getLocationId(raw));
    if (id) byId.set(id, raw);
  });

  payloadLocations.forEach((location) => {
    const id = normalizeLocationId(getLocationId(location));
    if (!id) return;

    const wasPosted = assumeAllSuccess || successIds.has(id);
    const error = failMap.get(id) || "";
    const existing = byId.get(id) || {};

    byId.set(id, {
      ...existing,
      locationId: existing.locationId || id,
      accountId:
        location.accountId || location.account || existing.accountId || "",
      name:
        location.name ||
        location.title ||
        location.locationName ||
        existing.name ||
        "",
      address: location.address || existing.address || "",
      city: location.city || location.locality || existing.city || "",
      locality: location.locality || existing.locality || "",
      websiteUrl:
        location.websiteUrl || location.bookUrl || existing.websiteUrl || "",
      primaryPhone: location.primaryPhone || existing.primaryPhone || "",
      isPosted: wasPosted || existing.isPosted || false,
      error: wasPosted ? "" : error || existing.error || "",
      postedAt: wasPosted ? postedDate : existing.postedAt,
      apiResponse: wasPosted
        ? successList.find(
            (item) =>
              normalizeLocationId(item?.location_id || item?.locationId) === id,
          ) || existing.apiResponse
        : existing.apiResponse,
    });
  });

  return Array.from(byId.values());
};

const updatePostAfterPublish = async ({ payload, data, responseOk }) => {
  const postId = getPostIdentifier(payload);
  const userId = getUserIdentifier(payload);

  if (!postId || !userId) {
    return { skipped: true, reason: "postId/userId missing" };
  }

  const responseBody = getResponseBody(data);
  const successList = Array.isArray(responseBody.success)
    ? responseBody.success
    : [];
  const failList = Array.isArray(responseBody.fail) ? responseBody.fail : [];
  const payloadLocations = Array.isArray(payload.locationData)
    ? payload.locationData
    : [];
  const hasAnySuccess =
    successList.length > 0 ||
    (responseOk && payloadLocations.length > 0 && failList.length === 0);

  if (!responseOk || !hasAnySuccess) {
    return { skipped: true, reason: "publish was not successful" };
  }

  await dbConnect();

  const post = await Post.findOne({ _id: postId, userId });
  if (!post) {
    return { skipped: true, reason: "post not found" };
  }

  const postedDate = new Date();

  post.status = "posted";
  post.postedPlatform = mergePostedPlatform(post.postedPlatform);
  post.whenPosted = mergeWhenPosted(
    post.whenPosted,
    postedDate,
    successList
      .map((item) => item?.post_id || item?.postId || item?.id)
      .filter(Boolean)
      .join(","),
  );

  if (payloadLocations.length) {
    post.locations = buildLocationUpdates({
      existingLocations: post.locations || [],
      payloadLocations,
      successList,
      failList,
      postedDate,
    });
    post.markModified("locations");
  }

  const mediaKey = payload.video_url ? "video" : "image";
  post.mediaStatus = {
    ...(post.mediaStatus?.toObject
      ? post.mediaStatus.toObject()
      : post.mediaStatus || {}),
    [mediaKey]: "posted",
  };
  post.markModified("mediaStatus");
  post.markModified("whenPosted");

  await post.save();

  return { skipped: false, postId };
};

export async function POST(req) {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { ok: false, error: "Payload missing" },
        { status: 400 },
      );
    }

    console.log("[gmb/publish] Incoming request:", {
      account: payload.account,
      locationDataCount: Array.isArray(payload.locationData)
        ? payload.locationData.length
        : 0,
      hasOutput: Boolean(payload.output),
      hasVideo: Boolean(payload.video_url),
      checkmark: payload.checkmark,
      postType: payload.post_type,
      cta: payload.cta,
    });

    const response = await fetch(GMB_PUBLISH_URL.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${GMB_API_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await parseUpstreamResponse(response);

    console.log("[gmb/publish] Upstream response:", {
      status: response.status,
      ok: response.ok,
      hasSuccessList: Array.isArray(data?.success),
      hasFailList: Array.isArray(data?.fail),
    });

    let postStatusUpdate;
    try {
      if (!payload.skipDbUpdate) {
        postStatusUpdate = await updatePostAfterPublish({
          payload,
          data,
          responseOk: response.ok,
        });
      } else {
        postStatusUpdate = { skipped: true, reason: "handled by caller" };
      }
    } catch (updateError) {
      console.error("[gmb/publish] PostStatus update failed:", updateError);
      postStatusUpdate = {
        skipped: true,
        reason: "post status update failed",
        error: updateError.message,
      };
    }

    console.log("[gmb/publish] PostStatus update:", postStatusUpdate);

    return NextResponse.json(
      {
        ok: response.ok,
        data,
        postStatusUpdate,
      },
      { status: response.ok ? 200 : response.status || 502 },
    );
  } catch (error) {
    console.error("[gmb/publish] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Network error during GMB publish.",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
