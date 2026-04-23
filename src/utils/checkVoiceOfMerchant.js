export async function checkVoiceOfMerchant(accessToken, locationName) {
    try {
        const res = await fetch(
            `https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!res.ok) {
            return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
        }

        const data = await res.json();
        return data;
    } catch (err) {
        return { hasVoiceOfMerchant: false, hasBusinessAuthority: false };
    }
}