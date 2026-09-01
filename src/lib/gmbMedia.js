/**
 * GMB photo-gallery upload ke shared helpers.
 *
 * Upstream (`gmb-post`) do kaam karta hai jab `checkmark: "both"` ho — post
 * banata hai AUR image ko location ki photo gallery me daalta hai. Gallery step
 * Google se image URL FETCH karke hota hai, aur wahi flaky hai:
 *   • image abhi-abhi S3 par bani hai, Google ka fetch race kar jata hai
 *   • hamari AI images 5-6 MB ki PNG hoti hain — Google ka fetch slow/timeout
 * Nateeja: "Photo gallery upload failed" — post bana hi nahi, kuch bhi post
 * nahi hua. Isliye ye retry karna safe hai (duplicate post ka risk nahi).
 */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Image URL ko pehle khud GET karke "warm" kar do — S3/CDN par object pakka
 * materialize ho jaye, taaki Google ka fetch fail na ho.
 */
export async function warmImageUrl(url, log) {
  if (!url) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { method: "GET", cache: "no-store" });
      if (r.ok) {
        // Body drain karna zaroori hai — tabhi object pakka available hai.
        await r.arrayBuffer().catch(() => {});
        if (log) log(`Image warm OK (attempt ${attempt + 1}) — ${String(url).slice(0, 80)}`);
        return true;
      }
      if (log) log(`Image warm HTTP ${r.status} (attempt ${attempt + 1})`);
    } catch (e) {
      if (log) log(`Image warm error (attempt ${attempt + 1}): ${e.message}`);
    }
    await sleep(1500 * (attempt + 1));
  }
  return false;
}

/**
 * Fail list me HAR failure photo-gallery step ka hai (aur kuch succeed nahi
 * hua) — yahi ek case retry karne layak hai.
 */
export function isGalleryOnlyFailure(failList) {
  if (!Array.isArray(failList) || failList.length === 0) return false;
  return failList.every((f) =>
    /photo gallery|gallery upload/i.test(String(f?.error || f?.message || "")),
  );
}

const failText = (failList) =>
  (Array.isArray(failList) ? failList : [])
    .map((f) => String(f?.error || f?.message || ""))
    .join(" | ");

/**
 * Kya ye failure DOBARA koshish karne layak hai?
 *
 * Pehle sirf "Photo gallery upload failed" retry hota tha. Google ke baaki
 * transient errors — "Internal error encountered.", "The service is currently
 * unavailable.", timeout — ko ek hi koshish milti thi, aur wo location us din
 * ke liye chhoot jaati thi. 60-din ke production data me yahi silent misses
 * dikhe (1492x gallery, 26x internal error, 2x unavailable, 1x timeout).
 *
 * PERMANENT errors (jaise "Request contains an invalid argument." — galat CTA /
 * phone / URL) jaan-boojhkar retry nahi hote: wahi payload dobara bhejne se
 * wahi error aayega, sirf waqt aur quota barbaad hoga.
 */
export function isRetryableGmbFailure(failList) {
  const text = failText(failList);
  // Fail list khaali hai (network / parse error) — ek aur koshish banti hai.
  if (!text.trim()) return true;
  if (/invalid argument|invalid_argument|permission|not authorized|forbidden|not found/i.test(text)) {
    return false;
  }
  return /photo gallery|gallery upload|internal error|currently unavailable|unavailable|timed out|timeout|deadline|backend error|try again|temporarily|rate limit|quota|too many requests|\b(500|502|503|504)\b/i.test(
    text,
  );
}
