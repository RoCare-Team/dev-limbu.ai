// File: /app/api/admin/gmb-scraper/api-usage/route.js

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { accessToken, apiKey } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access token required. Please connect Google account." },
        { status: 401 }
      );
    }

    // Query last 30 days
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const startTime = start.toISOString().replace(/\.\d{3}Z$/, "Z");
    const endTime = now.toISOString().replace(/\.\d{3}Z$/, "Z");

    // Extract project id from API key (if possible) or use the project from credentials
    // We use the project ID from the client_id: 659200143320
    const projectId = "gen-lang-client-0547433603";

    const monitoringUrl =
      `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
      `?filter=metric.type%3D%22serviceruntime.googleapis.com%2Fapi%2Frequest_count%22` +
      (apiKey ? `%20AND%20resource.labels.credential_id%3D%22apikey%3A${apiKey}%22` : "") +
      `&interval.startTime=${encodeURIComponent(startTime)}` +
      `&interval.endTime=${encodeURIComponent(endTime)}` +
      `&aggregation.alignmentPeriod=86400s` +
      `&aggregation.perSeriesAligner=ALIGN_SUM` +
      `&aggregation.crossSeriesReducer=REDUCE_SUM`;

    const monitoringRes = await fetch(monitoringUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!monitoringRes.ok) {
      const errText = await monitoringRes.text();
      let errMsg = `Monitoring API error ${monitoringRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
      } catch {}
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }

    const monitoringData = await monitoringRes.json();

    // Sum all data points
    let totalRequests = 0;
    const dailyBreakdown = [];

    (monitoringData.timeSeries || []).forEach((series) => {
      (series.points || []).forEach((point) => {
        const value = point.value?.int64Value || point.value?.doubleValue || 0;
        totalRequests += Number(value);
        dailyBreakdown.push({
          date: point.interval?.startTime?.split("T")[0] || "unknown",
          count: Number(value),
        });
      });
    });

    // Sort by date
    dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      usage: {
        totalRequests,
        periodStart: startTime.split("T")[0],
        periodEnd: endTime.split("T")[0],
        dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("[API Usage] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}