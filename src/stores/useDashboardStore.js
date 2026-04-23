import { create } from "zustand";
import { toast } from "react-hot-toast";

// --- API Helpers (Logic kept identical to your original code) ---
async function fetchGMBAccounts(accessToken) {
  const res = await fetch("https://mybusinessbusinessinformation.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
  const data = await res.json();
  return data.accounts || [];
}

async function fetchAllLocationsByAccount(accessToken, accountId) {
  let allLocations = [];
  let pageToken = null;
  do {
    let url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,openInfo,metadata&pageSize=100`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Failed to fetch locations`);
    const data = await res.json();
    if (data.locations) allLocations = [...allLocations, ...data.locations];
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return allLocations;
}

async function checkVoiceOfMerchant(accessToken, locationName) {
  try {
    const res = await fetch(`https://mybusinessverifications.googleapis.com/v1/${locationName}/VoiceOfMerchantState`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.ok ? await res.json() : { hasVoiceOfMerchant: false };
  } catch { return { hasVoiceOfMerchant: false }; }
}

async function fetchLocationLogo(accessToken, locationName) {
  try {
    const res = await fetch(`https://mybusiness.googleapis.com/v4/${locationName}/media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.mediaItems?.length > 0) {
      const item = data.mediaItems.find(i => i.locationAssociation?.category === 'LOGO')
        || data.mediaItems.find(i => i.locationAssociation?.category === 'PROFILE')
        || data.mediaItems[0];
      return item?.thumbnailUrl || item?.googleUrl || null;
    }
    return null;
  } catch { return null; }
}

export const useDashboardStore = create((set, get) => ({
  // --- STATE ---
  accounts: [],
  listings: [],
  loading: false,
  initialFetchDone: false,
  noAccountsFound: false,
  filterStatus: "all",
  cacheStatus: "",
  isSessionExpired: false,
  isConnectModalOpen: false,
  summary: { total: 0, verified: 0, unverified: 0, pending: 0 },

  // Social
  facebookPages: [],
  instagramPages: [],

  // Performance Insights
  showPerformanceInsightsModal: false,
  performanceInsightsData: null,
  performanceInsightsLoading: false,
  selectedPerformanceLocation: null,
  performanceSearchKeywords: null,
  performanceInsightsDateRange: {
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  },

  // --- ACTIONS ---
  setFilterStatus: (status) => set({ filterStatus: status }),
  setIsConnectModalOpen: (isOpen) => set({ isConnectModalOpen: isOpen }),
  setShowPerformanceInsightsModal: (val) => set({ showPerformanceInsightsModal: val }),

  // GMB Data Fetching
  fetchInitialData: async (accessToken, userEmail, forceRefresh = false) => {
    if (!accessToken || !userEmail) {
      set({ isSessionExpired: true });
      return;
    }

    const cacheKey = `gmb_data_${userEmail}`;
    if (!forceRefresh) {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey));
      if (cached && (Date.now() - cached.timestamp < 600000)) { // 10 min cache
        set({ accounts: cached.accounts, initialFetchDone: true, cacheStatus: "Loaded from cache" });
        get().calculateSummary(cached.accounts, []);
        return;
      }
    }

    set({ loading: true, cacheStatus: "Fetching from Google..." });

    try {
      const accountsData = await fetchGMBAccounts(accessToken);
      if (accountsData.length === 0) {
        set({ accounts: [], noAccountsFound: true, loading: false, initialFetchDone: true });
        return;
      }

      const listingsPromises = accountsData.map(async (account) => {
        const accountId = account.name.replace("accounts/", "");
        const locations = await fetchAllLocationsByAccount(accessToken, accountId);
        return await Promise.all((locations || []).map(async (loc) => {
          const vomStatus = await checkVoiceOfMerchant(accessToken, loc.name);
          const logoUrl = await fetchLocationLogo(accessToken, `accounts/${accountId}/${loc.name}`);
          return {
            ...loc,
            accountId,
            accountName: account.accountName || account.name,
            hasVoiceOfMerchant: vomStatus.hasVoiceOfMerchant,
            logoUrl,
          };
        }));
      });

      const allListings = (await Promise.all(listingsPromises)).flat();
      const newAccounts = [{ email: userEmail, listings: allListings }];

      set({ accounts: newAccounts, noAccountsFound: allListings.length === 0, loading: false, initialFetchDone: true });
      get().calculateSummary(newAccounts, []);

      // Cache & Sync
      sessionStorage.setItem(cacheKey, JSON.stringify({ accounts: newAccounts, timestamp: Date.now() }));
      await fetch('/api/admin/saveBussiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, listings: allListings }),
      });

    } catch (err) {
      console.error(err);
      set({ loading: false });
      if (err.message.includes("401")) set({ isSessionExpired: true });
    }
  },

  // Fetch admin-saved listings
  fetchAdminListings: async () => {
    try {
      const token = localStorage.getItem("isImpersonating") === "true"
        ? localStorage.getItem("userToken")
        : localStorage.getItem("adminToken");
      if (!token) return;

      const res = await fetch("/api/admin/saveBussiness", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      set({ listings: data.listings || [] });
      get().calculateSummary(get().accounts, data.listings || []);
    } catch (err) { console.error(err); }
  },

  calculateSummary: (accounts, adminListings) => {
    const combined = [...(accounts[0]?.listings || []), ...adminListings];
    const total = combined.length;
    const verified = combined.filter(l => l.hasVoiceOfMerchant === true).length;
    const unverified = combined.filter(l => l.hasVoiceOfMerchant === false).length;

    set({ summary: { total, verified, unverified, pending: 0 } });

    const locationDetails = combined.map(item => ({
      locationId: item.name?.split("/")[1],
      accountId: item.accountId,
      title: item.title,
      isVerified: item.hasVoiceOfMerchant === true,
      businessProfileId: item.name,
      websiteUri: item.websiteUri,
      storefrontAddress: item.storefrontAddress,
      metadata: item.metadata
    }));
    localStorage.setItem("locationDetails", JSON.stringify(locationDetails));
  },

  // Performance Logic
  handleViewPerformanceInsights: async (listing, accessToken, startDate, endDate) => {
    const locationId = listing.name.split("/")[1];
    set({
      showPerformanceInsightsModal: true,
      performanceInsightsLoading: true,
      selectedPerformanceLocation: {
        name: listing.title,
        id: locationId,
        businessProfileId: listing.name,
        city: listing.storefrontAddress?.locality || "",
        locality: listing.storefrontAddress?.administrativeArea || "",
      }
    });

    try {
      const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}&dailyMetrics=BUSINESS_DIRECTION_REQUESTS&dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetrics=BUSINESS_IMPRESSIONS_MOBILE_SEARCH`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      set({ performanceInsightsData: data, performanceInsightsLoading: false });
    } catch (error) {
      set({ performanceInsightsLoading: false });
      toast.error("Failed to load insights");
    }
  },

  // Socials
  fetchFacebookPages: async (userId) => {
    const res = await fetch(`/api/facebook/pages?userId=${userId}`);
    const data = await res.json();
    if (data.success) set({ facebookPages: data.pages });
  },

  fetchInstagramPages: async (userId) => {
    const res = await fetch(`/api/instagram/pages?userId=${userId}`);
    const data = await res.json();
    if (data.success) set({ instagramPages: data.pages });
  }
}));