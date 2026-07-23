/**
 * Browser se insights lene ka naya raasta.
 *
 * Pehle client `fetchLocationInsights(session.accessToken, …)` karke seedha
 * Google ko call karta tha. Ab access token server par hi rehta hai, isliye
 * hum apne `/api/gmb/location-insights` proxy se maangte hain.
 */
import { ensureAppSessionCookie } from "@/lib/clientSession";

export async function fetchInsightsViaServer({
  locationId,
  startDate,
  endDate,
  startMonth,
  endMonth,
}) {
  const params = new URLSearchParams({
    locationId: String(locationId),
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
  });

  if (startMonth && endMonth) {
    params.set("startMonthYear", String(startMonth.year));
    params.set("startMonth", String(startMonth.month));
    params.set("endMonthYear", String(endMonth.year));
    params.set("endMonth", String(endMonth.month));
  }

  await ensureAppSessionCookie();

  const res = await fetch(`/api/gmb/location-insights?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Insights failed: ${res.status}`);
    // Sirf GMB_RECONNECT_REQUIRED par caller reconnect prompt dikhata hai;
    // 503 (transient) aur 401 (app session) par nahi.
    err.code = body.code;
    err.status = res.status;
    throw err;
  }

  return res.json(); // { insights, searchKeywords }
}
