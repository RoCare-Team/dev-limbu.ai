/**
 * One house style for every piece of copy this platform writes.
 *
 * Each content endpoint used to carry its own loose brief — "compelling",
 * "SEO-focused", "professional, friendly" — and they all drifted into the same
 * machine register: stacked adjectives, a keyword repeated until it stopped
 * reading like English, and openings so formulaic that a measurement of 582
 * real automation posts found 53% of Instagram captions starting with the same
 * word. Pulling the rules into one place means a fix lands everywhere at once,
 * and a client's description, services and posts finally sound like the same
 * business.
 *
 * These are rules, not a template: they say what to avoid and what to be
 * specific about, and leave the wording to the model.
 */

/** Words and constructions that make copy read as machine-written. */
export const BANNED_PHRASES = [
  "unlock",
  "elevate",
  "dive in",
  "game-changer",
  "game changer",
  "in today's world",
  "in today's fast-paced world",
  "look no further",
  "rest assured",
  "we've got you covered",
  "top-notch",
  "state-of-the-art",
  "cutting-edge",
  "one-stop shop",
  "nestled in",
  "whether you're",
  "when it comes to",
  "to the next level",
  "unparalleled",
  "unmatched",
  "bespoke",
  "seamless",
  "embark",
  "testament to",
  "plethora",
  "myriad",
  "realm",
];

/** The voice rules, as a numbered block ready to drop into a prompt. */
export const HOUSE_STYLE = `WRITING RULES (follow all of them):
1. Write the way the owner of this business would talk to a customer standing in front of them — plain, specific, warm. Never salesy.
2. Be concrete. Name the actual service, the actual area, the actual step, an actual timeframe. A sentence that would fit any business in this category is a failed sentence.
3. Use the keyword naturally and ONCE where it fits. Never repeat it, never stack near-duplicates of it, never bend a sentence into nonsense to fit it in. Natural phrasing beats keyword placement every time.
4. No invented facts. Never state a price, offer, discount, guarantee, award, rating, certification, years in business or customer count that was not given to you. If a detail is missing, write around it.
5. Never use these words or phrases: ${BANNED_PHRASES.join(", ")}.
6. No stacked adjectives ("premium, trusted, reliable, affordable"). One honest descriptor is stronger than four.
7. Plain Indian English. No American idioms. No exclamation marks beyond one, no emoji unless the format explicitly calls for it.
8. Do not open with a problem-question ("Are you…?", "Is your…?", "Ever…?", "Struggling with…?", "Tired of…?", "Looking for…?"). Open with a fact, a specific detail, a short statement or a direct invitation.
9. Never paste a long business name in full. Use its short, speakable form.`;

/** The same rules compressed to one line, for prompts with a tight budget. */
export const HOUSE_STYLE_SHORT =
  "Write plainly and specifically, the way the business owner would speak to a customer. Be concrete about services and locality; invent no prices, offers, guarantees, awards or years. Use the keyword once, naturally — never stuff or repeat it. No stacked adjectives, no problem-question openings, and never these words: " +
  BANNED_PHRASES.slice(0, 14).join(", ") +
  ". Plain Indian English.";

/**
 * Trims a long GMB title down to something speakable.
 *
 * Google titles are often keyword stuffed — "X Dental – Best Dentist for
 * Invisalign, Braces, Dental Implants, RCT & Smile Makeovers Clinic Gurugram" —
 * and pasting that into a sentence was a large part of why copy read as
 * generated. Takes the part before the first dash, pipe, comma or bracket.
 */
/**
 * Which banned phrases a draft actually used.
 *
 * Listing the rules in the prompt is not enough on its own — a test run of the
 * new description prompt still came back with "Whether you're" and
 * "comprehensive" in it. So the rule is checked in code and the caller gets one
 * repair pass, which is the difference between a guideline and a guarantee.
 *
 * Curly and straight apostrophes are treated as the same character, because
 * models mix them freely and "Whether you’re" must not slip past a list that
 * spells it "Whether you're".
 */
export function findBannedPhrases(text) {
  const haystack = String(text || "")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ");
  return BANNED_PHRASES.filter((p) => haystack.includes(p.toLowerCase()));
}

export function shortBusinessName(name = "", max = 48) {
  const first = String(name).split(/[-–—|,(]/)[0].replace(/\s{2,}/g, " ").trim();
  if (!first) return String(name).trim().slice(0, max);
  return first.length > max ? first.slice(0, max).trim() : first;
}
