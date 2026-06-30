/**
 * Google Business Profile — structured Food Menu (v4) helpers.
 *
 * The food menu (sections of dishes with name / description / price) is NOT a
 * Business Information attribute — it lives in the legacy v4 surface and is only
 * available to eligible locations (metadata.canHaveFoodMenus === true). We expose a
 * SIMPLE UI model (sections[] -> items[] with { name, description, price, currency })
 * and convert to/from Google's nested FoodMenus structure.
 *
 * @see https://developers.google.com/my-business/reference/rest/v4/FoodMenus
 * @see https://developers.google.com/my-business/content/update-food-menus
 */

const GMB_V4_BASE = 'https://mybusiness.googleapis.com/v4';

async function v4Fetch(url, accessToken, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

/** GET the location's current food menus (raw Google structure). */
export async function getFoodMenus(accessToken, accountId, locationId) {
  const url = `${GMB_V4_BASE}/accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(
    locationId
  )}/foodMenus`;
  return v4Fetch(url, accessToken);
}

/** PATCH the location's food menus (raw Google structure). */
export async function updateFoodMenus(accessToken, accountId, locationId, body) {
  const url = `${GMB_V4_BASE}/accounts/${encodeURIComponent(accountId)}/locations/${encodeURIComponent(
    locationId
  )}/foodMenus?updateMask=menus`;
  return v4Fetch(url, accessToken, { method: 'PATCH', body: JSON.stringify(body) });
}

// ─── Conversions ──────────────────────────────────────────────────────────────

// Google money: { currencyCode, units (string|number), nanos } -> decimal number.
function moneyToNumber(price) {
  if (!price) return null;
  const units = Number(price.units || 0);
  const nanos = Number(price.nanos || 0);
  const val = units + nanos / 1e9;
  return Number.isFinite(val) ? val : null;
}

// decimal number -> Google money. nanos = fractional part * 1e9.
function numberToMoney(amount, currencyCode = 'INR') {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return null;
  const units = Math.floor(n);
  const nanos = Math.round((n - units) * 1e9);
  return { currencyCode, units: String(units), nanos };
}

const firstLabel = (labels) => {
  if (Array.isArray(labels)) return labels[0] || {};
  if (labels && typeof labels === 'object') return labels;
  return {};
};

/**
 * Flatten Google's FoodMenus to a simple UI model:
 * { currency, sections: [{ name, items: [{ name, description, price }] }] }
 * Only the first menu is edited (most SMBs have one).
 */
export function normalizeFoodMenus(data) {
  const menu = Array.isArray(data?.menus) ? data.menus[0] : null;
  let currency = 'INR';
  const sections = [];
  if (menu && Array.isArray(menu.sections)) {
    for (const sec of menu.sections) {
      const secLabel = firstLabel(sec.labels);
      const items = Array.isArray(sec.items)
        ? sec.items.map((it) => {
            const itLabel = firstLabel(it.labels);
            const price = it.attributes?.price;
            if (price?.currencyCode) currency = price.currencyCode;
            const amount = moneyToNumber(price);
            return {
              name: String(itLabel.displayName || '').trim(),
              description: String(itLabel.description || '').trim(),
              price: amount != null ? String(amount) : '',
            };
          })
        : [];
      sections.push({ name: String(secLabel.displayName || '').trim(), items });
    }
  }
  return { currency, sections };
}

/**
 * Build Google's FoodMenus PATCH body from the simple UI model.
 * Each item must carry a name and a price (Google requirement).
 */
export function buildFoodMenusBody(uiModel, { languageCode = 'en' } = {}) {
  const currency = uiModel?.currency || 'INR';
  const sections = Array.isArray(uiModel?.sections) ? uiModel.sections : [];

  const gSections = sections
    .map((sec) => {
      const items = (Array.isArray(sec.items) ? sec.items : [])
        .map((it) => {
          const name = String(it?.name || '').trim();
          if (!name) return null;
          const money = numberToMoney(it?.price, currency);
          const label = { displayName: name.slice(0, 140), languageCode };
          const desc = String(it?.description || '').trim();
          if (desc) label.description = desc.slice(0, 1000);
          const item = { labels: label };
          // Google requires a price on each item; default to 0 when not provided.
          item.attributes = { price: money || { currencyCode: currency, units: '0', nanos: 0 } };
          return item;
        })
        .filter(Boolean);
      const secName = String(sec?.name || '').trim();
      if (!secName || items.length === 0) return null;
      return { labels: { displayName: secName.slice(0, 140), languageCode }, items };
    })
    .filter(Boolean);

  return {
    menus: [
      {
        labels: { displayName: 'Menu', languageCode },
        sections: gSections,
      },
    ],
  };
}
