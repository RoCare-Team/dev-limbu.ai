/**
 * Every audit check, grouped by category. Each returns
 *   { category, id, label, status: pass|warn|fail, value, fix?, why, severity }
 * severity (critical > high > medium > low) weights the score and sorts the fix list.
 */

export const CATEGORIES = ["SEO", "Technical", "Performance", "Security", "Mobile & Accessibility", "Social & Local"];

const c = (category) => (id, label, severity, why) => ({
  pass: (value) => ({ category, id, label, severity, why, status: "pass", value }),
  warn: (value, fix) => ({ category, id, label, severity, why, status: "warn", value, fix }),
  fail: (value, fix) => ({ category, id, label, severity, why, status: "fail", value, fix }),
});

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

function seoChecks({ page, finalUrl }) {
  const k = c("SEO");
  const out = [];

  const title = k("title", "Title tag", "critical", "The title is the blue link Google shows in results.");
  out.push(
    !page.title
      ? title.fail("Missing", "Add a <title> of 30–60 characters with your main service and city.")
      : page.title.length < 30 || page.title.length > 60
        ? title.warn(`${page.title.length} chars: “${page.title}”`, "Keep the title between 30 and 60 characters so it is not cut off.")
        : title.pass(`${page.title.length} chars: “${page.title}”`)
  );

  const desc = k("description", "Meta description", "high", "The grey text under your link; a good one gets more clicks.");
  out.push(
    !page.description
      ? desc.fail("Missing", "Add a 70–160 character meta description that sells the page.")
      : page.description.length < 70 || page.description.length > 160
        ? desc.warn(`${page.description.length} chars`, "Keep the meta description between 70 and 160 characters.")
        : desc.pass(`${page.description.length} chars`)
  );

  const h1 = k("h1", "H1 heading", "high", "The H1 tells Google and visitors what the page is about.");
  out.push(
    page.h1s.length === 1
      ? h1.pass(`“${page.h1s[0].slice(0, 80)}”`)
      : page.h1s.length === 0
        ? h1.fail("No H1 found", "Add one H1 with the page's main topic.")
        : h1.warn(`${page.h1s.length} H1 tags`, "Use a single H1 per page; turn the others into H2s.")
  );

  const levels = page.headingLevels;
  const skipped = levels.some((lvl, i) => i > 0 && lvl > levels[i - 1] + 1);
  const hier = k("headings", "Heading structure", "medium", "Ordered headings (H1 → H2 → H3) help Google read the page.");
  out.push(
    !levels.length
      ? hier.fail("No headings", "Break content into sections with H2/H3 headings.")
      : skipped
        ? hier.warn(`${levels.length} headings, some levels skipped`, "Don't jump levels, e.g. from H2 straight to H4.")
        : hier.pass(`${levels.length} headings in order`)
  );

  const words = k("content", "Content length", "medium", "Thin pages rarely rank for competitive searches.");
  out.push(
    page.words >= 300
      ? words.pass(`${page.words} words`)
      : words.warn(`${page.words} words`, "Add at least 300 words of useful content: services, area, FAQs.")
  );

  // Main title words should appear in the H1 / body
  const titleWords = page.title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3);
  const body = page.text.toLowerCase();
  const used = titleWords.filter((w) => body.includes(w));
  const kw = k("keywords", "Keyword consistency", "medium", "Words in the title should also appear on the page.");
  out.push(
    !titleWords.length
      ? kw.warn("No title keywords to compare", "Put your main keywords in the title and content.")
      : used.length / titleWords.length >= 0.6
        ? kw.pass(`${used.length}/${titleWords.length} title words used on the page`)
        : kw.warn(`${used.length}/${titleWords.length} title words used on the page`, "Use the title's main words in the H1 and body text.")
  );

  const noAlt = page.images.filter((i) => !(i.alt || "").trim()).length;
  const alt = k("alt", "Image alt text", "medium", "Alt text lets Google understand images and helps screen readers.");
  out.push(
    !page.images.length
      ? alt.warn("No images found", "Add real photos of your business with descriptive alt text.")
      : noAlt === 0
        ? alt.pass(`All ${page.images.length} images have alt text`)
        : (noAlt / page.images.length > 0.5 ? alt.fail : alt.warn)(`${noAlt} of ${page.images.length} missing`, "Describe every image in its alt attribute.")
  );

  const canon = k("canonical", "Canonical URL", "medium", "Tells Google which URL is the main version of the page.");
  let canonUrl = null;
  try {
    canonUrl = page.canonical ? new URL(page.canonical, finalUrl) : null;
  } catch {
    /* invalid */
  }
  out.push(
    !page.canonical
      ? canon.warn("Missing", 'Add <link rel="canonical" href="…"> pointing to this page.')
      : !canonUrl
        ? canon.fail("Invalid URL", "Fix the canonical href; it must be a full, valid URL.")
        : canonUrl.hostname.replace(/^www\./, "") !== finalUrl.hostname.replace(/^www\./, "")
          ? canon.warn(`Points to ${canonUrl.hostname}`, "Canonical points to another domain; make sure that is intended.")
          : canon.pass(canonUrl.href)
  );

  const url = k("url", "URL structure", "low", "Short, readable URLs are easier to share and rank.");
  const path = finalUrl.pathname + finalUrl.search;
  out.push(
    path.length > 100 || /_/.test(finalUrl.pathname) || /[A-Z]/.test(finalUrl.pathname)
      ? url.warn(path, "Use short, lowercase URLs with hyphens instead of underscores.")
      : url.pass(path || "/")
  );

  return out;
}

function technicalChecks(ctx) {
  const { page, res, finalUrl, redirects, robots, sitemap, httpRedirect, soft404, brokenLinks, checkedLinks } = ctx;
  const k = c("Technical");
  const out = [];

  const status = k("status", "HTTP status", "critical", "Pages must return 200 to be indexed.");
  out.push(res.status === 200 ? status.pass("200 OK") : status.fail(`HTTP ${res.status}`, "Fix the server error so the page returns 200."));

  const robotsHeader = (res.headers.get("x-robots-tag") || "").toLowerCase();
  const idx = k("indexable", "Allowed in Google", "critical", "noindex hides the page from Google completely.");
  out.push(
    page.robotsMeta.includes("noindex") || robotsHeader.includes("noindex")
      ? idx.fail("Set to noindex", "Remove the noindex robots tag/header so Google can show the page.")
      : idx.pass("Indexable")
  );

  const rob = k("robots", "robots.txt", "high", "robots.txt guides crawlers and points them to your sitemap.");
  out.push(
    !robots
      ? rob.warn("Not found", "Add /robots.txt with a Sitemap: line.")
      : /user-agent:\s*\*[\s\S]*?^\s*disallow:\s*\/\s*$/im.test(robots.text)
        ? rob.fail("Blocks all crawlers", "robots.txt has “Disallow: /”; Google cannot crawl the site.")
        : rob.pass("Found")
  );

  const sm = k("sitemap", "XML sitemap", "high", "A sitemap helps Google find all your pages.");
  out.push(sitemap ? sm.pass(sitemap.url) : sm.warn("Not found", "Create sitemap.xml and submit it in Google Search Console."));

  const redir = k("http-redirect", "HTTP → HTTPS redirect", "high", "Visitors typing http:// should land on the secure site.");
  out.push(
    httpRedirect === null
      ? redir.pass("Not checked (site not reachable on http)")
      : httpRedirect
        ? redir.pass("http:// redirects to https://")
        : redir.fail("http:// does not redirect", "Redirect all http:// traffic to https:// with a 301.")
  );

  const chain = k("redirects", "Redirect chain", "medium", "Each redirect adds delay before the page loads.");
  out.push(
    redirects.length <= 1
      ? chain.pass(redirects.length ? "1 redirect" : "No redirects")
      : chain.warn(`${redirects.length} redirects`, "Link straight to the final URL to avoid redirect chains.")
  );

  const nf = k("soft-404", "404 page", "medium", "Missing pages must return 404, not 200, or Google indexes junk.");
  out.push(
    soft404 === null
      ? nf.pass("Not checked")
      : soft404 === 404 || soft404 === 410
        ? nf.pass(`Missing pages return ${soft404}`)
        : nf.warn(`Missing pages return ${soft404}`, "Make unknown URLs return a real 404 status with a helpful page.")
  );

  const broken = k("broken-links", "Broken links", "high", "Broken links waste crawl budget and frustrate visitors.");
  out.push(
    !checkedLinks
      ? broken.pass("No links to check")
      : brokenLinks.length
        ? broken.fail(`${brokenLinks.length} of ${checkedLinks} checked links broken`, `Fix or remove: ${brokenLinks.slice(0, 3).map((l) => `${l.url} (${l.status || "no response"})`).join(", ")}`)
        : broken.pass(`${checkedLinks} links checked, all working`)
  );

  const doc = k("doctype", "Doctype & charset", "low", "Lets browsers render the page in standards mode with the right encoding.");
  out.push(
    page.doctype && page.charset
      ? doc.pass("<!DOCTYPE html> and charset set")
      : doc.warn([!page.doctype && "doctype missing", !page.charset && "charset missing"].filter(Boolean).join(", "), 'Start with <!DOCTYPE html> and add <meta charset="utf-8">.')
  );

  const lang = k("lang", "Language attribute", "low", "Tells Google and screen readers the page language.");
  out.push(page.lang ? lang.pass(page.lang) : lang.warn("Missing", 'Add lang="en" (or your language) to the <html> tag.'));

  const schema = k("schema", "Structured data", "medium", "Schema markup can earn rich results like stars and FAQs.");
  out.push(
    !page.schema.count
      ? schema.warn("None found", "Add JSON-LD schema (LocalBusiness, Organization, FAQ).")
      : page.schema.invalid
        ? schema.fail(`${page.schema.invalid} invalid JSON-LD block(s)`, "Fix the JSON syntax in your structured data.")
        : schema.pass(page.schema.types.join(", ") || `${page.schema.count} block(s)`)
  );

  const old = k("deprecated", "Deprecated HTML", "low", "Old tags like <font> and <center> signal an outdated site.");
  out.push(page.deprecatedTags ? old.warn(`${page.deprecatedTags} deprecated tag(s)`, "Replace <font>, <center> and similar tags with CSS.") : old.pass("None"));

  return out;
}

function performanceChecks({ page, res, elapsed, bytes, speed }) {
  const k = c("Performance");
  const out = [];

  if (speed) {
    const psi = k("psi", "Mobile speed score", "critical", "Google's PageSpeed score; slow sites lose visitors and rankings.");
    out.push(
      speed.score >= 90
        ? psi.pass(`${speed.score}/100`)
        : (speed.score >= 50 ? psi.warn : psi.fail)(`${speed.score}/100 · LCP ${speed.lcp || "?"} · CLS ${speed.cls || "?"}`, "Compress images, defer heavy scripts and use caching/CDN.")
    );
  }

  const ttfb = k("ttfb", "Server response time", "high", "How fast the server starts sending the page.");
  out.push(
    elapsed < 800 ? ttfb.pass(`${elapsed} ms`) : (elapsed < 2000 ? ttfb.warn : ttfb.fail)(`${elapsed} ms`, "Aim for under 0.8 s with caching, a CDN or better hosting.")
  );

  const size = k("html-size", "HTML size", "medium", "Large HTML takes longer to download on mobile data.");
  out.push(bytes < 500 * 1024 ? size.pass(kb(bytes)) : (bytes < 1500 * 1024 ? size.warn : size.fail)(kb(bytes), "Reduce inline code and page bloat; keep HTML under 500 KB."));

  const enc = (res.headers.get("content-encoding") || "").toLowerCase();
  const comp = k("compression", "Text compression", "high", "gzip/Brotli shrinks pages by up to 70%.");
  out.push(/gzip|br|zstd|deflate/.test(enc) ? comp.pass(enc) : comp.fail("Not compressed", "Enable gzip or Brotli on the server."));

  const cache = k("caching", "Browser caching", "medium", "Caching makes repeat visits load instantly.");
  const cc = res.headers.get("cache-control") || "";
  out.push(cc || res.headers.get("etag") || res.headers.get("last-modified") ? cache.pass(cc || "ETag / Last-Modified set") : cache.warn("No cache headers", "Set Cache-Control (and long caching for static files)."));

  const blocking = page.scripts.filter((s) => s.blocking && s.inHead).length;
  const rb = k("render-blocking", "Render-blocking scripts", "medium", "Scripts in <head> without async/defer delay the first paint.");
  out.push(blocking ? rb.warn(`${blocking} blocking script(s) in <head>`, "Add defer or async to scripts, or move them to the end of <body>.") : rb.pass("None"));

  const requests = page.scripts.length + page.stylesheets.length;
  const req = k("requests", "Scripts & stylesheets", "low", "Every file is another request before the page is ready.");
  out.push(requests <= 25 ? req.pass(`${page.scripts.length} scripts, ${page.stylesheets.length} stylesheets`) : req.warn(`${requests} files`, "Bundle or remove unused scripts and stylesheets."));

  const noSize = page.images.filter((i) => !i.hasSize).length;
  const dims = k("image-dimensions", "Image dimensions", "medium", "Images without width/height make the layout jump (CLS).");
  out.push(!page.images.length || noSize === 0 ? dims.pass(page.images.length ? "All images sized" : "No images") : dims.warn(`${noSize} of ${page.images.length} without width/height`, "Set width and height on images to stop layout shifts."));

  const lazy = k("lazy-loading", "Lazy-loaded images", "low", "Loading off-screen images later speeds up the first view.");
  out.push(page.images.length <= 3 || page.images.some((i) => i.lazy) ? lazy.pass(page.images.length <= 3 ? "Few images" : "Lazy loading used") : lazy.warn("Not used", 'Add loading="lazy" to images below the fold.'));

  const modern = page.images.filter((i) => /\.(webp|avif)(\?|$)/i.test(i.src)).length;
  const fmt = k("image-format", "Modern image formats", "low", "WebP/AVIF are 25–50% smaller than JPEG/PNG.");
  out.push(!page.images.length || modern ? fmt.pass(page.images.length ? `${modern} WebP/AVIF images` : "No images") : fmt.warn("Only JPEG/PNG", "Serve images as WebP or AVIF."));

  const inline = page.inlineStyleBytes + page.inlineScriptBytes;
  const inl = k("inline-code", "Inline CSS/JS", "low", "Large inline code is re-downloaded on every page.");
  out.push(inline < 100 * 1024 ? inl.pass(kb(inline)) : inl.warn(kb(inline), "Move large inline CSS/JS into cached external files."));

  return out;
}

function securityChecks({ res, finalUrl, page, cert }) {
  const k = c("Security");
  const out = [];
  const h = (name) => res.headers.get(name);

  const https = k("https", "HTTPS", "critical", "Browsers mark http sites “Not secure” and Google prefers https.");
  out.push(finalUrl.protocol === "https:" ? https.pass("Secure connection") : https.fail("Not secure (http)", "Install an SSL certificate and serve the site on https."));

  const ssl = k("ssl", "SSL certificate", "critical", "An expired or invalid certificate blocks visitors with a warning.");
  out.push(
    finalUrl.protocol !== "https:" || !cert
      ? ssl.warn(finalUrl.protocol === "https:" ? "Could not read certificate" : "No certificate", "Make sure a valid SSL certificate is installed.")
      : !cert.valid
        ? ssl.fail("Certificate not trusted", "Install a valid certificate from a trusted authority (e.g. Let's Encrypt).")
        : cert.daysLeft < 14
          ? ssl.fail(`Expires in ${cert.daysLeft} days`, "Renew the SSL certificate now and enable auto-renewal.")
          : cert.daysLeft < 30
            ? ssl.warn(`Expires in ${cert.daysLeft} days`, "Renew the SSL certificate soon and enable auto-renewal.")
            : ssl.pass(`Valid, ${cert.daysLeft} days left${cert.issuer ? ` · ${cert.issuer}` : ""}`)
  );

  const mixed = k("mixed-content", "Mixed content", "high", "http files on an https page break the padlock and may be blocked.");
  out.push(page.mixedContent.length ? mixed.fail(`${page.mixedContent.length} http resource(s)`, `Load these over https: ${page.mixedContent.slice(0, 2).join(", ")}`) : mixed.pass("None"));

  const hsts = k("hsts", "HSTS header", "medium", "Forces browsers to always use https.");
  out.push(h("strict-transport-security") ? hsts.pass("Enabled") : hsts.warn("Missing", "Add Strict-Transport-Security: max-age=31536000; includeSubDomains."));

  const nosniff = k("nosniff", "X-Content-Type-Options", "low", "Stops browsers guessing file types (a common attack trick).");
  out.push((h("x-content-type-options") || "").toLowerCase() === "nosniff" ? nosniff.pass("nosniff") : nosniff.warn("Missing", "Add X-Content-Type-Options: nosniff."));

  const csp = h("content-security-policy") || "";
  const frame = k("clickjacking", "Clickjacking protection", "medium", "Stops other sites from embedding yours to trick users.");
  out.push(h("x-frame-options") || /frame-ancestors/i.test(csp) ? frame.pass(h("x-frame-options") || "CSP frame-ancestors") : frame.warn("Missing", "Add X-Frame-Options: SAMEORIGIN or CSP frame-ancestors."));

  const cspCheck = k("csp", "Content-Security-Policy", "low", "Limits which scripts can run, reducing XSS risk.");
  out.push(csp ? cspCheck.pass("Set") : cspCheck.warn("Missing", "Add a Content-Security-Policy header."));

  const ref = k("referrer", "Referrer-Policy", "low", "Controls what URL data is shared with other sites.");
  out.push(h("referrer-policy") ? ref.pass(h("referrer-policy")) : ref.warn("Missing", "Add Referrer-Policy: strict-origin-when-cross-origin."));

  const server = (h("x-powered-by") || "") + (/\d/.test(h("server") || "") ? ` ${h("server")}` : "");
  const leak = k("server-info", "Server version hidden", "low", "Showing software versions helps attackers target known bugs.");
  out.push(server.trim() ? leak.warn(server.trim(), "Hide X-Powered-By and server version headers.") : leak.pass("Hidden"));

  return out;
}

function mobileChecks({ page }) {
  const k = c("Mobile & Accessibility");
  const out = [];

  const vp = k("viewport", "Mobile viewport", "critical", "Without it the site shows tiny desktop text on phones.");
  out.push(/width\s*=\s*device-width/i.test(page.viewport) ? vp.pass(page.viewport) : vp.fail("Missing", 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'));

  const zoom = k("zoom", "Zoom allowed", "medium", "Blocking zoom makes text unreadable for many users.");
  out.push(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(page.viewport) ? zoom.warn("Zoom disabled", "Remove user-scalable=no / maximum-scale=1 from the viewport.") : zoom.pass("Allowed"));

  const empty = k("link-text", "Links have text", "medium", "Empty links are invisible to screen readers and Google.");
  out.push(page.emptyLinks ? empty.warn(`${page.emptyLinks} link(s) without text`, "Give icon links visible text or an aria-label.") : empty.pass("All links have text"));

  const labels = k("form-labels", "Form labels", "medium", "Unlabelled fields are hard to fill on phones and with screen readers.");
  out.push(page.unlabeledInputs ? labels.warn(`${page.unlabeledInputs} field(s) without a label`, "Add a <label> or aria-label to every form field.") : labels.pass("All fields labelled"));

  const fav = k("favicon", "Favicon", "low", "Your logo in browser tabs and mobile search results.");
  out.push(page.favicon ? fav.pass("Found") : fav.warn("Missing", "Add a favicon (and an apple-touch-icon)."));

  return out;
}

function socialLocalChecks({ page }) {
  const k = c("Social & Local");
  const out = [];
  const types = page.schema.types.map((t) => t.toLowerCase());

  const og = k("open-graph", "Open Graph tags", "medium", "Controls the preview when your link is shared on WhatsApp/Facebook.");
  const ogMissing = ["title", "description", "image"].filter((f) => !page.og[f]);
  out.push(!ogMissing.length ? og.pass("og:title, og:description, og:image") : (ogMissing.length === 3 ? og.fail : og.warn)(`Missing og:${ogMissing.join(", og:")}`, "Add og:title, og:description and og:image tags."));

  const tw = k("twitter-card", "Twitter card", "low", "Rich previews on X/Twitter.");
  out.push(page.twitterCard ? tw.pass(page.twitterCard) : tw.warn("Missing", 'Add <meta name="twitter:card" content="summary_large_image">.'));

  const local = k("local-schema", "LocalBusiness schema", "high", "Helps Google show your address, hours and reviews in local results.");
  const localTypes = ["localbusiness", "organization", "store", "restaurant", "medicalbusiness", "dentist", "professionalservice", "homeandconstructionbusiness", "autorepair", "beautysalon", "healthandbeautybusiness"];
  out.push(types.some((t) => localTypes.includes(t)) ? local.pass(page.schema.types.join(", ")) : local.warn("Not found", "Add LocalBusiness schema with name, address, phone and opening hours."));

  const phone = k("phone", "Clickable phone number", "high", "Mobile visitors should be able to call you in one tap.");
  out.push(page.telLinks ? phone.pass(`${page.telLinks} tel: link(s)`) : page.phoneInText ? phone.warn("Number shown but not clickable", 'Wrap the number in <a href="tel:+91…">.') : phone.fail("No phone number found", "Show your phone number with a tel: link."));

  const wa = k("whatsapp", "WhatsApp contact", "low", "Most Indian customers prefer to enquire on WhatsApp.");
  out.push(page.whatsappLinks ? wa.pass("WhatsApp link found") : wa.warn("Not found", "Add a WhatsApp chat button (wa.me link)."));

  const maps = k("maps", "Google Maps link", "medium", "A map or directions link builds trust and sends visitors to your store.");
  out.push(page.mapsLink ? maps.pass("Found") : maps.warn("Not found", "Embed Google Maps or link to your Google Business Profile."));

  return out;
}

export function runChecks(ctx) {
  return [
    ...seoChecks(ctx),
    ...technicalChecks(ctx),
    ...performanceChecks(ctx),
    ...securityChecks(ctx),
    ...mobileChecks(ctx),
    ...socialLocalChecks(ctx),
  ];
}
