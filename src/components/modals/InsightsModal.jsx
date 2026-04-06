export default function InsightsModal({
  isOpen,
  onClose,
  insights,
  listingTitle,
  loading,
  startDate,
  endDate,
  onDateChange,
  searchKeywords,
  searchKeywordsLoading,
}) {
  if (!isOpen) return null;

  const calculateTotal = (metricData) => {
    if (
      !metricData ||
      !metricData.timeSeries ||
      !metricData.timeSeries.datedValues
    ) {
      return 0;
    }
    return metricData.timeSeries.datedValues.reduce((sum, item) => {
      const value =
        typeof item.value === "string"
          ? parseInt(item.value, 10)
          : item.value || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  const getMetricByType = (type) => {
    if (!insights || !insights.multiDailyMetricTimeSeries) return null;

    if (insights.multiDailyMetricTimeSeries[0]?.dailyMetricTimeSeries) {
      const series =
        insights.multiDailyMetricTimeSeries[0].dailyMetricTimeSeries.find(
          (m) => m.dailyMetric === type,
        );
      return series;
    } else {
      return insights.multiDailyMetricTimeSeries.find(
        (m) => m.dailyMetric === type,
      );
    }
  };

  const directionRequests = getMetricByType("BUSINESS_DIRECTION_REQUESTS");
  const callClicks = getMetricByType("CALL_CLICKS");
  const websiteClicks = getMetricByType("WEBSITE_CLICKS");
  const mapsImpressions = getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const searchImpressions = getMetricByType(
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  );

  const totalDirections = calculateTotal(directionRequests);
  const totalCalls = calculateTotal(callClicks);
  const totalWebsiteClicks = calculateTotal(websiteClicks);
  const totalMapsImpressions = calculateTotal(mapsImpressions);
  const totalSearchImpressions = calculateTotal(searchImpressions);
  const totalImpressions = totalMapsImpressions + totalSearchImpressions;

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getDaysDifference = () => {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const topKeywords = searchKeywords?.searchKeywordsCounts
    ? searchKeywords.searchKeywordsCounts
        .sort((a, b) => {
          const aValue = a.insightsValue?.value || 0;
          const bValue = b.insightsValue?.value || 0;
          return bValue - aValue;
        })
        .slice(0, 10)
    : [];

  const chartData = React.useMemo(() => {
    if (!insights) return [];
    const directions =
      getMetricByType("BUSINESS_DIRECTION_REQUESTS")?.timeSeries?.datedValues ||
      [];
    const calls = getMetricByType("CALL_CLICKS")?.timeSeries?.datedValues || [];
    const website =
      getMetricByType("WEBSITE_CLICKS")?.timeSeries?.datedValues || [];
    const maps =
      getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_MAPS")?.timeSeries
        ?.datedValues || [];
    const search =
      getMetricByType("BUSINESS_IMPRESSIONS_MOBILE_SEARCH")?.timeSeries
        ?.datedValues || [];

    const dataMap = new Map();

    const addData = (series, key) => {
      if (!series) return;
      series.forEach((d) => {
        const dateKey = `${d.date.year}-${d.date.month}-${d.date.day}`;
        if (!dataMap.has(dateKey)) {
          dataMap.set(dateKey, {
            date: new Date(d.date.year, d.date.month - 1, d.date.day),
            displayDate: `${d.date.day}/${d.date.month}`,
          });
        }
        dataMap.get(dateKey)[key] = parseInt(d.value || 0);
      });
    };

    addData(directions, "Directions");
    addData(calls, "Calls");
    addData(website, "Website");
    addData(maps, "Maps");
    addData(search, "Search");

    return Array.from(dataMap.values()).sort((a, b) => a.date - b.date);
  }, [insights]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 animate-fadeIn mt-10 sm:mt-14">
      <div
        id="insights-modal-content"
        className="
      bg-white rounded-2xl shadow-2xl 
      w-full max-w-5xl 
      max-h-[92vh] 
      flex flex-col 
      overflow-hidden
    "
      >
        {/* HEADER */}
        <div
          className="
        bg-gradient-to-r from-yellow-500 to-purple-600 text-white 
        px-4 sm:px-6 py-4 
        flex justify-between items-center 
        rounded-t-2xl 
        shrink-0
      "
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                Performance Insightss
              </h2>
              <p className="text-xs sm:text-sm text-blue-100">{listingTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          id="insights-scroll-container"
          className="p-4 sm:p-6 overflow-y-auto flex-1"
        >
          {/* DATE RANGE */}
          <div
            className="
            bg-gradient-to-br from-blue-50 to-purple-50 
            border-2 border-blue-200 rounded-xl 
            p-4 sm:p-5 mb-6
          "
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Select Date Range
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDate(startDate)}
                  onChange={(e) =>
                    onDateChange(new Date(e.target.value), endDate)
                  }
                  max={formatDate(endDate)}
                  className="
                w-full px-3 py-2 sm:px-4 sm:py-2 
                border-2 border-blue-300 
                rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDate(endDate)}
                  onChange={(e) =>
                    onDateChange(startDate, new Date(e.target.value))
                  }
                  min={formatDate(startDate)}
                  max={formatDate(new Date())}
                  className="
                w-full px-3 py-2 sm:px-4 sm:py-2 
                border-2 border-blue-300 
                rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Showing data for {getDaysDifference()} days</span>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CircularProgress
                size={50}
                thickness={4}
                sx={{ color: "#3b82f6" }}
              />
              <p className="text-gray-600 mt-4 font-semibold">
                Loading insights...
              </p>
            </div>
          ) : insights && insights.multiDailyMetricTimeSeries ? (
            <>
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* TOTAL IMPRESSIONS */}
                <div
                  className="
                bg-gradient-to-br from-purple-50 to-purple-100 
                border-2 border-purple-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-600 p-3 rounded-lg">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-purple-700">
                      {totalImpressions.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Total Impressions
                  </h3>

                  <div className="flex gap-2 text-xs text-gray-600">
                    <span>Maps: {totalMapsImpressions.toLocaleString()}</span>
                    <span>•</span>
                    <span>
                      Search: {totalSearchImpressions.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* WEBSITE CLICKS */}
                <div
                  className="
                bg-gradient-to-br from-blue-50 to-blue-100 
                border-2 border-blue-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <MousePointer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-blue-700">
                      {totalWebsiteClicks.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Website Clicks
                  </h3>

                  <p className="text-xs text-gray-600">
                    Users visited your website
                  </p>
                </div>

                {/* CALL CLICKS */}
                <div
                  className="
                bg-gradient-to-br from-green-50 to-green-100 
                border-2 border-green-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-600 p-3 rounded-lg">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-green-700">
                      {totalCalls.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Call Clicks
                  </h3>

                  <p className="text-xs text-gray-600">Users clicked to call</p>
                </div>

                {/* DIRECTIONS */}
                <div
                  className="
                bg-gradient-to-br from-orange-50 to-orange-100 
                border-2 border-orange-200 rounded-xl 
                p-4 sm:p-5 hover:shadow-lg transition
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-orange-600 p-3 rounded-lg">
                      <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-orange-700">
                      {totalDirections.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Direction Requests
                  </h3>

                  <p className="text-xs text-gray-600">
                    Users requested directions
                  </p>
                </div>
              </div>

              {/* CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Visibility Chart */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    Visibility Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorMaps"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#9333ea"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#9333ea"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorSearch"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            value >= 1000
                              ? `${(value / 1000).toFixed(1)}k`
                              : value
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          itemStyle={{ fontSize: "12px" }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Maps"
                          stroke="#9333ea"
                          fillOpacity={1}
                          fill="url(#colorMaps)"
                          name="Maps Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="Search"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorSearch)"
                          name="Search Views"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engagement Chart */}
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-blue-600" />
                    Engagement Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          itemStyle={{ fontSize: "12px" }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Website"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          name="Website Clicks"
                        />
                        <Line
                          type="monotone"
                          dataKey="Calls"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={false}
                          name="Calls"
                        />
                        <Line
                          type="monotone"
                          dataKey="Directions"
                          stroke="#ea580c"
                          strokeWidth={2}
                          dot={false}
                          name="Directions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ENGAGEMENT SUMMARY */}
              <div
                className="
              bg-gradient-to-br from-indigo-50 to-indigo-100 
              border-2 border-indigo-200 rounded-xl 
              p-4 sm:p-6 mb-6
            "
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  Engagement Summary
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                      {totalImpressions.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Total Views
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                      {totalImpressions > 0
                        ? (
                            ((totalWebsiteClicks +
                              totalCalls +
                              totalDirections) /
                              totalImpressions) *
                            100
                          ).toFixed(2) + "%"
                        : "0%"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Click Rate</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                      {(
                        totalWebsiteClicks +
                        totalCalls +
                        totalDirections
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Total Actions
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                      {getDaysDifference()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Days</div>
                  </div>
                </div>
              </div>

              {/* KEYWORDS */}
              <div
                className="
              bg-gradient-to-br from-cyan-50 to-cyan-100 
              border-2 border-cyan-200 rounded-xl 
              p-4 sm:p-6 mb-6
            "
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                  Top Search Keywords
                </h3>

                {searchKeywordsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <CircularProgress
                      size={40}
                      thickness={4}
                      sx={{ color: "#0891b2" }}
                    />
                  </div>
                ) : topKeywords.length > 0 ? (
                  <div className="space-y-3">
                    {topKeywords.map((keyword, idx) => {
                      const value = keyword.insightsValue?.value || 0;
                      const maxValue =
                        topKeywords[0]?.insightsValue?.value || 1;
                      const percentage = (value / maxValue) * 100;

                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {keyword.searchKeyword}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-cyan-600" />
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-cyan-700">
                                  {value.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Impressions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No search keyword data available
                    </p>
                  </div>
                )}
              </div>

              {/* RECENT DAILY ACTIVITY */}
              {callClicks?.timeSeries?.datedValues && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Recent Daily Activity
                  </h3>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {callClicks.timeSeries.datedValues
                        .slice(-10)
                        .reverse()
                        .map((item, idx) => {
                          const date = item.date;
                          const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                          const value =
                            typeof item.value === "string"
                              ? parseInt(item.value, 10)
                              : item.value || 0;

                          return (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {dateStr}
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {value} calls
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Insights Available
              </h3>
              <p className="text-gray-600">
                Unable to load performance data for this listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
