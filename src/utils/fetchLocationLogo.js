export async function fetchLocationLogo(accessToken, locationName) {
    try {
        const res = await fetch(
            `https://mybusiness.googleapis.com/v4/${locationName}/media`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!res.ok) {
            console.log("Media fetch failed:", res.status, res.statusText);
            return null;
        }

        const data = await res.json();
        // console.log(`[DEBUG] Media items for ${locationName}:`, data);

        if (data.mediaItems && data.mediaItems.length > 0) {
            const item =
                data.mediaItems.find(
                    (i) => i.locationAssociation?.category === "LOGO",
                ) ||
                data.mediaItems.find(
                    (i) => i.locationAssociation?.category === "PROFILE",
                ) ||
                data.mediaItems[0];

            //  console.log(`[DEBUG] Selected media item for ${locationName}:`, item);
            return item?.thumbnailUrl || item?.googleUrl || null;
        }
        return null;
    } catch (err) {
        return null;
    }
}