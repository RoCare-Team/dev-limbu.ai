import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FETCH_TIMEOUT = 15000;
const MAX_SITEMAPS = 50; // sitemap index se kitni child sitemaps tak jayenge
const MAX_URLS = 50000;

/* ----------------- HELPERS ----------------- */

function normalizeInput(input) {
  let value = String(input || "").trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SitemapBot/1.0)",
        Accept: "application/xml,text/xml,text/plain,*/*",
      },
    });
    if (!res.ok) return { ok: false, status: res.status, text: "" };
    return { ok: true, status: res.status, text: await res.text() };
  } catch (error) {
    return { ok: false, status: 0, text: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// <url>/<sitemap> blocks se loc + metadata nikalta hai
function parseSitemap(xml) {
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const blockRegex = /<(url|sitemap)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const entries = [];
  let match;

  while ((match = blockRegex.exec(xml)) !== null) {
    const block = match[2];
    const loc = block.match(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/i);
    if (!loc) continue;
    entries.push({
      loc: decodeEntities(loc[1].trim()),
      lastmod: (block.match(/<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i) || [])[1]?.trim() || null,
      changefreq: (block.match(/<changefreq>\s*([\s\S]*?)\s*<\/changefreq>/i) || [])[1]?.trim() || null,
      priority: (block.match(/<priority>\s*([\s\S]*?)\s*<\/priority>/i) || [])[1]?.trim() || null,
    });
  }

  // fallback: bare <loc> tags (malformed sitemaps)
  if (entries.length === 0) {
    const locRegex = /<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/gi;
    while ((match = locRegex.exec(xml)) !== null) {
      entries.push({ loc: decodeEntities(match[1].trim()), lastmod: null, changefreq: null, priority: null });
    }
  }

  return { isIndex, entries };
}

// robots.txt se sitemap URLs + common fallback paths
async function discoverSitemaps(startUrl) {
  const origin = new URL(startUrl).origin;
  const found = [];

  const robots = await fetchText(`${origin}/robots.txt`);
  if (robots.ok) {
    for (const line of robots.text.split(/\r?\n/)) {
      const m = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
      if (m) found.push(m[1].trim());
    }
  }

  if (found.length === 0) {
    for (const path of ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/sitemap1.xml"]) {
      const res = await fetchText(`${origin}${path}`);
      if (res.ok && /<(urlset|sitemapindex)[\s>]/i.test(res.text)) {
        found.push(`${origin}${path}`);
        break;
      }
    }
  }

  return [...new Set(found)];
}

/* ----------------- CORE ----------------- */

async function collectPages(seedSitemaps) {
  const queue = [...seedSitemaps];
  const visited = new Set();
  const sitemaps = [];
  const pages = [];
  const seenPages = new Set();
  const errors = [];

  while (queue.length > 0 && visited.size < MAX_SITEMAPS && pages.length < MAX_URLS) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const res = await fetchText(current);
    if (!res.ok) {
      errors.push({ sitemap: current, status: res.status, message: res.error || "Fetch failed" });
      continue;
    }

    const { isIndex, entries } = parseSitemap(res.text);
    sitemaps.push({ url: current, type: isIndex ? "index" : "urlset", entries: entries.length });

    for (const entry of entries) {
      // kuch sites index ko galti se <urlset> me likhti hain — .xml loc ko sitemap hi maano
      const pointsToSitemap = isIndex || /\.xml(\.gz)?(\?|$)/i.test(entry.loc);

      if (pointsToSitemap) {
        if (!visited.has(entry.loc)) queue.push(entry.loc);
      } else if (!seenPages.has(entry.loc)) {
        seenPages.add(entry.loc);
        pages.push({ ...entry, url: entry.loc, sitemap: current });
        if (pages.length >= MAX_URLS) break;
      }
    }
  }

  return { sitemaps, pages, errors, truncated: queue.length > 0 || pages.length >= MAX_URLS };
}

/* ----------------- CLASSIFICATION ----------------- */

const BASE_MIN_CHILDREN = 20; // itne city-variants ho tabhi slug ko "base service" maanenge

function pathSegments(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean);
  } catch {
    return [];
  }
}

// har section (services / bussiness / ...) ke liye base slugs detect karta hai.
// e.g. "google-bussiness-profile-management" base hai, uske aage "-mumbai" city hai.
function detectBaseSlugs(slugs) {
  const prefixCount = new Map();

  for (const slug of slugs) {
    const parts = slug.split("-");
    for (let i = 1; i < parts.length; i++) {
      const prefix = parts.slice(0, i).join("-");
      prefixCount.set(prefix, (prefixCount.get(prefix) || 0) + 1);
    }
  }

  const candidates = [...prefixCount.entries()]
    .filter(([, count]) => count >= BASE_MIN_CHILDREN)
    .map(([prefix]) => prefix);

  // sirf maximal prefixes rakho — "google-bussiness" hata do jab
  // "google-bussiness-profile-management" bhi candidate ho
  return candidates
    .filter((b) => !candidates.some((o) => o !== b && o.startsWith(`${b}-`)))
    .sort((a, b) => b.length - a.length);
}

// suffix pattern: "bakery-marketing-software", "salon-marketing-software"
// -> common suffix "marketing-software", variable part "bakery"
function detectBaseSuffixes(slugs) {
  const suffixCount = new Map();

  for (const slug of slugs) {
    const parts = slug.split("-");
    for (let i = 1; i < parts.length; i++) {
      const suffix = parts.slice(i).join("-");
      suffixCount.set(suffix, (suffixCount.get(suffix) || 0) + 1);
    }
  }

  const candidates = [...suffixCount.entries()]
    .filter(([, count]) => count >= BASE_MIN_CHILDREN)
    .map(([suffix]) => suffix);

  return candidates
    .filter((s) => !candidates.some((o) => o !== s && o.endsWith(`-${s}`)))
    .sort((a, b) => b.length - a.length);
}

const ROOT = "root"; // "/bakery-marketing-software" jaise top-level pages

// har page ka section (folder) aur slug (aakhri segment)
function sectionAndSlug(url) {
  const seg = pathSegments(url);
  if (seg.length === 0) return { section: "home", slug: null };
  if (seg.length === 1) return { section: ROOT, slug: seg[0] };
  if (seg.length === 2) return { section: seg[0], slug: seg[1] };
  return { section: seg[0], slug: null };
}

function classifyPages(pages) {
  // section-wise slugs jama karo
  const slugsBySection = new Map();
  for (const page of pages) {
    const { section, slug } = sectionAndSlug(page.url);
    if (!slug) continue;
    if (!slugsBySection.has(section)) slugsBySection.set(section, new Set());
    slugsBySection.get(section).add(slug);
  }

  const patternsBySection = new Map();
  for (const [section, slugs] of slugsBySection) {
    const list = [...slugs];
    patternsBySection.set(section, {
      prefixes: detectBaseSlugs(list),
      suffixes: detectBaseSuffixes(list),
    });
  }

  return pages.map((page) => {
    const { section, slug } = sectionAndSlug(page.url);
    const { prefixes = [], suffixes = [] } = patternsBySection.get(section) || {};

    let type = section === "home" ? "home" : slug ? "static" : "other";
    let base = null;
    let variant = null;

    // pehle prefix pattern (service-city), warna suffix pattern (industry-service)
    const prefix = slug ? prefixes.find((b) => slug === b || slug.startsWith(`${b}-`)) : null;
    const suffix = slug ? suffixes.find((s) => slug === s || slug.endsWith(`-${s}`)) : null;

    if (prefix) {
      base = prefix;
      if (slug === prefix) type = "base";
      else {
        type = "city";
        variant = slug.slice(prefix.length + 1);
      }
    } else if (suffix) {
      base = suffix;
      if (slug === suffix) type = "base";
      else {
        type = "variant";
        variant = slug.slice(0, slug.length - suffix.length - 1);
      }
    }

    return { ...page, section, slug, type, base, variant, city: type === "city" ? variant : null };
  });
}

const TYPE_KINDS = ["city", "variant", "base", "static", "home", "other"];

// ?type=city / ?type=services / ?type=services:city / ?type=marketing-software ...
// ?base=local-seo   -> ek hi service/pattern ke pages
// ?variant=bakery   -> ek hi city/industry ke pages
function filterPages(classified, type, base, variant) {
  let result = classified;

  const value = String(type || "").trim().toLowerCase();
  if (value && value !== "all") {
    const [left, right] = value.split(":");
    result = result.filter((page) => {
      const section = page.section.toLowerCase();
      if (right) return section === left && page.type === right;
      if (TYPE_KINDS.includes(left)) return page.type === left;
      // section name ya base slug, dono chalte hain
      return section === left || (page.base || "").toLowerCase() === left;
    });
  }

  const wantedBase = String(base || "").trim().toLowerCase();
  if (wantedBase) result = result.filter((p) => (p.base || "").toLowerCase() === wantedBase);

  const wantedVariant = String(variant || "").trim().toLowerCase();
  if (wantedVariant) result = result.filter((p) => (p.variant || "").toLowerCase() === wantedVariant);

  return result;
}

async function handle(input, type, base, variant) {
  const target = normalizeInput(input);
  if (!target) {
    return NextResponse.json(
      { error: true, message: "Valid `url` (website ya sitemap URL) required hai" },
      { status: 400 }
    );
  }

  const isDirectSitemap = /\.xml(\?|$)/i.test(target) || /sitemap/i.test(new URL(target).pathname);
  const seeds = isDirectSitemap ? [target] : await discoverSitemaps(target);

  if (seeds.length === 0) {
    return NextResponse.json(
      { error: true, message: "Is site par koi sitemap nahi mila (robots.txt aur common paths check kiye)", url: target },
      { status: 404 }
    );
  }

  const { pages } = await collectPages(seeds);
  const classified = classifyPages(pages);

  // type/base/variant diya ho to sirf usi ki URI list
  if (type || base || variant) {
    const selected = filterPages(classified, type, base, variant);
    return NextResponse.json({
      error: false,
      ...(type ? { type } : {}),
      ...(base ? { base } : {}),
      ...(variant ? { variant } : {}),
      total: selected.length,
      urls: selected.map((p) => p.url),
    });
  }

  // warna har base-service alag key me
  const groups = {};
  for (const page of classified) {
    const key = page.base || page.section;
    (groups[key] ||= []).push(page.url);
  }

  return NextResponse.json({
    error: false,
    total: pages.length,
    groups,
  });
}

/* ----------------- API ----------------- */

// GET /api/sitemap-pages?url=example.com
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    return await handle(
      searchParams.get("url") || searchParams.get("domain"),
      searchParams.get("type") || searchParams.get("section"),
      searchParams.get("base") || searchParams.get("service"),
      searchParams.get("variant") || searchParams.get("city")
    );
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}

// POST { "url": "example.com" }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    return await handle(
      body.url || body.domain || body.sitemap,
      body.type || body.section,
      body.base || body.service,
      body.variant || body.city
    );
  } catch (error) {
    return NextResponse.json({ error: true, message: error.message }, { status: 500 });
  }
}
