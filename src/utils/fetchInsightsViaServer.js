/**
 * Browser se insights lene ka naya raasta.
 *
 * Pehle client `fetchLocationInsights(session.accessToken, …)` karke seedha
 * Google ko call karta tha. Ab access token server par hi rehta hai, isliye
 * hum apne `/api/gmb/location-insights` proxy se maangte hain.
 */
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

  const res = await fetch(`/api/gmb/location-insights?${params.toString()}`, {
    cache: "no-store",
  });

  if (res.status === 409) {
    // GMB connected nahi / token invalid — caller reconnect prompt dikhaye.
    const err = new Error("GmbReconnectRequired");
    err.code = "GMB_NOT_CONNECTED";
    throw err;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Insights failed: ${res.status}`);
  }

  return res.json(); // { insights, searchKeywords }
}
