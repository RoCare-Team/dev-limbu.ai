export async function fetchLocationInsights(
  accessToken,
  locationId,
  startDate,
  endDate,
) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📡 GMB API CALL — fetchLocationInsights");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 accessToken:", accessToken ? `${accessToken.slice(0, 20)}...` : "❌ MISSING");
  console.log("📍 locationId:", locationId ?? "❌ MISSING");
  console.log("📅 startDate:", startDate instanceof Date ? startDate.toDateString() : `❌ NOT A DATE → ${startDate}`);
  console.log("📅 endDate  :", endDate instanceof Date ? endDate.toDateString() : `❌ NOT A DATE → ${endDate}`);

  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

    console.log("🔗 Full URL:\n", url);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("📶 Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ GMB API Error:", errText);
      throw new Error(`Failed to fetch insights: ${errText}`);
    }

    const data = await res.json();

    console.log("✅ GMB Raw Response:", JSON.stringify(data, null, 2));

    const series = data?.multiDailyMetricTimeSeries;

    if (!series || series.length === 0) {
      console.warn("⚠️ multiDailyMetricTimeSeries is EMPTY or missing");
    } else {
      const metricList = series[0]?.dailyMetricTimeSeries ?? series;
      console.log(`📊 Total metrics returned: ${metricList.length}`);
      metricList.forEach((m) => {
        const values = m?.timeSeries?.datedValues ?? [];
        const total = values.reduce((sum, v) => sum + (parseInt(v.value) || 0), 0);
        console.log(`  • ${m.dailyMetric} | Total: ${total} | Days: ${values.length}`);
      });
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return data;
  } catch (err) {
    console.error("❌ Fetch Insights Error:", err);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw err;
  }
}