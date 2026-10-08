import Post from "@/models/PostStatus";
import { findBannedPhrases } from "@/lib/contentStyleRules";

/**
 * Writes the captions for an automation post.
 *
 * Why this exists: captions used to come straight from the image webhook, and
 * over 45 days of real posts they collapsed into one formula — 53% of Instagram
 * captions and 31% of Google captions opened with the word "Struggling", and the
 * top three opening words covered 76% of Instagram captions. No two were byte
 * identical, so nothing looked broken, but a client reading their feed saw the
 * same post every day.
 *
 * Two things fix that here, and both are deliberate:
 *   1. A rotating content angle, so consecutive posts are different KINDS of
 *      post (an offer, then a how-it-works, then a myth, then a local note) and
 *      not the same post with new adjectives.
 *   2. The openings this client actually received recently are read back out of
 *      the database and banned by name, so the model cannot drift back into a
 *      formula it used last week.
 *
 * If the model is unavailable this returns null and the caller keeps the
 * webhook's caption — a plainer caption is better than no post.
 */

/**
 * One post type per slot. Twelve of them, so a daily plan runs a fortnight
 * before an angle comes round again — and by then the keyword has moved too.
 */
export const CONTENT_ANGLES = [
  {
    key: "service_spotlight",
    brief:
      "Explain this one service plainly: what it fixes and what the customer walks away with. No hype words.",
  },
  {
    key: "how_it_works",
    brief:
      "Walk through what actually happens, step by step, from the first call to the finished job. Make it feel predictable and easy.",
  },
  {
    key: "myth_buster",
    brief:
      "Name one thing local customers wrongly believe about this service and correct it with a concrete fact.",
  },
  {
    key: "question_answered",
    brief:
      "Answer the single question customers ask most about this service. State the question, then answer it properly.",
  },
  {
    key: "who_its_for",
    brief:
      "Describe the specific person this is right for, and say plainly who it is NOT for. Specific beats flattering.",
  },
  {
    key: "what_to_expect",
    brief:
      "Set expectations: how long it takes, what it costs in time or effort, what the customer needs to bring or prepare.",
  },
  {
    key: "local_note",
    brief:
      "Tie the service to this city specifically — local weather, traffic, water, seasons, neighbourhood habits. Something only a local would write.",
  },
  {
    key: "mistake_to_avoid",
    brief:
      "One mistake people make before coming in, and what to do instead. Useful even to someone who never visits.",
  },
  {
    key: "result_focus",
    brief:
      "Describe the result in concrete, observable terms — what looks, works or feels different afterwards.",
  },
  {
    key: "quick_tip",
    brief:
      "Give one genuinely useful tip the reader can act on today without buying anything. Earn the follow.",
  },
  {
    key: "behind_the_scenes",
    brief:
      "Show the care behind the work: the checks, the tools, the standards, the people. Build trust, not noise.",
  },
  {
    key: "invitation",
    brief:
      "A direct, warm invitation to book or visit, with the one practical detail that makes it easy (hours, walk-ins, parking, phone).",
  },
];

/** Which angle slot `index` gets. Keeps images and captions marching together. */
export function pickAngle(index = 0) {
  const i = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  return CONTENT_ANGLES[i % CONTENT_ANGLES.length];
}

/**
 * The openings that made every caption feel the same. Measured from this
 * database, not guessed: these are the real top offenders across 582 posts.
 */
const BANNED_OPENERS = [
  "Struggling",
  "Tired of",
  "Worried",
  "Ever felt",
  "Ever wondered",
  "Craving",
  "Noticed",
  "Noticing",
  "Frustrated",
  "Dreaming of",
  "Feeling",
  "Looking for",
  "Finding a",
  "Finding the",
  "Searching for",
  "Is your",
  "Planning",
  "Dealing with",
];

const normalizeOpening = (text) =>
  String(text || "")
    // Drop leading emoji and punctuation so the first real words are compared.
    .replace(/^[^A-Za-z]+/, "")
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .toLowerCase()
    .trim();

/**
 * The openings this client has actually been sent recently, newest first.
 *
 * Reading them back is what stops the slow slide into a formula: the model is
 * told, by name, which openings are already in this feed.
 */
export async function getRecentOpenings(userId, limit = 14) {
  if (!userId) return [];
  try {
    const rows = await Post.find({ userId, automationQueued: true })
      .select("gmbDescription igDescription createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const seen = new Set();
    const out = [];
    for (const r of rows) {
      for (const text of [r.gmbDescription, r.igDescription]) {
        const open = normalizeOpening(text);
        if (!open || seen.has(open)) continue;
        seen.add(open);
        out.push(open);
      }
    }
    return out.slice(0, 20);
  } catch (err) {
    // Never block a post over this — a missing ban list only costs variety.
    console.error("[caption-writer] recent openings lookup failed:", err.message);
    return [];
  }
}

async function callGpt(systemPrompt, userPrompt, maxTokens = 900, attempt = 1) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[caption-writer] OPENAI_API_KEY not set — falling back to webhook captions");
    return null;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Higher than the image-prompt call on purpose: this is the knob that
        // buys wording variety between posts.
        temperature: 1,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) {
      console.warn("[caption-writer] empty completion:", JSON.stringify(data).slice(0, 200));
      return null;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[caption-writer] GPT error (attempt ${attempt}):`, err.message);
    // A single transient "fetch failed" was enough to drop a post back to the
    // formulaic webhook caption, which is exactly what this module exists to
    // avoid. One retry costs a second and recovers the common case.
    if (attempt === 1) {
      await new Promise((r) => setTimeout(r, 1500));
      return callGpt(systemPrompt, userPrompt, maxTokens, 2);
    }
    return null;
  }
}

/**
 * Writes one post's captions, one per platform.
 *
 * Returns { gmb, fb, ig, li, pin, pinTitle, yt, angle } or null if the model
 * could not be reached, so the caller can fall back.
 *
 * `{city}` is kept verbatim in the GMB caption only: the upstream gmb-post
 * service swaps it per location, which is how one caption serves a multi-branch
 * client correctly. Facebook and Instagram are not per-location, so those get
 * the real city name written in.
 */
export async function writeAutomationCaptions({
  businessName = "",
  cityName = "",
  keyword = "",
  services = [],
  businessDescription = "",
  websiteUrl = "",
  phone = "",
  postIndex = 0,
  recentOpenings = [],
} = {}) {
  if (!keyword && !businessName) return null;

  const angle = pickAngle(postIndex);

  // Long GMB titles ("X Dental – Best Dentist for Invisalign, Braces, RCT …")
  // were being pasted into captions whole, which is most of why the old text
  // read as machine-written. Keep a short, speakable form.
  const shortName = String(businessName)
    .split(/[-–—|,(]/)[0]
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 48) || businessName;

  const serviceList = (Array.isArray(services) ? services : [])
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .slice(0, 12);

  const avoid = [...new Set([...BANNED_OPENERS.map((b) => b.toLowerCase()), ...recentOpenings])];

  const system = [
      "You are an experienced local-marketing copywriter in India who writes Google Business Profile and social posts for small businesses.",
      "You write the way a good shop owner talks: plain, specific, warm, never salesy.",
      "You never pad with adjectives, never use corporate filler, and never write a sentence a real owner would not say out loud.",
      "Return ONLY a JSON object. No markdown, no commentary.",
  ].join(" ");

  const userPrompt = `BUSINESS
Name (short, use this form): "${shortName}"
${cityName ? `City: "${cityName}"` : ""}
${businessDescription ? `What they do: "${String(businessDescription).slice(0, 600)}"` : ""}
${serviceList.length ? `Services they offer: ${serviceList.join(", ")}` : ""}
${websiteUrl ? `Website: ${websiteUrl}` : ""}
${phone ? `Phone: ${phone}` : ""}

THIS POST
Focus keyword: "${keyword}"
Post angle (${angle.key}): ${angle.brief}

WRITE captions for one post, each platform in its own voice:
- "gmb"  — Google Business Profile. 50-90 words, 3-4 sentences. Informative and local. Write the token {city} EXACTLY where the city name belongs (do not write the city name itself in this field). End with one plain call to action.
- "fb"   — Facebook. 40-70 words, conversational, written for ${cityName || "the local area"}. Use the real city name here, not a token. At most one emoji, and only if it genuinely helps.
- "ig"   — Instagram. 25-45 words, punchy, then 4-6 lowercase hashtags on a new line mixing the service and the city.
- "li"   — LinkedIn. 40-70 words, professional and factual, no emoji, no hashtags.
- "pin"  — Pinterest description. 30-50 words, descriptive and searchable.
- "pinTitle" — Pinterest title, under 60 characters.
- "yt"   — YouTube Shorts description. 25-45 words.

HARD RULES
1. Do NOT open any caption with these words or phrases — they have been overused in this client's feed and must not appear as an opening: ${avoid.join("; ")}.
2. Every platform must open differently from the others in this post. No shared first sentence, no shared first three words.
3. Do NOT open with a problem-question ("Are you…?", "Is your…?", "Ever…?"). Open with a fact, a number, a specific detail, a short statement, or a direct invitation.
4. Use the keyword "${keyword}" naturally — once in the GMB caption, at most once elsewhere. Never repeat it or stack it with near-duplicates. If it reads awkwardly as written, bend the grammar around it rather than forcing it in.
5. Never paste a long business name. Use "${shortName}", and at most once per caption.
6. Be concrete. Name a real service, a real step, a real timeframe or a real detail from the information above. Never invent prices, offers, discounts, guarantees, awards, ratings or results.
7. No "unlock", "elevate", "dive in", "game-changer", "in today's world", "look no further", "rest assured", "we've got you covered", "top-notch", "state-of-the-art".
8. Plain Indian English. No American idioms.

Return ONLY:
{"gmb":"...","fb":"...","ig":"...","li":"...","pin":"...","pinTitle":"...","yt":"..."}`;

  let result = await callGpt(system, userPrompt, 1000);
  if (!result) return null;

  // Rules in a prompt are a request, not a guarantee — test runs still came
  // back with "Whether you're" in one caption, and with Google and Facebook
  // opening on the same five words in another. So both rules are checked in
  // code, and the model gets exactly one pass to fix what it broke.
  const TEXT_KEYS = ["gmb", "fb", "ig", "li", "pin", "yt"];

  const problems = (draft) => {
    const found = [];
    const banned = [...new Set(TEXT_KEYS.flatMap((k) => findBannedPhrases(draft[k])))];
    if (banned.length) found.push(`banned phrases used: ${banned.join(", ")}`);

    // The opener ban is the whole point of this module, so it is checked rather
    // than merely requested: a test run still opened a caption with "Looking".
    for (const k of TEXT_KEYS) {
      const open = normalizeOpening(draft[k]);
      if (!open) continue;
      const hit = BANNED_OPENERS.find((b) => open.startsWith(b.toLowerCase()));
      if (hit) found.push(`the ${k} caption opens with "${hit}", which is not allowed`);
    }

    // The client reads these side by side, so a shared opening between the
    // Google post and the Facebook post reads as one post pasted twice.
    const openings = {};
    for (const k of ["gmb", "fb", "ig"]) {
      const o = normalizeOpening(draft[k]);
      if (!o) continue;
      (openings[o] = openings[o] || []).push(k);
    }
    const shared = Object.entries(openings).filter(([, ks]) => ks.length > 1);
    for (const [o, ks] of shared) {
      found.push(`${ks.join(" and ")} both open with "${o}" — each platform needs its own opening`);
    }
    return found;
  };

  const faults = problems(result);
  if (faults.length) {
    console.log(`[caption-writer] repairing: ${faults.join(" | ")}`);
    const repaired = await callGpt(
      system,
      `${userPrompt}

Your previous answer broke these rules:
${faults.map((f) => "- " + f).join("\n")}

Here is that answer:
${JSON.stringify(result)}

Rewrite it so none of those problems remain. Change only what is needed to fix
them — keep every other sentence exactly as it is and keep the same facts.
Return the same JSON shape.`,
      1000,
    );
    // Only take the repair if it actually fixed things rather than shuffling them.
    if (repaired && repaired.gmb && repaired.fb && problems(repaired).length < faults.length) {
      result = repaired;
    }
  }

  const pick = (v) => String(v || "").replace(/\s{3,}/g, " ").trim();
  const captions = {
    gmb: pick(result.gmb),
    fb: pick(result.fb),
    ig: pick(result.ig),
    li: pick(result.li),
    pin: pick(result.pin),
    pinTitle: pick(result.pinTitle).slice(0, 100),
    yt: pick(result.yt),
  };

  // A half-written answer is worse than the fallback, so require the two
  // captions that actually get published.
  if (!captions.gmb || !captions.fb) {
    console.warn("[caption-writer] incomplete result — falling back to webhook captions");
    return null;
  }

  console.log(
    `[caption-writer] angle=${angle.key} opening="${normalizeOpening(captions.gmb)}" banned=${avoid.length}`,
  );

  return { ...captions, angle: angle.key };
}
