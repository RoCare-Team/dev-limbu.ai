/**
 * Turns one HTML document into the plain facts the audit checks need.
 * Regex-based on purpose: enough for these signals, no parser dependency.
 */

export const decode = (s) =>
  String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();

const stripTags = (html) => decode(String(html).replace(/<[^>]+>/g, " "));

export function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

const hasAttr = (tag, name) => new RegExp(`\\s${name}(\\s|=|>|/)`, "i").test(tag);
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];

function inner(html, name) {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "gi");
  return [...html.matchAll(re)].map((m) => stripTags(m[1]));
}

function meta(head, key) {
  const tag = tags(head, "meta").find(
    (t) => (attr(t, "name") || attr(t, "property") || "").toLowerCase() === key
  );
  return tag ? attr(tag, "content") : null;
}

function absolute(href, base) {
  try {
    return new URL(href, base);
  } catch {
    return null;
  }
}

/** Schema.org @type values from every JSON-LD block (nested @graph included). */
function schemaTypes(html) {
  const types = new Set();
  let invalid = 0;
  const blocks = html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const t = node["@type"];
    (Array.isArray(t) ? t : t ? [t] : []).forEach((x) => types.add(String(x)));
    if (node["@graph"]) walk(node["@graph"]);
  };
  let count = 0;
  for (const m of blocks) {
    count++;
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      invalid++;
    }
  }
  return { count, invalid, types: [...types] };
}

/** All page facts used by checks.js. */
export function extractPage(html, pageUrl) {
  const head = html.match(/<head\b[\s\S]*?<\/head>/i)?.[0] || "";
  const body = html.match(/<body\b[\s\S]*<\/body>/i)?.[0] || html;
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || "";
  const visible = stripTags(body.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " "));
  const words = visible ? visible.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;

  // Headings in document order, e.g. [1, 2, 2, 4]
  const headingLevels = [...body.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));

  const images = tags(body, "img").map((t) => ({
    src: attr(t, "src") || attr(t, "data-src") || "",
    alt: attr(t, "alt"),
    hasSize: hasAttr(t, "width") && hasAttr(t, "height"),
    lazy: (attr(t, "loading") || "").toLowerCase() === "lazy",
  }));

  const links = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attrs, text]) => {
    const tag = `<a ${attrs}>`;
    const href = attr(tag, "href") || "";
    const abs = /^(mailto:|tel:|javascript:|#|data:)/i.test(href) ? null : absolute(href, pageUrl);
    return {
      href,
      abs: abs && /^https?:$/.test(abs.protocol) ? abs : null,
      text: stripTags(text) || attr(tag, "aria-label") || attr(tag, "title") || "",
      hasImageAlt: /<img\b[^>]*\salt\s*=\s*["'][^"']+["']/i.test(text),
      nofollow: /nofollow/i.test(attr(tag, "rel") || ""),
    };
  });
  const httpLinks = links.filter((l) => l.abs);
  const internalLinks = httpLinks.filter((l) => l.abs.hostname === pageUrl.hostname);
  const externalLinks = httpLinks.filter((l) => l.abs.hostname !== pageUrl.hostname);

  const linkTags = tags(head, "link");
  const relIs = (t, rel) => (attr(t, "rel") || "").toLowerCase().split(/\s+/).includes(rel);

  const scripts = tags(html, "script")
    .filter((t) => attr(t, "src"))
    .map((t) => ({
      src: attr(t, "src"),
      blocking: !hasAttr(t, "async") && !hasAttr(t, "defer") && (attr(t, "type") || "") !== "module",
      inHead: head.includes(t),
    }));
  const stylesheets = linkTags.filter((t) => relIs(t, "stylesheet")).map((t) => attr(t, "href"));

  // http:// sub-resources on an https page (mixed content)
  const resourceUrls = [
    ...images.map((i) => i.src),
    ...scripts.map((s) => s.src),
    ...stylesheets,
    ...tags(body, "iframe").map((t) => attr(t, "src")),
  ].filter(Boolean);
  const mixedContent = pageUrl.protocol === "https:" ? resourceUrls.filter((u) => /^http:\/\//i.test(u)) : [];

  // Form fields without a label / aria-label / title
  const labelFor = new Set(tags(body, "label").map((t) => attr(t, "for")).filter(Boolean));
  const unlabeledInputs = [...tags(body, "input"), ...tags(body, "select"), ...tags(body, "textarea")].filter((t) => {
    const type = (attr(t, "type") || "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) return false;
    const id = attr(t, "id");
    return !(id && labelFor.has(id)) && !attr(t, "aria-label") && !attr(t, "aria-labelledby") && !attr(t, "title") && !attr(t, "placeholder");
  }).length;

  const inlineStyleBytes = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].reduce((n, m) => n + m[1].length, 0);
  const inlineScriptBytes = [...html.matchAll(/<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].reduce((n, m) => n + m[1].length, 0);

  const canonicalTag = linkTags.find((t) => relIs(t, "canonical"));

  return {
    doctype: /^\s*<!doctype html/i.test(html),
    lang: attr(htmlTag, "lang"),
    charset: /<meta[^>]+charset\s*=/i.test(head),
    title: inner(head, "title")[0] || "",
    description: meta(head, "description") || "",
    robotsMeta: (meta(head, "robots") || "").toLowerCase(),
    viewport: meta(head, "viewport") || "",
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    hreflang: linkTags.filter((t) => relIs(t, "alternate") && attr(t, "hreflang")).length,
    favicon: linkTags.some((t) => /icon/i.test(attr(t, "rel") || "")),
    og: {
      title: meta(head, "og:title"),
      description: meta(head, "og:description"),
      image: meta(head, "og:image"),
    },
    twitterCard: meta(head, "twitter:card"),
    h1s: inner(body, "h1").filter(Boolean),
    headingLevels,
    words,
    text: visible,
    images,
    links,
    internalLinks,
    externalLinks,
    emptyLinks: links.filter((l) => !l.text && !l.hasImageAlt).length,
    scripts,
    stylesheets,
    mixedContent,
    unlabeledInputs,
    iframes: tags(body, "iframe").length,
    deprecatedTags: (html.match(/<(font|center|marquee|blink|frameset)\b/gi) || []).length,
    inlineStyleBytes,
    inlineScriptBytes,
    schema: schemaTypes(html),
    telLinks: links.filter((l) => /^tel:/i.test(l.href)).length,
    whatsappLinks: links.filter((l) => /wa\.me|whatsapp\.com/i.test(l.href)).length,
    mapsLink: /google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(html),
    // Indian / international phone numbers in the visible text
    phoneInText: /(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/.test(visible),
  };
}
