export async function fetchLocationInsights(
    accessToken,
    locationId,
    startDate,
    endDate,
) {
    try {
        const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to fetch insights: ${errText}`);
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Fetch Insights Error:", err);
        throw err;
    }
}