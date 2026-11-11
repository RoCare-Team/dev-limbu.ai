/**
 * Website audit: fetches one public page the way a crawler would and runs ~50
 * standard checks across SEO, technical, performance, security, mobile/
 * accessibility and social/local. Speed comes from Google PageSpeed Insights
 * when PAGESPEED_API_KEY is set (or the free quota allows). Server-only.
 */
import { CATEGORIES, runChecks } from "./checks";
import { extractPage } from "./html";
import {
  AuditError,
  assertPublicHost,
  checkLinks,
  fetchText,
  normalizeAuditUrl,
  readCapped,
  safeFetch,
  tlsCertificate,
} from "./net";

export { AuditError };

const PSI_TIMEOUT_MS = 45000;
const SEVERITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_POINTS = { pass: 1, warn: 0.5, fail: 0 };

/** Google PageSpeed Insights (mobile). null when unavailable — never fails the audit. */
async function pageSpeed(url) {
  const q = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (process.env.PAGESPEED_API_KEY) q.set("key", process.env.PAGESPEED_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, {
      signal: AbortSignal.timeout(PSI_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const lh = (await res.json()).lighthouseResult;
    if (!lh) return null;
    const audit = (id) => lh.audits?.[id]?.displayValue || null;
    return {
      score: Math.round((lh.categories?.performance?.score ?? 0) * 100),
      lcp: audit("largest-contentful-paint"),
      cls: audit("cumulative-layout-shift"),
      tbt: audit("total-blocking-time"),
      fcp: audit("first-contentful-paint"),
      speedIndex: audit("speed-index"),
    };
  } catch {
    return null;
  }
}

/** Does http://host redirect to https? null when http is not reachable at all. */
async function httpRedirectsToHttps(finalUrl) {
  if (finalUrl.protocol !== "https:") return false;
  const httpUrl = new URL(finalUrl.href);
  httpUrl.protocol = "http:";
  try {
    await assertPublicHost(httpUrl);
    const res = await fetch(httpUrl, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    await res.body?.cancel();
    const location = res.headers.get("location") || "";
    return res.status >= 300 && res.status < 400 && new URL(location, httpUrl).protocol === "https:";
  } catch {
    return null;
  }
}

/** Status code for a URL that cannot exist (should be 404). */
async function missingPageStatus(origin) {
  try {
    const probe = new URL(`/limbu-audit-${Date.now().toString(36)}-not-found`, origin);
    const { res } = await safeFetch(probe, { timeout: 8000 });
    await res.body?.cancel();
    return res.status;
  } catch {
    return null;
  }
}

async function findSitemap(origin, robots) {
  const declared = robots?.text.match(/^\s*sitemap:\s*(\S+)/im)?.[1];
  for (const candidate of [declared, new URL("/sitemap.xml", origin).href, new URL("/sitemap_index.xml", origin).href]) {
    if (!candidate) continue;
    const file = await fetchText(candidate);
    if (file && /<(urlset|sitemapindex)\b/i.test(file.text)) return { url: file.url };
  }
  return null;
}

function scoreOf(checks) {
  let total = 0;
  let earned = 0;
  for (const ch of checks) {
    const w = SEVERITY_WEIGHT[ch.severity] || 1;
    total += w;
    earned += w * STATUS_POINTS[ch.status];
  }
  return total ? Math.round((earned / total) * 100) : 100;
}

const count = (checks, status) => checks.filter((ch) => ch.status === status).length;

/** Full audit for one URL. Throws AuditError with a user-facing message. */
export async function runWebsiteAudit(input) {
  const url = normalizeAuditUrl(input);
  await assertPublicHost(url);

  const speedPromise = pageSpeed(url.href);

  let fetched;
  try {
    fetched = await safeFetch(url);
  } catch (err) {
    if (err instanceof AuditError) throw err;
    throw new AuditError(`Could not open ${url.hostname}. The site may be down or blocking visitors.`);
  }
  const { res, url: finalUrl, redirects, elapsed } = fetched;
  if (!/html/i.test(res.headers.get("content-type") || "")) {
    await res.body?.cancel();
    throw new AuditError("That URL is not a web page (no HTML returned).");
  }
  const { text: html, bytes } = await readCapped(res);
  const page = extractPage(html, finalUrl);

  const linksToCheck = [
    ...page.internalLinks.map((l) => l.abs.href.split("#")[0]).filter((h) => h !== finalUrl.href),
  ].slice(0, 15).concat(page.externalLinks.map((l) => l.abs.href).slice(0, 5));

  const robotsPromise = fetchText(new URL("/robots.txt", finalUrl.origin));
  const [robots, httpRedirect, soft404, cert, linkResults, speed] = await Promise.all([
    robotsPromise,
    httpRedirectsToHttps(finalUrl),
    missingPageStatus(finalUrl.origin),
    finalUrl.protocol === "https:" ? tlsCertificate(finalUrl.hostname) : null,
    checkLinks(linksToCheck),
    speedPromise,
  ]);
  const sitemap = await findSitemap(finalUrl.origin, robots);
  const brokenLinks = linkResults.filter((l) => l.status === 0 || l.status >= 400);

  const checks = runChecks({
    page,
    res,
    finalUrl,
    redirects,
    elapsed,
    bytes,
    robots,
    sitemap,
    httpRedirect,
    soft404,
    cert,
    speed,
    brokenLinks,
    checkedLinks: linkResults.length,
  });

  const categories = CATEGORIES.map((name) => {
    const list = checks.filter((ch) => ch.category === name);
    return { name, score: scoreOf(list), pass: count(list, "pass"), warn: count(list, "warn"), fail: count(list, "fail") };
  }).filter((cat) => cat.pass + cat.warn + cat.fail > 0);

  return {
    url: url.href,
    finalUrl: finalUrl.href,
    auditedAt: new Date().toISOString(),
    score: scoreOf(checks),
    categories,
    summary: { pass: count(checks, "pass"), warn: count(checks, "warn"), fail: count(checks, "fail"), total: checks.length },
    stats: {
      responseMs: elapsed,
      htmlKb: Math.round(bytes / 1024),
      words: page.words,
      images: page.images.length,
      internalLinks: page.internalLinks.length,
      externalLinks: page.externalLinks.length,
      title: page.title,
    },
    speed,
    checks,
  };
}
