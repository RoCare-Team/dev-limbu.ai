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

export const toYmd = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  return { year: x.getFullYear(), month: x.getMonth() + 1, day: x.getDate() };
};

export const ymdFromApi = (d) => {
  if (!d || d.year == null) return null;
  return { year: d.year, month: d.month, day: d.day };
};

export const compareYmd = (a, b) => {
  if (!a || !b) return 0;
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
};

export const isYmdInClosedRange = (ymd, startYmd, endYmd) =>
  compareYmd(ymd, startYmd) >= 0 && compareYmd(ymd, endYmd) <= 0;

export const addCalendarDays = (date, delta) => {
  const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  x.setDate(x.getDate() + delta);
  return x;
};

/**
 * For report window [reportStart, reportEnd] (inclusive calendar days), returns:
 * - fetchStart..reportEnd for one Google API call (includes prior period of equal length)
 * - prevStart..prevEnd for comparison KPIs
 */
export const getPerformanceInsightsWindows = (reportStartInput, reportEndInput) => {
  const rs = reportStartInput instanceof Date ? reportStartInput : new Date(reportStartInput);
  const re = reportEndInput instanceof Date ? reportEndInput : new Date(reportEndInput);
  const reportStart = new Date(rs.getFullYear(), rs.getMonth(), rs.getDate());
  const reportEnd = new Date(re.getFullYear(), re.getMonth(), re.getDate());
  if (isNaN(reportStart.getTime()) || isNaN(reportEnd.getTime())) {
    const t = new Date();
    return {
      fetchStart: t,
      reportStart: t,
      reportEnd: t,
      prevStart: t,
      prevEnd: t,
      inclusiveDays: 1,
    };
  }
  if (reportEnd < reportStart) {
    return {
      fetchStart: reportStart,
      reportStart,
      reportEnd: reportStart,
      prevStart: reportStart,
      prevEnd: reportStart,
      inclusiveDays: 1,
    };
  }
  const inclusiveDays = Math.round((reportEnd - reportStart) / 86400000) + 1;
  const prevEnd = addCalendarDays(reportStart, -1);
  const prevStart = addCalendarDays(prevEnd, -(inclusiveDays - 1));
  return {
    fetchStart: prevStart,
    reportStart,
    reportEnd,
    prevStart,
    prevEnd,
    inclusiveDays,
  };
};

export const getMetricByType = (insightsData, type) => {
  if (!insightsData?.multiDailyMetricTimeSeries) return null;
  const root = insightsData.multiDailyMetricTimeSeries;
  if (root[0]?.dailyMetricTimeSeries) {
    return root[0].dailyMetricTimeSeries.find((m) => m.dailyMetric === type) || null;
  }
  return root.find((m) => m.dailyMetric === type) || null;
};

const parseDatedValue = (item) => {
  const value = typeof item.value === "string" ? parseInt(item.value, 10) : item.value || 0;
  return isNaN(value) ? 0 : value;
};

/**
 * True if at least one daily point exists in the closed YMD range (for "no prior data" UX).
 */
export const metricHasObservationsInRange = (insightsData, type, startYmd, endYmd) => {
  if (!startYmd || !endYmd) return false;
  const metric = getMetricByType(insightsData, type);
  const rows = metric?.timeSeries?.datedValues;
  if (!rows?.length) return false;
  return rows.some((item) => {
    const ymd = ymdFromApi(item.date);
    return ymd && isYmdInClosedRange(ymd, startYmd, endYmd);
  });
};

/**
 * Sum a metric type for daily points inside [rangeStart, rangeEnd] inclusive (local calendar dates).
 */
export const calculateMetricsInRange = (insightsData, rangeStart, rangeEnd) => {
  const startYmd = toYmd(rangeStart);
  const endYmd = toYmd(rangeEnd);
  if (!insightsData?.multiDailyMetricTimeSeries || !startYmd || !endYmd) {
    return {
      totalDirections: 0,
      totalCalls: 0,
      totalWebsiteClicks: 0,
      totalMapsImpressions: 0,
      totalSearchImpressions: 0,
      totalImpressions: 0,
    };
  }

  const sumType = (type) => {
    const metric = getMetricByType(insightsData, type);
    const rows = metric?.timeSeries?.datedValues;
    if (!rows?.length) return 0;
    return rows.reduce((sum, item) => {
      const ymd = ymdFromApi(item.date);
      if (!ymd || !isYmdInClosedRange(ymd, startYmd, endYmd)) return sum;
      return sum + parseDatedValue(item);
    }, 0);
  };

  const totalMapsImpressions = sumType("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const totalSearchImpressions = sumType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH");

  return {
    totalDirections: sumType("BUSINESS_DIRECTION_REQUESTS"),
    totalCalls: sumType("CALL_CLICKS"),
    totalWebsiteClicks: sumType("WEBSITE_CLICKS"),
    totalMapsImpressions,
    totalSearchImpressions,
    totalImpressions: totalMapsImpressions + totalSearchImpressions,
  };
};

/**
 * Calculate metrics from insights data (entire series returned by API — use calculateMetricsInRange when the response spans multiple logical periods).
 */
export const calculateMetrics = (insightsData) => {
  const metric = (type) => getMetricByType(insightsData, type);
  const calculateTotal = (metricData) => {
    if (!metricData?.timeSeries?.datedValues) return 0;
    return metricData.timeSeries.datedValues.reduce((sum, item) => sum + parseDatedValue(item), 0);
  };

  const totalMapsImpressions = calculateTotal(metric("BUSINESS_IMPRESSIONS_MOBILE_MAPS"));
  const totalSearchImpressions = calculateTotal(metric("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"));

  return {
    totalDirections: calculateTotal(metric("BUSINESS_DIRECTION_REQUESTS")),
    totalCalls: calculateTotal(metric("CALL_CLICKS")),
    totalWebsiteClicks: calculateTotal(metric("WEBSITE_CLICKS")),
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
