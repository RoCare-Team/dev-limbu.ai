export function getPlanPostLimit(planName, planDuration) {
  const normalizedPlan = (planName || "").toLowerCase();
  const normalizedCycle = (planDuration || "").toLowerCase();

  const plans = {
    "basic plan": {
      monthly: 15,
      "month": 15,
      quarterly: 45,
      "quarter": 45,
      "half-yearly": 90,
      "6 months": 90,
      yearly: 180,
      "year": 180,
    },
    "professional plan": {
      monthly: 30,
      "month": 30,
      quarterly: 90,
      "quarter": 90,
      "half-yearly": 180,
      "6 months": 180,
      yearly: 360,
      "year": 360,
    },
    "premium plan": {
      monthly: 45,
      "month": 45,
      quarterly: 135,
      "quarter": 135,
      "half-yearly": 270,
      "6 months": 270,
      yearly: 540,
      "year": 540,
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
 * Returns all frequency options, with `disabled` flag for any frequency
 * that would produce fewer posts per month than the plan requires.
 *
 * Example: Basic Plan monthly = 15 posts/month
 *   daily     (~30/month) → enabled
 *   alternate (~15/month) → enabled  ← recommended
 *   weekly    (~4/month)  → DISABLED (can't fit 15 posts in a month on weekly)
 *   custom                → always enabled
 */
export function getValidFrequencies(planName) {
  const needed = getPostsPerMonth(planName);

  const ALL = [
    { v: 'daily',     l: 'Daily',          s: 'Every day',    approxPerMonth: 30 },
    { v: 'alternate', l: 'Alternate days', s: 'Every 2 days', approxPerMonth: 15 },
    { v: 'weekly',    l: 'Weekly',         s: 'Every 7 days', approxPerMonth: 4  },
    { v: 'custom',    l: 'Custom dates',   s: 'You pick days', approxPerMonth: null },
  ];

  return ALL.map(opt => ({
    ...opt,
    disabled: opt.approxPerMonth !== null && opt.approxPerMonth < needed,
  }));
}

/**
 * Returns the recommended frequency string for a plan.
 * alternate (every 2 days) fits exactly 15 posts/month.
 */
export function getRecommendedFrequency(planName) {
  const needed = getPostsPerMonth(planName);
  if (needed > 20) return 'daily';
  if (needed > 4)  return 'alternate';
  return 'weekly';
}

/**
 * Returns the number of days between posts for a given frequency key.
 */
export function getFrequencyStep(frequency) {
  return { daily: 1, alternate: 2, weekly: 7, monthly: 30 }[frequency] ?? 1;
}

export function calculatePostingSchedule({ startDate, frequency, postsLimit, expiryDate, skippedDates = [] }) {
  if (!startDate || !postsLimit) return [];
  const dates   = [];
  const expiry  = expiryDate ? new Date(expiryDate) : null;
  let current   = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const stepMap = { daily: 1, alternate: 2, weekly: 7, monthly: 30 };
  const step    = stepMap[frequency] ?? 1;
  const skipped = new Set(Array.isArray(skippedDates) ? skippedDates : []);

  while (dates.length < postsLimit) {
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


