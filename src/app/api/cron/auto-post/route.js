/**
 * GET /api/cron/auto-post
 *
 * Runs daily at 09:00 UTC (vercel.json cron).
 *
 * For every active AutomationPlan:
 *   1. Validate plan quota + expiry + start/end date range
 *   2. Check if today is a posting day (schedule array OR frequency+lastPostDate fallback)
 *   3. Pick keyword = keywords[postIndex % keywords.length]  (cycles through list)
 *   4. Generate AI image via /api/aiAssetsGenerate (n8n) using plan payload:
 *        topic, keywords (current keyword), bussiness_name, imageConfig fields
 *   5. Generate post text via GPT-4o-mini
 *   6. Post to EVERY selected GMB location via n8n webhook
 *   7. Save PostStatus document as "posted"
 *   8. Increment postIndex + postsUsed; deactivate plan when quota exhausted
 *
 * Frequency gap rules (fallback path, no pre-computed schedule):
 *   daily     → post every day (0-day gap)
 *   alternate → post every 2 days
 *   weekly    → post every 7 days
 *   monthly   → post every 28 days
 *   custom    → pre-computed schedule array only
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import dbConnect from "@/lib/dbConnect";
import cloudinary from "@/lib/cloudinary";
import User from "@/models/User";
import GmbUser from "@/models/GmbUser";
import Post from "@/models/PostStatus";
import AutomationPlan from "@/models/AutomationPlan";
import { validatePlanExpiry, getPlanPostLimit } from "@/utils/userSettingsHelpers";

function applyIncludeInGeneration(imageConfig = {}) {
  const inc = imageConfig.includeInGeneration || {};
  const next = { ...imageConfig };
  for (const k of ["characterImage", "uniformImage", "productImage", "backgroundImage", "logoImage"]) {
    if (inc[k] === false) next[k] = null;
  }
  return next;
}
import { postToGmbAction } from "@/lib/gmb/postToGmb";

// ─── AI Assets image via /api/aiAssetsGenerate (same n8n flow as manual posts) ─

/**
 * Calls /api/aiAssetsGenerate (which proxies to the n8n image-generation webhook).
 *
 * Payload mirrors what the manual post UI sends:
 *   topic         → plan.topic  (overall campaign theme, e.g. "Water Purifier")
 *   keywords      → current keyword for this post (e.g. "Best RO water purifier")
 *   bussiness_name → plan.businessName
 *   + all imageConfig fields from the plan
 */
async function generateImageWithAiAssets({ topic, businessName, keyword, imageConfig = {} }) {
  try {
    const cfg = applyIncludeInGeneration(imageConfig);
    const {
      colourPalette, size,
      characterImage, uniformImage, productImage, backgroundImage, logoImage,
    } = cfg;

    const cleanB64 = (s) =>
      typeof s === "string" && s.startsWith("data:image") ? s.split(",")[1] : (s || "");

    // Build exactly the same payload that generateWithAssetsAction sends
    const payload = {
      topic:           topic || keyword || "",   // plan-level topic first, then keyword
      bussiness_name:  businessName || "",
      keywords:        keyword || "",            // today's keyword drives the post
      colourPalette:   colourPalette || "",
      size:            size || "3:4",
      characterImage:  cleanB64(characterImage),
      uniformImage:    cleanB64(uniformImage),
      productImage:    cleanB64(productImage),
      backgroundImage: cleanB64(backgroundImage),
      logoImage:       cleanB64(logoImage),
      platform:        "gmb",
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.limbu.ai";
    const res = await fetch(`${API_URL}/api/aiAssetsGenerate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();

    // /api/aiAssetsGenerate returns { success, data: <n8n response> }
    // n8n itself can return the URL in several shapes — handle all of them
    const inner = data?.data ?? data;
    const url =
      inner?.imageUrl || inner?.url || inner?.image || inner?.output ||
      inner?.data?.imageUrl || inner?.data?.url ||
      (Array.isArray(inner)
        ? (inner[0]?.imageUrl || inner[0]?.url || inner[0]?.image)
        : null);

    return url || null;
  } catch (err) {
    console.error("[AUTO-POST] aiAssetsGenerate failed:", err.message);
    return null;
  }
}

export const dynamic    = "force-dynamic";
export const maxDuration = 300;

// ─── Token refresh ────────────────────────────────────────────────────────────

async function getFreshAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Token refresh failed");
  return data.access_token;
}

// ─── AI content generation ────────────────────────────────────────────────────

async function generatePostContent({ businessName, location, keyword }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const biz = businessName || "this local business";
  const loc = location ? ` located in ${location}` : "";

  const prompt = `Create a Google My Business post for ${biz}${loc}.
Focus keyword: "${keyword}".
Requirements:
- Post text: max 150 characters, energetic tone, relevant emojis
- Strong call-to-action
- 2-3 relevant local SEO hashtags
- A detailed image description for an AI image generator

Return ONLY valid compact JSON (no markdown, no extra keys):
{"text":"post text here","hashtags":["#tag1","#tag2"],"imagePrompt":"detailed image description"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert GMB copywriter. Respond with ONLY compact JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() || "";

  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gm, "").trim());
  } catch {
    parsed = { text: raw.slice(0, 140), hashtags: [], imagePrompt: "" };
  }

  return {
    text:        (parsed.text || "").slice(0, 1500),
    hashtags:    Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    imagePrompt: parsed.imagePrompt || "",
  };
}

// ─── AI image generation ──────────────────────────────────────────────────────

async function generateAndUploadImage({ businessName, locality, keyword, imagePrompt }) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const openai = new OpenAI({ apiKey });

    const dallePrompt = `A high-quality professional photorealistic commercial photograph for "${businessName || "a local business"}"${locality ? ` in ${locality}` : ""}. Visual theme: ${imagePrompt || keyword}. Modern, bright, clean style. No text, no logos, no watermarks.`;

    const imgRes = await openai.images.generate({
      model: "dall-e-3", prompt: dallePrompt, n: 1,
      size: "1024x1024", quality: "standard", style: "natural",
    });

    const dalleUrl = imgRes.data?.[0]?.url;
    if (!dalleUrl) return null;

    const upload = await cloudinary.uploader.upload(dalleUrl, {
      folder: "gmb-ai-autopost",
      transformation: [
        { width: 1200, height: 900, crop: "fill", gravity: "auto" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    return upload.secure_url;
  } catch (err) {
    console.error("[AUTO-POST] Image generation failed:", err.message);
    return null; // non-fatal
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  // Protect with CRON_SECRET if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const logs = [];
  const log  = (...args) => {
    const msg = args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
    logs.push(msg);
    console.log("[AUTO-POST]", msg);
  };

  try {
    await dbConnect();
    log("DB connected");

    // ── Today's date at midnight ───────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Fetch all active plans ─────────────────────────────────────────────
    const plans = await AutomationPlan.find({
      active:            true,
      automationEnabled: true,
    }).populate("userRef").lean();

    log(`Found ${plans.length} active automation plan(s)`);

    const stats = { total: plans.length, attempted: 0, posted: 0, skipped: 0, errors: 0 };

    for (const plan of plans) {
      const {
        _id:             planId,
        userRef,
        userId,
        keywords         = [],
        postIndex        = 0,
        schedule         = [],
        frequency        = "daily",
        startDate,
        endDate,
        locations        = [],
        selectedBusiness,
        gmbProjectId,
        planDetails      = {},
        businessName     = "",
        imageConfig      = {},
        topic            = "",
        platforms        = ["gmb"],
        fbPages          = [],
        igPages          = [],
      } = plan;

      const email             = userRef?.email;
      const isBusinessConn    = userRef?.isBusinessConnected;
      const profileData       = userRef?.profileData;

      let {
        limit,
        postsUsed   = 0,
        expiryDate: packageExpiryDate,
      } = planDetails;
      if (limit == null || limit === 0) {
        limit = 0;
        if (userRef?._id || userRef) {
          const u = await User.findById(userRef._id || userRef).select("paidPackage planDuration").lean();
          if (u) {
            const computed = getPlanPostLimit(u.paidPackage, u.planDuration);
            if (computed > 0) limit = computed;
          }
        }
      }

      // ── Guards ─────────────────────────────────────────────────────────
      if (!email || !userId) {
        log("Skip — missing email/userId", { planId }); stats.skipped++; continue;
      }
      if (!isBusinessConn) {
        log(`[${email}] Skip — GMB not connected`); stats.skipped++; continue;
      }
      if (!validatePlanExpiry(packageExpiryDate)) {
        log(`[${email}] Skip — plan expired`); stats.skipped++; continue;
      }
      if (limit > 0 && postsUsed >= limit) {
        log(`[${email}] Skip — quota exhausted (${postsUsed}/${limit})`); stats.skipped++; continue;
      }

      // ── Start date check ───────────────────────────────────────────────
      if (startDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        if (today < start) {
          log(`[${email}] Skip — plan hasn't started yet (starts ${start.toDateString()})`);
          stats.skipped++; continue;
        }
      }

      // ── End date check ─────────────────────────────────────────────────
      if (endDate) {
        const end = new Date(endDate); end.setHours(0, 0, 0, 0);
        if (today > end) {
          log(`[${email}] Skip — today (${today.toDateString()}) is past end date (${end.toDateString()})`);
          await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
          stats.skipped++; continue;
        }
      }

      // ── Keyword guard ──────────────────────────────────────────────────
      const keywordList = keywords.filter(Boolean);
      if (!keywordList.length) {
        log(`[${email}] Skip — no keywords`); stats.skipped++; continue;
      }

      // ── Schedule / date-range check ────────────────────────────────────
      // If a pre-computed schedule exists, today must match schedule[postIndex].
      // Otherwise fall back to date-range + frequency + lastPostDate logic so
      // plans saved without a schedule array still run correctly.
      const scheduleDates = schedule
        .map(d => { const dd = new Date(d); dd.setHours(0, 0, 0, 0); return dd; })
        .sort((a, b) => a - b);

      let scheduledDate = today; // default for PostStatus record

      if (scheduleDates.length > 0) {
        // Pre-computed schedule: today must match schedule[postIndex]
        if (postIndex >= scheduleDates.length) {
          log(`[${email}] Skip — all scheduled posts exhausted`);
          await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
          stats.skipped++; continue;
        }
        scheduledDate = scheduleDates[postIndex];
        if (scheduledDate.getTime() !== today.getTime()) {
          log(`[${email}] Skip — today (${today.toDateString()}) ≠ schedule[${postIndex}] (${scheduledDate.toDateString()})`);
          stats.skipped++; continue;
        }
      } else {
        // No pre-computed schedule: derive posting day from lastPostDate + frequency
        if (plan.lastPostDate) {
          const last = new Date(plan.lastPostDate); last.setHours(0, 0, 0, 0);
          if (last.getTime() === today.getTime()) {
            log(`[${email}] Skip — already posted today`); stats.skipped++; continue;
          }
          const daysSinceLast = Math.round((today.getTime() - last.getTime()) / 86400000);
          const minGap = { daily: 1, alternate: 2, weekly: 7, monthly: 28 }[frequency] ?? 1;
          if (daysSinceLast < minGap) {
            log(`[${email}] Skip — ${frequency} frequency, last posted ${daysSinceLast} day(s) ago (min gap: ${minGap})`);
            stats.skipped++; continue;
          }
        }
        // No lastPostDate means this is the first post — allow it
      }

      // ── Resolve posting locations ──────────────────────────────────────
      // Use stored locations array; fallback to selectedBusiness single location
      let postingLocations = Array.isArray(locations) && locations.length > 0
        ? locations
        : selectedBusiness?.locationId
          ? [{
              locationId: selectedBusiness.locationId,
              accountId:  selectedBusiness.accountId || gmbProjectId,
              name:       selectedBusiness.name || selectedBusiness.title || businessName,
              locality:   selectedBusiness.locality || "",
              address:    selectedBusiness.address  || "",
              websiteUrl: selectedBusiness.websiteUrl || "",
            }]
          : [];

      if (!postingLocations.length) {
        log(`[${email}] Skip — no locations configured`); stats.skipped++; continue;
      }

      // ── Fetch OAuth tokens ─────────────────────────────────────────────
      // Priority 1: AutomationPlan stored tokens (saved at user-settings time, refreshed on use)
      // Priority 2: GmbUser project tokens (legacy fallback)
      let refreshToken      = plan.refreshToken      || null;
      let storedAccessToken = plan.accessToken       || null;

      if (!refreshToken && !storedAccessToken) {
        log(`[${email}] No tokens in AutomationPlan — falling back to GmbUser lookup`);
        try {
          const gmbUser   = await GmbUser.findOne({ email }).lean();
          const accountId = postingLocations[0]?.accountId || gmbProjectId;
          const project   = gmbUser?.projects?.find(p => p.googleId === accountId);
          refreshToken      = project?.refreshToken  || null;
          storedAccessToken = project?.accessToken   || null;
        } catch (e) {
          log(`[${email}] Warning — GmbUser token lookup failed: ${e.message}`);
        }
      } else {
        log(`[${email}] Using tokens from AutomationPlan (accessToken len=${storedAccessToken?.length || 0})`);
      }

      if (!refreshToken && !storedAccessToken) {
        log(`[${email}] Skip — no OAuth tokens found anywhere`); stats.skipped++; continue;
      }

      // ── Pick keyword sequentially — no cycling, each keyword used once ────
      if (postIndex >= keywordList.length) {
        log(`[${email}] Skip — all ${keywordList.length} keywords used. Marking plan complete.`);
        await AutomationPlan.updateOne({ _id: planId }, { $set: { active: false, automationEnabled: false } });
        stats.skipped++; continue;
      }
      const keyword  = keywordList[postIndex];
      const bizName  = profileData?.name || businessName || selectedBusiness?.name || selectedBusiness?.title || "";
      const locality = postingLocations[0]?.locality || profileData?.address || "";

      stats.attempted++;
      log(`[${email}] Starting post — keyword[${postIndex}/${keywordList.length - 1}]="${keyword}" → ${postingLocations.length} location(s)`);

      try {
        // ── 1. Generate text ─────────────────────────────────────────────
        const content  = await generatePostContent({ businessName: bizName, location: locality, keyword });
        const postText = `${content.text} ${content.hashtags.join(" ")}`.trim();
        log(`[${email}] Text: "${postText.slice(0, 80)}…"`);

        // ── 2. Generate image via /api/aiAssetsGenerate ─────────────────
        // payload mirrors manual post UI: topic (plan theme) + keyword (today's) + business name + imageConfig
        let imageUrl = await generateImageWithAiAssets({ topic, businessName: bizName, keyword, imageConfig });
        if (!imageUrl) {
          log(`[${email}] aiAssetsGenerate returned no URL — falling back to DALL-E`);
          imageUrl = await generateAndUploadImage({ businessName: bizName, locality, keyword, imagePrompt: content.imagePrompt });
        }
        log(`[${email}] Image: ${imageUrl ? "✓ " + imageUrl.slice(0, 60) : "⚠ none"}`);

        // ── 3. Post to each GMB location ─────────────────────────────────
        let anyFailed   = false;
        const locResults = [];

        // Use stored accessToken first; only refresh if missing or if GMB returns 401/403
        let accessToken = storedAccessToken;
        if (!accessToken && refreshToken) {
          try {
            accessToken = await getFreshAccessToken(refreshToken);
            log(`[${email}] Access token refreshed (was missing)`);
            // Persist fresh token so next cron run doesn't need to refresh again
            await AutomationPlan.updateOne({ _id: planId }, { $set: { accessToken } });
          } catch (e) {
            log(`[${email}] Token refresh failed: ${e.message}`);
          }
        }

        if (!accessToken) {
          log(`[${email}] Skip — cannot get access token`); stats.skipped++; continue;
        }

        for (const loc of postingLocations) {
          const buildPayload = (token) => ({
            account: loc.accountId,
            locationData: [{
              city:     loc.locationId,
              cityName: loc.locality || loc.name || "",
              bookUrl:  loc.websiteUrl || "",
            }],
            output:      imageUrl || "",
            description: postText,
            accessToken: token,
            checkmark:   "post",
          });

          log(`[${email}] Posting to location ${loc.locationId} (${loc.name || loc.locality})`);

          try {
            let result = await postToGmbAction(buildPayload(accessToken));

            // If token expired, refresh and retry once
            if (!result?.ok && refreshToken) {
              log(`[${email}] GMB returned error — refreshing token and retrying…`);
              try {
                accessToken = await getFreshAccessToken(refreshToken);
                await AutomationPlan.updateOne({ _id: planId }, { $set: { accessToken } });
                result = await postToGmbAction(buildPayload(accessToken));
              } catch (retryErr) {
                log(`[${email}] Token refresh/retry failed: ${retryErr.message}`);
              }
            }

            if (!result?.ok) throw new Error(`GMB webhook returned ok=false`);
            log(`[${email}] ✓ Posted to ${loc.locationId}`);
            locResults.push({ locationId: loc.locationId, success: true });
          } catch (locErr) {
            log(`[${email}] ✗ Failed ${loc.locationId}: ${locErr.message}`);
            locResults.push({ locationId: loc.locationId, success: false, error: locErr.message });
            anyFailed = true;
          }
        }

        // ── 4. Post to Facebook pages (if configured) ────────────────────
        const fbResults = [];
        const API_BASE  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        for (const fbPage of fbPages) {
          if (!fbPage.pageId || !fbPage.pageAccessToken) continue;
          log(`[${email}] Posting to Facebook page "${fbPage.pageName}" (${fbPage.pageId})`);
          try {
            const fbRes = await fetch(`${API_BASE}/api/facebook/post`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                pageId:          fbPage.pageId,
                caption:         postText,
                imageUrl:        imageUrl || "",
                pageAccessToken: fbPage.pageAccessToken,
              }),
            });
            const fbData = await fbRes.json();
            if (!fbRes.ok || fbData.error) throw new Error(fbData.error || "FB post failed");
            log(`[${email}] ✓ Facebook page ${fbPage.pageId} posted`);
            fbResults.push({ pageId: fbPage.pageId, success: true });
          } catch (fbErr) {
            log(`[${email}] ✗ Facebook page ${fbPage.pageId} failed: ${fbErr.message}`);
            fbResults.push({ pageId: fbPage.pageId, success: false, error: fbErr.message });
          }
        }

        // ── 4b. Post to Instagram accounts (if configured) ───────────────
        const igResults = [];
        for (const igAcc of igPages) {
          if (!igAcc.igId || !igAcc.pageAccessToken) continue;
          log(`[${email}] Posting to Instagram @${igAcc.igUsername} (${igAcc.igId})`);
          try {
            const igRes = await fetch(`${API_BASE}/api/instagram/post`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                igUserId:    igAcc.igId,
                caption:     postText,
                imageUrl:    imageUrl || "",
                accessToken: igAcc.pageAccessToken,
              }),
            });
            const igData = await igRes.json();
            if (!igRes.ok || igData.error) throw new Error(igData.error || "IG post failed");
            log(`[${email}] ✓ Instagram @${igAcc.igUsername} posted`);
            igResults.push({ igId: igAcc.igId, success: true });
          } catch (igErr) {
            log(`[${email}] ✗ Instagram @${igAcc.igUsername} failed: ${igErr.message}`);
            igResults.push({ igId: igAcc.igId, success: false, error: igErr.message });
          }
        }

        // ── 5. Save PostStatus — only mark "posted" when GMB succeeded ────
        // Usage counter increments only on GMB success (primary platform)
        const platformsPosted = [
          ...(!anyFailed         ? ["gmb"]      : []),
          ...(fbResults.some(r => r.success)    ? ["fb"] : []),
          ...(igResults.some(r => r.success)    ? ["ig"] : []),
        ];
        const whenPosted = Object.fromEntries(platformsPosted.map(p => [p, "posted"]));

        const postDoc = await Post.create({
          userId,
          aiOutput:            imageUrl || null,
          description:         postText,
          promat:              keyword,
          gmbDescription:      postText,
          fbDescription:       postText,
          igDescription:       postText,
          scheduledDateSource: platformsPosted.length > 0 ? platformsPosted : ["gmb"],
          status:              anyFailed ? "failed" : "posted",
          scheduledDate,
          accessToken,
          refreshToken:        refreshToken || "",
          checkmark:           "post",
          locations:           postingLocations.map(loc => ({
            locationId: loc.locationId,
            accountId:  loc.accountId,
            name:       loc.name || loc.locality || "",
            address:    loc.address || "",
            locality:   loc.locality || "",
            websiteUrl: loc.websiteUrl || "",
            isPosted:   locResults.find(r => r.locationId === loc.locationId)?.success ?? false,
            postedAt:   locResults.find(r => r.locationId === loc.locationId)?.success ? new Date() : null,
            error:      locResults.find(r => r.locationId === loc.locationId)?.error  || null,
          })),
          fbPages: fbResults.length > 0 ? fbPages.map(p => ({
            ...p,
            isPosted: fbResults.find(r => r.pageId === p.pageId)?.success ?? false,
          })) : [],
          igPages: igResults.length > 0 ? igPages.map(a => ({
            ...a,
            isPosted: igResults.find(r => r.igId === a.igId)?.success ?? false,
          })) : [],
          whenPosted,
        });
        log(`[${email}] PostStatus saved → ${postDoc._id} | platforms: ${JSON.stringify(whenPosted)}`);

        if (!anyFailed) {
          // ── 5. Increment counters ──────────────────────────────────────
          const newPostsUsed = postsUsed + 1;
          const newRemaining = Math.max(0, limit - newPostsUsed);

          const planExhausted = limit > 0 && newPostsUsed >= limit;

          await AutomationPlan.updateOne(
            { _id: planId },
            {
              $set: {
                lastPostDate:              new Date(),
                postIndex:                 postIndex + 1,
                "planDetails.postsUsed":   newPostsUsed,
                "planDetails.remaining":   newRemaining,
                ...(planExhausted && { active: false, automationEnabled: false }),
              },
            }
          );

          if (userRef?._id) {
            await User.updateOne({ _id: userRef._id }, { $inc: { postsUsed: 1 } });
          }

          stats.posted++;
          log(`[${email}] ✅ Done — nextIndex=${postIndex + 1}, postsUsed=${newPostsUsed}/${limit}${planExhausted ? " — plan quota exhausted, marked inactive" : ""}`);
        } else {
          stats.errors++;
          log(`[${email}] ⚠️ Some locations failed — postIndex NOT advanced`);
        }

      } catch (err) {
        log(`[${email}] ❌ Pipeline error: ${err.message}`);
        stats.errors++;
      }
    }

    log("Run complete", stats);
    return NextResponse.json({ success: true, stats, logs });

  } catch (error) {
    logs.push(`CRASH: ${error.message}`);
    console.error("[AUTO-POST] CRASH:", error);
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
