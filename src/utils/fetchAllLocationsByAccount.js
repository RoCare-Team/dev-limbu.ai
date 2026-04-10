export async function fetchAllLocationsByAccount(accessToken, accountId) {
  try {
    let allLocations = [];
    let pageToken = null;

    do {
      let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok)
        throw new Error(
          `Failed to fetch locations for account ${accountId}: ${res.status}`,
        );

      const data = await res.json();
      console.log("Fetch Locations Response:", data);

      if (data.locations && data.locations.length > 0) {
        allLocations = [...allLocations, ...data.locations];
      }

      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allLocations;
  } catch (err) {
    console.error(`Error fetching locations for account ${accountId}:`, err);
    throw err;
  }
}