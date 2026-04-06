export async function fetchSearchKeywords(
    accessToken,
    locationId,
    startMonth,
    endMonth,
) {
    try {
        const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startMonth.year}&monthlyRange.start_month.month=${startMonth.month}&monthlyRange.end_month.year=${endMonth.year}&monthlyRange.end_month.month=${endMonth.month}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to fetch search keywords: ${errText}`);
        }

        const data = await res.json();
        return data;
    } catch (err) {
        console.error("Fetch Search Keywords Error:", err);
        throw err;
    }
}