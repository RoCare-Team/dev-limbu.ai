export function getPlanPostLimit(planName, planDuration) {
  const normalizedPlan = (planName || "").toLowerCase();
  const normalizedCycle = (planDuration || "").toLowerCase();

  const plans = {
    "basic plan": {
      monthly: 10,
      "month": 10,
      quarterly: 30,
      "quarter": 30,
      "half-yearly": 60,
      "6 months": 60,
      yearly: 120,
      "year": 120,
    },
    "professional plan": {
      monthly: 20,
      "month": 20,
      quarterly: 60,
      "quarter": 60,
      "half-yearly": 120,
      "6 months": 120,
      yearly: 240,
      "year": 240,
    },
    "premium plan": {
      monthly: 30,
      "month": 30,
      quarterly: 90,
      "quarter": 90,
      "half-yearly": 180,
      "6 months": 180,
      yearly: 360,
      "year": 360,
    },
  };

  const planConfig = plans[normalizedPlan];
  if (!planConfig) return 0;

  // Prefer exact cycle match; fallback to monthly posts if unknown
  return planConfig[normalizedCycle] ?? planConfig.monthly ?? 0;
}

export function validatePlanExpiry(expiryDate) {
  return expiryDate ? new Date(expiryDate) > new Date() : false;
}

/**
 * Returns posts-per-month for a plan name.
 * Used to determine which posting frequencies are feasible.
 */
export function getPostsPerMonth(planName) {
  return getPlanPostLimit(planName, 'monthly') || 15;
}

/**
 * Every plan has EXACTLY ONE correct posting cadence — the plan dictates it,
 * the user does not choose it:
 *   Basic Plan        → 10 posts/month  → alternate day (gap of 1 day)
 *   Professional Plan → 20 posts/month  → daily (1 post/day)
 *   Premium Plan       → 30 posts/month  → twicedaily (2 posts/day — morning + evening)
 *
 * NOTE: since the plans moved to 10/20/30 posts, these cadences run through a
 * month's quota early (twicedaily spends 30 posts in ~15 days). The cadence is
 * only the DEFAULT — the user can pick another in /user-settings, and the end
 * date is recalculated from whatever they pick.
 * Any plan we don't recognise falls back to 'daily'.
 */
export function getFixedFrequencyForPlan(planName) {
  const normalized = (planName || '').toLowerCase();
  if (normalized === 'basic plan') return 'alternate';
  if (normalized === 'professional plan') return 'daily';
  if (normalized === 'premium plan') return 'twicedaily';
  return 'daily';
}

/**
 * Returns all frequency options for display. Every cadence is selectable — the
 * plan only decides which one is RECOMMENDED (and pre-selected). A cadence
 * slower than the plan's can leave posts undelivered before expiry, so the UI
 * warns about that shortfall rather than taking the choice away.
 */
export function getValidFrequencies(planName) {
  const recommended = getFixedFrequencyForPlan(planName);

  const ALL = [
    { v: 'daily',      l: 'Daily',            s: 'Every day — 1 post/day' },
    { v: 'alternate',  l: 'Alternate days',   s: 'Every 2 days — 1 post/alternate day' },
    { v: 'twicedaily', l: 'Twice daily',      s: '2 posts/day — morning + evening' },
    { v: 'weekly',     l: 'Weekly',           s: 'Every 7 days' },
    { v: 'custom',     l: 'Custom dates',     s: 'You pick days' },
  ];

  return ALL.map(opt => ({
    ...opt,
    recommended: opt.v === recommended,
    disabled: false,
  }));
}

/**
 * The recommended (and only allowed) frequency for a plan — same as
 * getFixedFrequencyForPlan, kept as a separate export for call-site clarity.
 */
export function getRecommendedFrequency(planName) {
  return getFixedFrequencyForPlan(planName);
}

/**
 * Returns the number of days between posting days for a given frequency key.
 * (For 'twicedaily' the calendar-day gap is still 1 — the 2nd post of the
 * same day is handled by getPostsPerDay, not by the day step.)
 */
export function getFrequencyStep(frequency) {
  return { daily: 1, alternate: 2, twicedaily: 1, weekly: 7, monthly: 30 }[frequency] ?? 1;
}

/** Posts scheduled per calendar day for a given frequency (only twicedaily > 1). */
export function getPostsPerDay(frequency) {
  return frequency === 'twicedaily' ? 2 : 1;
}

/**
 * Builds the list of calendar days that should carry a post. For 'twicedaily'
 * this returns ONE entry per day (day-granularity — used for is-this-a-posting-day
 * checks); callers that need actual per-slot publish timestamps (2/day) expand
 * each day into a morning + evening instant themselves (see
 * `src/utils/automationPlanSchedule.js` → `getTwiceDailyUtcMsForDateRef`).
 */
export function calculatePostingSchedule({ startDate, frequency, postsLimit, expiryDate, skippedDates = [] }) {
  if (!startDate || !postsLimit) return [];
  const dates   = [];
  const expiry  = expiryDate ? new Date(expiryDate) : null;
  let current   = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const step        = getFrequencyStep(frequency);
  const slotsPerDay  = getPostsPerDay(frequency);
  // Number of calendar days needed to fit postsLimit posts at slotsPerDay/day.
  const daysNeeded  = Math.ceil(postsLimit / slotsPerDay);
  const skipped = new Set(Array.isArray(skippedDates) ? skippedDates : []);

  while (dates.length < daysNeeded) {
    if (expiry && current > expiry) break;
    const key = current.toISOString().slice(0, 10);
    if (!skipped.has(key)) dates.push(new Date(current));
    current = new Date(current);
    current.setDate(current.getDate() + step);
  }
  return dates;
}

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"; // 🔑 Replace with your key

export async function generateWithAI(fieldLabel, businessContext) {
  const prompts = {
    "Business name": `Suggest 3 creative, professional business names for a water purifier and RO service company. Context: ${businessContext}. Return only a JSON array of strings, no extra text.`,
    "Description": `Write an optimized Google My Business description (max 750 chars) for a water purifier/RO service company. Context: ${businessContext}. Highlight key services, location, USP. Return only the description text.`,
    "Business category": `Suggest 5 relevant Google My Business categories for a water purifier and RO service company. Return only a JSON array of strings.`,
    "Phone number": `This field contains contact info — just return a placeholder note: "Please update manually for security."`,
    "Website": `Suggest SEO-friendly URL slug ideas for a water purifier company website. Context: ${businessContext}. Return as JSON array of strings.`,
    "Business address": `This is a sensitive address field — just return a helpful tip as plain text about why an accurate GMB address improves local rankings.`,
    "Year established": `Return just a short motivational note (1 sentence) about why adding founding year helps build trust on Google My Business.`,
    "From the business": `Write a compelling 1-sentence "From the business" tagline for a water purifier / RO service company. Context: ${businessContext}. Return only the tagline.`,
    "Amenities": `Suggest 5–8 relevant amenities/highlights for a water purifier service business (e.g. "Free home installation", "24/7 support"). Return as a comma-separated string.`,
    "Service area": `Suggest service area cities/regions for a water purifier company based in Ahmedabad, Gujarat. Return as a comma-separated string.`,
    "Social profiles": `List the top 3 social platforms a water purifier B2C business should be on, with short reason. Return as plain text bullet points.`,
  };

  const prompt = prompts[fieldLabel] || `Suggest an optimized value for the "${fieldLabel}" field of a Google My Business profile for a water purifier company. Context: ${businessContext}. Be concise and practical.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a Google My Business optimization expert. Respond with concise, actionable suggestions. Never add extra commentary." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export const TOP_100_KEYWORDS = {
  "🚰 Products": [
    "RO water purifier", "water purifier", "water filter", "UV water purifier",
    "UF water purifier", "alkaline water purifier", "under sink water purifier",
    "wall mount water purifier", "countertop water purifier", "water softener",
    "water dispenser", "mineral water purifier", "zero B water purifier",
    "Kent RO purifier", "Aquaguard water purifier", "Livpure water purifier",
    "Pureit water purifier", "AO Smith water purifier", "Whirlpool water purifier",
    "water purifier with TDS controller",
  ],
  "🔧 Services": [
    "RO service", "RO repair", "RO installation", "water purifier service",
    "water purifier repair", "water purifier installation", "RO AMC",
    "annual maintenance contract", "RO membrane replacement", "filter change service",
    "UV lamp replacement", "RO service at home", "doorstep RO service",
    "water purifier servicing near me", "RO service center", "RO technician",
    "water purifier not working", "RO water not coming", "low water flow fix",
    "TDS meter check service",
  ],
  "📍 Local / Location": [
    "RO service Ahmedabad", "water purifier Ahmedabad", "RO repair Ahmedabad",
    "water purifier service near me", "RO installation near me",
    "best water purifier shop Ahmedabad", "water purifier dealer Ahmedabad",
    "RO service Gandhinagar", "RO service Gujarat", "water purifier AMC Ahmedabad",
    "RO service Satellite", "RO service Bopal", "RO service Navrangpura",
    "RO service Maninagar", "RO repair near me",
  ],
  "💡 Benefits / Intent": [
    "pure drinking water", "safe drinking water at home", "remove TDS from water",
    "bacteria free water", "best water for health", "clean water at home",
    "reduce water hardness", "remove chlorine from water", "drinking water solution",
    "water purification for home", "water purification for office",
    "best water purifier under 10000", "affordable RO purifier", "water purifier price",
    "buy water purifier online", "water purifier with warranty",
  ],
  "🏢 Business / B2B": [
    "commercial RO plant", "industrial water purifier", "RO plant for office",
    "water purifier for restaurant", "water purifier for hospital",
    "bulk water purifier supply", "water treatment plant", "water softener for industry",
    "B2B water purification solution", "RO system for factory",
    "water filtration system", "water treatment solution",
  ],
  "📣 Offers & Promotions": [
    "free RO service", "water purifier discount offer", "RO installation free",
    "limited time water purifier offer", "RO AMC offer", "summer water purifier deal",
    "water purifier cashback", "refer and earn water purifier",
    "free filter replacement offer", "RO service camp",
  ],
};


