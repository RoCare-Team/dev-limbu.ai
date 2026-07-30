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
