import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LIMBUBOT_HISTORY_BASE =
  process.env.LIMBUBOT_HISTORY_BASE ||
  "https://whatsapp.limbu.ai/api/external/contact";

const WHATSAPP_EXTERNAL_API_KEY =
  process.env.WHATSAPP_EXTERNAL_API_KEY ||
  process.env.LIMBUBOT_ADMIN_API_KEY ||
  process.env.LIMBUBOT_ADMIN_TOKEN ||
  "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade";

const FRANCHISE_WHATSAPP_API_KEY =
  process.env.FRANCHISE_WHATSAPP_API_KEY ||
  "ws_fca30eb07595f51089b57a862ecac20c12947558b56f1a70";

/** Upstream has no bulk endpoint, so fan out — but never all at once. */
const CONCURRENCY = 16;
const MAX_PHONES = 100;

/**
 * Upstream takes ~3s per contact, so a 50-row page costs real time. Cache
 * briefly: paging back and forth, or two admins on the same list, then costs
 * nothing. Short TTL keeps the badge close to live.
 */
const CACHE_TTL_MS = 60_000;
const countCache = new Map();

function readCache(key) {
  const hit = countCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    countCache.delete(key);
    return null;
  }
  return hit.count;
}

function writeCache(key, count) {
  // Bound the map so a long-lived process cannot grow it without limit.
  if (countCache.size > 5000) countCache.clear();
  countCache.set(key, { count, at: Date.now() });
}

function normalizePhoneE164(value) {
  let digits = String(value || "")
    .replace(/^wa_/i, "")
    .replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

async function fetchCount(phone, apiKey) {
  try {
    const url = new URL(LIMBUBOT_HISTORY_BASE);
    url.searchParams.set("phone", phone);

    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "X-API-Key": apiKey },
      cache: "no-store",
    });

    if (!upstream.ok) return 0;

    const data = await upstream.json().catch(() => ({}));

    if (Array.isArray(data?.history)) return data.history.length;
    if (Array.isArray(data?.messages)) return data.messages.length;
    return 0;
  } catch {
    // A single unreachable contact must not fail the whole batch.
    return 0;
  }
}

/** Run tasks with a fixed number of workers. */
async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * POST { phones: ["9876543210", ...], source?: "franchise" }
 * → { counts: { "919876543210": 12, ... } }
 *
 * Keyed by the normalised phone so callers can look up with the same
 * normalisation regardless of how the number was stored.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const source = String(body.source || "").trim().toLowerCase();

    const phones = [
      ...new Set(
        (Array.isArray(body.phones) ? body.phones : [])
          .map(normalizePhoneE164)
          .filter(Boolean),
      ),
    ].slice(0, MAX_PHONES);

    if (!phones.length) {
      return NextResponse.json({ success: true, counts: {} });
    }

    const apiKey =
      source === "franchise"
        ? FRANCHISE_WHATSAPP_API_KEY
        : WHATSAPP_EXTERNAL_API_KEY;

    const counts = {};
    const toFetch = [];

    phones.forEach((phone) => {
      const cached = readCache(`${source}:${phone}`);
      if (cached === null) toFetch.push(phone);
      else counts[phone] = cached;
    });

    const values = await mapWithLimit(toFetch, CONCURRENCY, (phone) =>
      fetchCount(phone, apiKey),
    );

    toFetch.forEach((phone, index) => {
      const count = values[index] || 0;
      counts[phone] = count;
      writeCache(`${source}:${phone}`, count);
    });

    return NextResponse.json({
      success: true,
      counts,
      cached: phones.length - toFetch.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch chat counts" },
      { status: 500 },
    );
  }
}
