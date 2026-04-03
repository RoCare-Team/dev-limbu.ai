// Google My Business API helper functions

import { GMB_BUSINESS_INFORMATION_READ_MASK } from '@/lib/gmbLocationDataset'

export async function fetchGoogleAccounts(accessToken) {
  try {
    const accountsRes = await fetch("https://mybusinessbusinessinformation.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (!accountsRes.ok) {
      throw new Error("Failed to fetch Google accounts")
    }
    
    
    

    const accountsData = await accountsRes.json()
    return accountsData.accounts || []
  } catch (error) {
    console.error("Error fetching Google accounts:", error)
    throw error
  }
}

export async function fetchLocationsByAccount(accessToken, accountId) {
  try {
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=${encodeURIComponent(GMB_BUSINESS_INFORMATION_READ_MASK)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    if (!locationsRes.ok) {
      throw new Error(`Failed to fetch locations for account ${accountId}`)
    }

    const locData = await locationsRes.json()
    return locData.locations || []
  } catch (error) {
    console.error(`Error fetching locations for account ${accountId}:`, error)
    throw error
  }
}

export async function fetchAllLocations(accessToken, accounts) {
  let allLocations = []

  for (const account of accounts) {
    try {
      const accountId = account.name.replace("accounts/", "")
      const locations = await fetchLocationsByAccount(accessToken, accountId)

      const locationsWithAccount = locations.map((loc) => ({
        ...loc,
        accountId,
        accountName: account.accountName || account.name,
      }))

      allLocations = [...allLocations, ...locationsWithAccount]
    } catch (error) {
      console.error(`Failed to fetch locations for account ${account.name}:`, error)
      // Continue with other accounts even if one fails
    }
  }

  return allLocations
}

export async function fetchLocationInsights(accessToken, locationId, startDate, endDate) {
  try {
    const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

    const insightsRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!insightsRes.ok) {
      const errText = await insightsRes.text();
      throw new Error(`Failed to fetch insights: ${errText}`);
    }

    const insightsData = await insightsRes.json();
    return insightsData;
  } catch (error) {
    console.error(`Error fetching insights for location ${locationId}:`, error);
    throw error;
  }
}

export async function updateLocationInfo(accessToken, locationName, updateData) {
  try {
    const updateRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!updateRes.ok) {
      throw new Error(`Failed to update location ${locationName}`)
    }

    const updatedLocation = await updateRes.json()
    return updatedLocation
  } catch (error) {
    console.error(`Error updating location ${locationName}:`, error)
    throw error
  }
}
