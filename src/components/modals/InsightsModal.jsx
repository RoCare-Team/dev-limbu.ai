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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 animate-fadeIn mt-10 sm:mt-14">
      <div
        id="insights-modal-content"
        className="
      bg-[#0e0e0e]/95 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(253,224,71,0.1)] 
      border border-white/10
      w-full max-w-5xl 
      max-h-[92vh] 
      flex flex-col 
      overflow-hidden
    "
      >
        {/* HEADER */}
        <div
          className="
        bg-black/40 border-b border-white/10
        px-4 sm:px-6 py-4 
        flex justify-between items-center 
        rounded-t-2xl 
        shrink-0
      "
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#FDE047]" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Performance Insights
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {listingTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-[#FDE047] hover:bg-white/5 p-2 rounded-lg transition-all duration-300"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div
          id="insights-scroll-container"
          className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scroll"
        >
          {/* DATE RANGE */}
          <div
            className="
            bg-white/5 border border-white/10 rounded-xl 
            p-4 sm:p-5 mb-6
          "
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                Select Date Range
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
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
                bg-black/50 text-white
                border border-white/20 
                rounded-lg 
                focus:ring-2 focus:ring-[#FDE047]/50 focus:border-[#FDE047] transition-all
              "
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
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
                bg-black/50 text-white
                border border-white/20 
                rounded-lg 
                focus:ring-2 focus:ring-[#FDE047]/50 focus:border-[#FDE047] transition-all
              "
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
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
                sx={{ color: "#FDE047" }}
              />
              <p className="text-[#FDE047] mt-4 font-bold uppercase tracking-widest animate-pulse text-xs">
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
                bg-white/5 border border-white/10 rounded-xl 
                p-4 sm:p-5 hover:border-[#FDE047]/30 transition-all duration-300 group
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 group-hover:bg-[#FDE047]/10 group-hover:border-[#FDE047]/20 transition-all">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#FDE047]" />
                    </div>
                    <span
                      className="text-2xl sm:text-3xl font-bold text-white"
                      style={{
                        fontFamily: "Anton, sans-serif",
                        tracking: "wider",
                      }}
                    >
                      {totalImpressions.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    Total Impressions
                  </h3>

                  <div className="flex gap-2 text-xs text-slate-500 font-medium">
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
                bg-white/5 border border-white/10 rounded-xl 
                p-4 sm:p-5 hover:border-[#FDE047]/30 transition-all duration-300 group
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 group-hover:bg-[#FDE047]/10 group-hover:border-[#FDE047]/20 transition-all">
                      <MousePointer className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#FDE047]" />
                    </div>
                    <span
                      className="text-2xl sm:text-3xl font-bold text-white"
                      style={{
                        fontFamily: "Anton, sans-serif",
                        tracking: "wider",
                      }}
                    >
                      {totalWebsiteClicks.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    Website Clicks
                  </h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Users visited your website
                  </p>
                </div>

                {/* CALL CLICKS */}
                <div
                  className="
                bg-white/5 border border-white/10 rounded-xl 
                p-4 sm:p-5 hover:border-[#FDE047]/30 transition-all duration-300 group
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 group-hover:bg-[#FDE047]/10 group-hover:border-[#FDE047]/20 transition-all">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#FDE047]" />
                    </div>
                    <span
                      className="text-2xl sm:text-3xl font-bold text-white"
                      style={{
                        fontFamily: "Anton, sans-serif",
                        tracking: "wider",
                      }}
                    >
                      {totalCalls.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    Call Clicks
                  </h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Users clicked to call
                  </p>
                </div>

                {/* DIRECTIONS */}
                <div
                  className="
                bg-white/5 border border-white/10 rounded-xl 
                p-4 sm:p-5 hover:border-[#FDE047]/30 transition-all duration-300 group
              "
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 group-hover:bg-[#FDE047]/10 group-hover:border-[#FDE047]/20 transition-all">
                      <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-[#FDE047]" />
                    </div>
                    <span
                      className="text-2xl sm:text-3xl font-bold text-white"
                      style={{
                        fontFamily: "Anton, sans-serif",
                        tracking: "wider",
                      }}
                    >
                      {totalDirections.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                    Direction Requests
                  </h3>

                  <p className="text-xs text-slate-500 font-medium">
                    Users requested directions
                  </p>
                </div>
              </div>

              {/* CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Visibility Chart */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Eye className="w-4 h-4 text-[#FDE047]" />
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
                              stopColor="#FDE047"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#FDE047"
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
                              stopColor="#ffffff"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ffffff"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
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
                            border: "1px solid rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(14,14,14,0.9)",
                            color: "#fff",
                            backdropFilter: "blur(10px)",
                          }}
                          itemStyle={{ fontSize: "12px", color: "#fff" }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                            color: "#cbd5e1",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Maps"
                          stroke="#FDE047"
                          fillOpacity={1}
                          fill="url(#colorMaps)"
                          name="Maps Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="Search"
                          stroke="#ffffff"
                          fillOpacity={1}
                          fill="url(#colorSearch)"
                          name="Search Views"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Engagement Chart */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <MousePointer className="w-4 h-4 text-[#FDE047]" />
                    Engagement Trends
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(14,14,14,0.9)",
                            color: "#fff",
                            backdropFilter: "blur(10px)",
                          }}
                          itemStyle={{ fontSize: "12px", color: "#fff" }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                            color: "#cbd5e1",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Website"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="Website Clicks"
                        />
                        <Line
                          type="monotone"
                          dataKey="Calls"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={false}
                          name="Calls"
                        />
                        <Line
                          type="monotone"
                          dataKey="Directions"
                          stroke="#FDE047"
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
              bg-white/5 border border-white/10 rounded-xl 
              p-4 sm:p-6 mb-6
            "
              >
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
                  Engagement Summary
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-black/30 p-4 rounded-xl border border-white/5">
                    <div
                      className="text-xl sm:text-2xl font-bold text-white"
                      style={{ fontFamily: "Anton, sans-serif" }}
                    >
                      {totalImpressions.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                      Total Views
                    </div>
                  </div>

                  <div className="text-center bg-black/30 p-4 rounded-xl border border-white/5">
                    <div
                      className="text-xl sm:text-2xl font-bold text-white"
                      style={{ fontFamily: "Anton, sans-serif" }}
                    >
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
                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                      Click Rate
                    </div>
                  </div>

                  <div className="text-center bg-black/30 p-4 rounded-xl border border-white/5">
                    <div
                      className="text-xl sm:text-2xl font-bold text-white"
                      style={{ fontFamily: "Anton, sans-serif" }}
                    >
                      {(
                        totalWebsiteClicks +
                        totalCalls +
                        totalDirections
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                      Total Actions
                    </div>
                  </div>

                  <div className="text-center bg-black/30 p-4 rounded-xl border border-white/5">
                    <div
                      className="text-xl sm:text-2xl font-bold text-white"
                      style={{ fontFamily: "Anton, sans-serif" }}
                    >
                      {getDaysDifference()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                      Days
                    </div>
                  </div>
                </div>
              </div>

              {/* KEYWORDS */}
              <div
                className="
              bg-white/5 border border-white/10 rounded-xl 
              p-4 sm:p-6 mb-6
            "
              >
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#FDE047]" />
                  Top Search Keywords
                </h3>

                {searchKeywordsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <CircularProgress
                      size={40}
                      thickness={4}
                      sx={{ color: "#FDE047" }}
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
                          className="bg-black/30 rounded-lg p-4 border border-white/5 hover:border-[#FDE047]/30 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-white/10 text-[#FDE047] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-[#FDE047]/20">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-white">
                                {keyword.searchKeyword}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-[#FDE047]" />
                              <div className="flex flex-col items-end">
                                <span
                                  className="text-lg font-bold text-white"
                                  style={{ fontFamily: "Anton, sans-serif" }}
                                >
                                  {value.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                  Impressions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#FDE047] h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                boxShadow: "0 0 10px rgba(253,224,71,0.5)",
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">
                      No search keyword data available
                    </p>
                  </div>
                )}
              </div>

              {/* RECENT DAILY ACTIVITY */}
              {callClicks?.timeSeries?.datedValues && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">
                    Recent Daily Activity
                  </h3>
                  <div className="max-h-48 overflow-y-auto custom-scroll pr-2">
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
                              className="flex justify-between items-center py-2 px-3 bg-black/30 rounded-lg border border-white/5 hover:border-[#FDE047]/20 transition-all"
                            >
                              <span className="text-sm font-bold text-slate-300">
                                {dateStr}
                              </span>
                              <span className="text-sm font-bold text-[#FDE047]">
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
              <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                No Insights Available
              </h3>
              <p className="text-slate-500 font-medium">
                Unable to load performance data for this listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
