import dbConnect from "@/lib/dbConnect";
import LocalStore from "@/models/LocalStore";
import { cityToSlug } from "@/utils/citySlug";

/**
 * Franchise partners a customer can walk into, shown as "Our Store" on the
 * city pages. Admin manages them at /admin/local-stores; everything here just
 * reads what was saved.
 *
 * A city with no store renders nothing, so adding a partner is one admin form
 * and no code change.
 */

/** Seeded once so Kanpur keeps working before anyone opens the admin page. */
export const DEFAULT_LOCAL_STORES = [
  {
    citySlug: "kanpur",
    cityName: "Kanpur",
    name: "AurenAI",
    address: "G-20, Site-3, Panki, Kanpur, Uttar Pradesh, India",
    whatsapp: "+91 95111 68671",
    phone: "",
    mapUrl: "",
    isActive: true,
    order: 0,
  },
];

/** Writes the defaults the first time the collection is empty. */
export async function seedLocalStoresIfEmpty() {
  if (await LocalStore.estimatedDocumentCount()) return;
  await LocalStore.insertMany(DEFAULT_LOCAL_STORES);
}

/**
 * Active stores for a city, by slug or display name.
 * Returns [] for cities with no partner — and never throws, because a database
 * hiccup must not take a public page down.
 */
export async function getLocalStores(city) {
  const citySlug = cityToSlug(city);
  if (!citySlug) return [];

  try {
    await dbConnect();
    await seedLocalStoresIfEmpty();

    return await LocalStore.find({ citySlug, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  } catch (error) {
    console.error("getLocalStores failed:", error);
    return [];
  }
}

/** Google Maps embed for a store — the saved URL, else built from the address. */
export function getStoreMapEmbedUrl(store) {
  const custom = (store?.mapUrl || "").trim();
  if (custom) return custom;
  if (!store?.address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;
}

/** "Get directions" target, opened in the visitor's own Maps app. */
export function getStoreDirectionsUrl(store) {
  if (!store?.address) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    store.address,
  )}`;
}
