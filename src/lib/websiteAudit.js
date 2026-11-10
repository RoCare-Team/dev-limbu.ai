/**
 * Website audit: fetches one public page the way a crawler would and checks
 * on-page SEO, technical basics and (via Google PageSpeed Insights) speed.
 * Server-only. Used by POST /api/website-audit.
 */
import dns from "node:dns/promises";
import net from "node:net";

const FETCH_TIMEOUT_MS = 15000;
const PSI_TIMEOUT_MS = 45000;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const UA =
  "Mozilla/5.0 (compatible; LimbuAuditBot/1.0; +https://limbu.ai/seo-tools/website-audit)";

export class AuditError extends Error {}

// ── URL safety: only public http(s) hosts, never our own network ──────────

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return (
    v6 === "::" || v6 === "::1" ||
    v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")
  );
}

/** "example.com" -> URL("https://example.com/"). Throws AuditError when unusable. */
export function normalizeAuditUrl(input) {
  let raw = String(input || "").trim();
  if (!raw) throw new AuditError("Please enter a website URL.");
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new AuditError("That does not look like a valid website URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AuditError("Only http and https websites can be audited.");
  }
  if (!url.hostname.includes(".")) {
    throw new AuditError("Please enter a full domain, e.g. example.com");
  }
  url.hash = "";
  return url;
}

async function assertPublicHost(url) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new AuditError("This address cannot be audited.");
  }
  let addresses;
  try {
    addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  } catch {
    throw new AuditError(`Could not find the website ${host}. Check the spelling.`);
  }
  if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) {
    throw new AuditError("This address cannot be audited.");
  }
}

/** fetch with a timeout, following redirects by hand so every hop is checked. */
async function safeFetch(startUrl, { method = "GET" } = {}) {
  let url = new URL(startUrl);
  const redirects = [];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    const started = Date.now();
    const res = await fetch(url, {
      method,
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const elapsed = Date.now() - started;
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      redirects.push({ from: url.href, status: res.status });
      url = new URL(location, url);
      continue;
    }
    return { res, url, redirects, elapsed };
  }
  throw new AuditError("The website redirects too many times.");
}

async function readCapped(res) {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_HTML_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return { text: Buffer.concat(chunks).toString("utf8"), bytes: size };
}

// ── Tiny HTML helpers (regex is enough for these checks) ──────────────────

const decode = (s) =>
  String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();

const stripTags = (html) => decode(String(html).replace(/<[^>]+>/g, " "));

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];

function metaContent(html, key) {
  const tag = tags(html, "meta").find((t) => {
    const n = (attr(t, "name") || attr(t, "property") || "").toLowerCase();
    return n === key;
  });
  return tag ? attr(tag, "content") : null;
}

function inner(html, name) {
  return (html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "gi")) || []).map(
    (m) => stripTags(m.replace(new RegExp(`^<${name}\\b[^>]*>|</${name}>$`, "gi"), ""))
  );
}

// ── Checks ────────────────────────────────────────────────────────────────

const check = (category, id, label, status, value, fix) => ({ category, id, label, status, value, fix });

function analyzeHtml({ html, finalUrl, res, elapsed, bytes, redirects }) {
  const out = [];
  const head = html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] || html;
  const body = html.match(/<body\b[\s\S]*<\/body>/i)?.[0] || html;
  const visibleText = stripTags(body.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " "));
  const words = visibleText ? visibleText.split(" ").filter(Boolean).length : 0;

  // SEO
  const title = inner(head, "title")[0] || "";
  out.push(
    !title
      ? check("SEO", "title", "Page title", "fail", "Missing", "Add a <title> of 30–60 characters with your main keyword and city.")
      : title.length < 30 || title.length > 60
        ? check("SEO", "title", "Page title", "warn", `${title.length} characters: “${title}”`, "Keep the title between 30 and 60 characters so Google shows it in full.")
        : check("SEO", "title", "Page title", "pass", `${title.length} characters: “${title}”`)
  );

  const desc = metaContent(head, "description") || "";
  out.push(
    !desc
      ? check("SEO", "description", "Meta description", "fail", "Missing", "Add a meta description of 70–160 characters that sells the page.")
      : desc.length < 70 || desc.length > 160
        ? check("SEO", "description", "Meta description", "warn", `${desc.length} characters`, "Keep the meta description between 70 and 160 characters.")
        : check("SEO", "description", "Meta description", "pass", `${desc.length} characters`)
  );

  const h1s = inner(body, "h1").filter(Boolean);
  out.push(
    h1s.length === 1
      ? check("SEO", "h1", "H1 heading", "pass", `“${h1s[0].slice(0, 80)}”`)
      : h1s.length === 0
        ? check("SEO", "h1", "H1 heading", "fail", "No H1 found", "Add one H1 that says what the page is about.")
        : check("SEO", "h1", "H1 heading", "warn", `${h1s.length} H1 tags`, "Use a single H1 per page; turn the others into H2s.")
  );

  const h2Count = tags(body, "h2").length;
  out.push(
    h2Count > 0
      ? check("SEO", "h2", "Sub-headings (H2)", "pass", `${h2Count} found`)
      : check("SEO", "h2", "Sub-headings (H2)", "warn", "None found", "Break the content into sections with H2 sub-headings.")
  );

  out.push(
    words >= 300
      ? check("SEO", "words", "Content length", "pass", `${words} words`)
      : check("SEO", "words", "Content length", "warn", `${words} words`, "Pages with under 300 words rarely rank. Add useful, local content.")
  );

  const imgs = tags(body, "img");
  const noAlt = imgs.filter((t) => !(attr(t, "alt") || "").trim()).length;
  out.push(
    imgs.length === 0
      ? check("SEO", "alt", "Image alt text", "warn", "No images found", "Add real photos of your business with descriptive alt text.")
      : noAlt === 0
        ? check("SEO", "alt", "Image alt text", "pass", `All ${imgs.length} images have alt text`)
        : check("SEO", "alt", "Image alt text", noAlt / imgs.length > 0.5 ? "fail" : "warn", `${noAlt} of ${imgs.length} images missing alt`, "Describe every image in its alt attribute.")
  );

  const canonicalTag = tags(head, "link").find((t) => (attr(t, "rel") || "").toLowerCase() === "canonical");
  out.push(
    canonicalTag
      ? check("SEO", "canonical", "Canonical URL", "pass", attr(canonicalTag, "href"))
      : check("SEO", "canonical", "Canonical URL", "warn", "Missing", "Add <link rel=\"canonical\"> so Google knows the main version of the page.")
  );

  const robotsMeta = (metaContent(head, "robots") || "").toLowerCase();
  const robotsHeader = (res.headers.get("x-robots-tag") || "").toLowerCase();
  out.push(
    robotsMeta.includes("noindex") || robotsHeader.includes("noindex")
      ? check("SEO", "indexable", "Allowed in Google", "fail", "Page is set to noindex", "Remove the noindex tag, otherwise Google will not show this page.")
      : check("SEO", "indexable", "Allowed in Google", "pass", "Indexable")
  );

  const ldJson = (html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/gi) || []).length;
  out.push(
    ldJson
      ? check("SEO", "schema", "Structured data (schema)", "pass", `${ldJson} JSON-LD block(s)`)
      : check("SEO", "schema", "Structured data (schema)", "warn", "None found", "Add LocalBusiness schema so Google shows rich results.")
  );

  // Technical
  out.push(
    finalUrl.protocol === "https:"
      ? check("Technical", "https", "HTTPS / SSL", "pass", "Secure")
      : check("Technical", "https", "HTTPS / SSL", "fail", "Not secure (http)", "Install an SSL certificate and redirect http to https.")
  );

  out.push(
    res.status === 200
      ? check("Technical", "status", "Page status", "pass", `${res.status} OK`)
      : check("Technical", "status", "Page status", "fail", `HTTP ${res.status}`, "The page should return 200. Fix the server error or broken page.")
  );

  out.push(
    redirects.length <= 1
      ? check("Technical", "redirects", "Redirects", "pass", redirects.length ? "1 redirect" : "None")
      : check("Technical", "redirects", "Redirects", "warn", `${redirects.length} redirects`, "Link straight to the final URL; each redirect slows the page.")
  );

  out.push(
    elapsed < 800
      ? check("Technical", "ttfb", "Server response time", "pass", `${elapsed} ms`)
      : elapsed < 2000
        ? check("Technical", "ttfb", "Server response time", "warn", `${elapsed} ms`, "Aim for under 0.8 s. Use caching or better hosting.")
        : check("Technical", "ttfb", "Server response time", "fail", `${elapsed} ms`, "The server is slow. Use caching, a CDN or better hosting.")
  );

  const kb = Math.round(bytes / 1024);
  out.push(
    kb < 500
      ? check("Technical", "size", "HTML size", "pass", `${kb} KB`)
      : check("Technical", "size", "HTML size", kb < 1500 ? "warn" : "fail", `${kb} KB`, "Reduce inline code and page bloat; keep HTML under 500 KB.")
  );

  const enc = (res.headers.get("content-encoding") || "").toLowerCase();
  out.push(
    /gzip|br|zstd|deflate/.test(enc)
      ? check("Technical", "compression", "Compression", "pass", enc)
      : check("Technical", "compression", "Compression", "warn", "Not compressed", "Enable gzip or Brotli on the server.")
  );

  const lang = attr(html.match(/<html\b[^>]*>/i)?.[0] || "", "lang");
  out.push(
    lang
      ? check("Technical", "lang", "Language set", "pass", lang)
      : check("Technical", "lang", "Language set", "warn", "Missing", "Add lang=\"en\" (or your language) to the <html> tag.")
  );

  // Mobile & Social
  const viewport = metaContent(head, "viewport");
  out.push(
    viewport && /width\s*=\s*device-width/i.test(viewport)
      ? check("Mobile & Social", "viewport", "Mobile friendly viewport", "pass", viewport)
      : check("Mobile & Social", "viewport", "Mobile friendly viewport", "fail", "Missing", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.")
  );

  const ogTitle = metaContent(head, "og:title");
  const ogImage = metaContent(head, "og:image");
  out.push(
    ogTitle && ogImage
      ? check("Mobile & Social", "og", "Social share preview", "pass", "og:title and og:image set")
      : check("Mobile & Social", "og", "Social share preview", "warn", ogTitle || ogImage ? "Partly set" : "Missing", "Add og:title, og:description and og:image so WhatsApp and Facebook show a preview.")
  );

  const favicon = tags(head, "link").some((t) => /icon/i.test(attr(t, "rel") || ""));
  out.push(
    favicon
      ? check("Mobile & Social", "favicon", "Favicon", "pass", "Found")
      : check("Mobile & Social", "favicon", "Favicon", "warn", "Missing", "Add a favicon so your brand shows in browser tabs and Google results.")
  );

  // Links, for the summary only
  const anchors = tags(body, "a").map((t) => attr(t, "href")).filter(Boolean);
  let internal = 0;
  let external = 0;
  for (const href of anchors) {
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    try {
      new URL(href, finalUrl).hostname === finalUrl.hostname ? internal++ : external++;
    } catch {
      /* ignore bad hrefs */
    }
  }

  return { checks: out, stats: { words, images: imgs.length, internalLinks: internal, externalLinks: external, htmlKb: kb, responseMs: elapsed } };
}

async function crawlFiles(origin) {
  const result = { robots: null, sitemap: null };
  try {
    const { res } = await safeFetch(new URL("/robots.txt", origin));
    if (res.ok) {
      const { text } = await readCapped(res);
      result.robots = { found: true, blocksAll: /^\s*disallow:\s*\/\s*$/im.test(text) && /user-agent:\s*\*/i.test(text) };
      const sm = text.match(/^\s*sitemap:\s*(\S+)/im);
      if (sm) result.sitemap = { found: true, url: sm[1] };
    } else {
      result.robots = { found: false };
    }
  } catch {
    result.robots = { found: false };
  }
  if (!result.sitemap) {
    try {
      const { res } = await safeFetch(new URL("/sitemap.xml", origin));
      result.sitemap = { found: res.ok, url: res.ok ? new URL("/sitemap.xml", origin).href : null };
      await res.body?.cancel();
    } catch {
      result.sitemap = { found: false };
    }
  }
  return result;
}

/** Google PageSpeed Insights (mobile). Returns null when unavailable — never fails the audit. */
async function pageSpeed(url) {
  const q = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (process.env.PAGESPEED_API_KEY) q.set("key", process.env.PAGESPEED_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, {
      signal: AbortSignal.timeout(PSI_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lh = data.lighthouseResult;
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

const STATUS_POINTS = { pass: 1, warn: 0.5, fail: 0 };

/** Full audit for one URL. Throws AuditError with a user-facing message. */
export async function runWebsiteAudit(input) {
  const url = normalizeAuditUrl(input);
  await assertPublicHost(url);

  const psiPromise = pageSpeed(url.href);

  let page;
  try {
    page = await safeFetch(url);
  } catch (err) {
    if (err instanceof AuditError) throw err;
    throw new AuditError(`Could not open ${url.hostname}. The site may be down or blocking visitors.`);
  }
  const { res, url: finalUrl, redirects, elapsed } = page;
  const type = res.headers.get("content-type") || "";
  if (!/html/i.test(type)) {
    await res.body?.cancel();
    throw new AuditError("That URL is not a web page (no HTML returned).");
  }
  const { text: html, bytes } = await readCapped(res);

  const { checks, stats } = analyzeHtml({ html, finalUrl, res, elapsed, bytes, redirects });

  const [files, speed] = await Promise.all([crawlFiles(finalUrl.origin), psiPromise]);

  checks.push(
    !files.robots?.found
      ? check("Technical", "robots", "robots.txt", "warn", "Not found", "Add a robots.txt that points Google to your sitemap.")
      : files.robots.blocksAll
        ? check("Technical", "robots", "robots.txt", "fail", "Blocks all crawlers", "robots.txt has “Disallow: /” — Google cannot crawl the site.")
        : check("Technical", "robots", "robots.txt", "pass", "Found")
  );
  checks.push(
    files.sitemap?.found
      ? check("Technical", "sitemap", "XML sitemap", "pass", files.sitemap.url)
      : check("Technical", "sitemap", "XML sitemap", "warn", "Not found", "Create sitemap.xml and submit it in Google Search Console.")
  );

  if (speed) {
    checks.push(
      speed.score >= 90
        ? check("Performance", "psi", "Mobile speed score", "pass", `${speed.score} / 100`)
        : speed.score >= 50
          ? check("Performance", "psi", "Mobile speed score", "warn", `${speed.score} / 100`, "Compress images, defer heavy scripts and use caching.")
          : check("Performance", "psi", "Mobile speed score", "fail", `${speed.score} / 100`, "The site is slow on phones. Compress images, remove unused scripts and use a CDN.")
    );
  }

  const score = Math.round(
    (checks.reduce((sum, c) => sum + STATUS_POINTS[c.status], 0) / checks.length) * 100
  );

  return {
    url: url.href,
    finalUrl: finalUrl.href,
    auditedAt: new Date().toISOString(),
    score,
    summary: {
      pass: checks.filter((c) => c.status === "pass").length,
      warn: checks.filter((c) => c.status === "warn").length,
      fail: checks.filter((c) => c.status === "fail").length,
    },
    stats,
    speed,
    checks,
  };
}
