/**
 * Save performance insights data to the database
 */
export const savePerformanceInsights = async (insightsData) => {
  try {
    const response = await fetch("/api/performance-insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(insightsData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save insights");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving performance insights:", error);
    throw error;
  }
};

/**
 * Fetch saved performance insights
 */
export const fetchPerformanceInsights = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.locationId) queryParams.append("locationId", params.locationId);
    if (params.reportMonth) queryParams.append("reportMonth", params.reportMonth);
    if (params.reportYear) queryParams.append("reportYear", params.reportYear);

    const response = await fetch(
      `/api/performance-insights?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch insights");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching performance insights:", error);
    throw error;
  }
};

/**
 * Calculate metrics from insights data
 */
export const calculateMetrics = (insightsData) => {
  const getMetricByType = (type) => {
    if (!insightsData || !insightsData.multiDailyMetricTimeSeries) return null;

    if (insightsData.multiDailyMetricTimeSeries[0]?.dailyMetricTimeSeries) {
      const series = insightsData.multiDailyMetricTimeSeries[0].dailyMetricTimeSeries.find(
        (m) => m.dailyMetric === type
      );
      return series;
    } else {
      return insightsData.multiDailyMetricTimeSeries.find((m) => m.dailyMetric === type);
    }
  };

  const calculateTotal = (metricData) => {
    if (!metricData || !metricData.timeSeries || !metricData.timeSeries.datedValues) {
      return 0;
    }
    return metricData.timeSeries.datedValues.reduce((sum, item) => {
      const value = typeof item.value === "string" ? parseInt(item.value, 10) : item.value || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  const directions = getMetricByType("BUSINESS_DIRECTION_REQUESTS");
  const calls = getMetricByType("CALL_CLICKS");
  const website = getMetricByType("WEBSITE_CLICKS");
  const maps = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const search = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");

  const totalDirections = calculateTotal(directions);
  const totalCalls = calculateTotal(calls);
  const totalWebsiteClicks = calculateTotal(website);
  const totalMapsImpressions = calculateTotal(maps);
  const totalSearchImpressions = calculateTotal(search);

  return {
    totalDirections,
    totalCalls,
    totalWebsiteClicks,
    totalMapsImpressions,
    totalSearchImpressions,
    totalImpressions: totalMapsImpressions + totalSearchImpressions,
  };
};

/**
 * Format date to Month Year string
 */
export const formatReportDateString = (date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return { month, year, formatted: `${month} ${year}` };
};

/**
 * Get month and year from date range
 */
export const getReportPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.getMonth();
  const startYear = start.getFullYear();
  const endMonth = end.getMonth();
  const endYear = end.getFullYear();

  // Check if it spans multiple months
  if (startYear === endYear && startMonth === endMonth) {
    const dateStr = formatReportDateString(start);
    return {
      month: dateStr.month,
      year: dateStr.year,
      displayString: dateStr.formatted,
      isMultiMonth: false,
    };
  } else {
    const startDateStr = formatReportDateString(start);
    const endDateStr = formatReportDateString(end);
    return {
      month: `${startDateStr.month}-${endDateStr.month}`,
      year: endYear,
      displayString: `${startDateStr.formatted} to ${endDateStr.formatted}`,
      isMultiMonth: true,
    };
  }
};
