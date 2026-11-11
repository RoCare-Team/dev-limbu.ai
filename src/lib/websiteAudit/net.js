/**
 * Network side of the website audit: URL safety (public hosts only), fetch with
 * manual redirects, capped body reads, TLS certificate and link checks.
 * Server-only.
 */
import dns from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";

const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 5;
export const UA =
  "Mozilla/5.0 (compatible; LimbuAuditBot/1.0; +https://limbu.ai/seo-tools/website-audit)";

export class AuditError extends Error {}

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
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
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
  if (!url.hostname.includes(".")) throw new AuditError("Please enter a full domain, e.g. example.com");
  url.hash = "";
  return url;
}

// Checked on every request (no cache), so a host cannot switch to a private IP later.
export async function assertPublicHost(url) {
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
export async function safeFetch(startUrl, { method = "GET", timeout = FETCH_TIMEOUT_MS } = {}) {
  let url = new URL(startUrl);
  const redirects = [];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    const started = Date.now();
    const res = await fetch(url, {
      method,
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
      signal: AbortSignal.timeout(timeout),
    });
    const elapsed = Date.now() - started;
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      redirects.push({ from: url.href, status: res.status });
      await res.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    return { res, url, redirects, elapsed };
  }
  throw new AuditError("The website redirects too many times.");
}

export async function readCapped(res) {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return { text: Buffer.concat(chunks).toString("utf8"), bytes: size };
}

/** GET a small text file (robots.txt, sitemap); null when missing. */
export async function fetchText(url) {
  try {
    const { res, url: finalUrl } = await safeFetch(url, { timeout: 8000 });
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    const { text } = await readCapped(res);
    return { text, url: finalUrl.href, type: res.headers.get("content-type") || "" };
  } catch {
    return null;
  }
}

/** Days until the site's TLS certificate expires, plus issuer. null when not reachable. */
export function tlsCertificate(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false, timeout: 8000 },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();
        if (!cert?.valid_to) return resolve(null);
        const daysLeft = Math.floor((new Date(cert.valid_to) - Date.now()) / 86400000);
        resolve({ daysLeft, issuer: cert.issuer?.O || cert.issuer?.CN || "", valid: authorized });
      }
    );
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Status of up to `limit` links (HEAD, falling back to GET), 5 at a time.
 * Returns [{ url, status }] where status 0 = could not connect.
 */
export async function checkLinks(urls, limit = 20) {
  const list = [...new Set(urls)].slice(0, limit);
  const results = [];
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const url = list[next++];
      let status = 0;
      try {
        let { res } = await safeFetch(url, { method: "HEAD", timeout: 8000 });
        if (res.status === 405 || res.status === 403) {
          ({ res } = await safeFetch(url, { timeout: 8000 }));
          await res.body?.cancel();
        }
        status = res.status;
      } catch {
        status = 0;
      }
      results.push({ url, status });
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  return results;
}
