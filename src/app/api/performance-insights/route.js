import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PerformanceInsights from "@/models/PerformanceInsights";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    const {
      locationId,
      businessName,
      locationName,
      city,
      locality,
      businessProfileId,
      insightsData,
      searchKeywords,
      metrics,
      dateRange,
      reportMonth,
      reportYear,
    } = body;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💾 POST /api/performance-insights");
    console.log("📍 locationId:", locationId);
    console.log("📅 reportMonth:", reportMonth, "| reportYear:", reportYear);
    console.log("📅 dateRange received:", dateRange);
    console.log("📊 metrics received:", metrics);

    if (!locationId || !businessName || !locationName || !insightsData || !dateRange) {
      return NextResponse.json(
        { error: "Missing required fields: locationId, businessName, locationName, insightsData, dateRange" },
        { status: 400 },
      );
    }

    // ✅ Fix: dateRange ko normalize karo — time strip karke sirf date rakho
    const normalizedStartDate = new Date(dateRange.startDate);
    normalizedStartDate.setUTCHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(dateRange.endDate);
    normalizedEndDate.setUTCHours(0, 0, 0, 0);

    console.log("📅 Normalized dateRange:", {
      startDate: normalizedStartDate.toISOString(),
      endDate: normalizedEndDate.toISOString(),
    });

    // ✅ Fix: sirf locationId + reportMonth + reportYear + userId se dhundho
    // dateRange exact match hata do — wahi duplicate ka root cause hai
    const existingQuery = {
      locationId,
      reportMonth,
      reportYear,
      userId: session.user.id || session.user.email,
    };

    console.log("🔍 existingQuery:", existingQuery);

    const existingInsight = await PerformanceInsights.findOne(existingQuery);
    console.log("🗄️ Existing record:", existingInsight ? `FOUND → _id: ${existingInsight._id}` : "NOT FOUND → creating new");

    // ✅ Fix: metrics mein totalImpressions bhi save karo
    const metricsToSave = {
      totalDirections: metrics?.totalDirections || 0,
      totalCalls: metrics?.totalCalls || 0,
      totalWebsiteClicks: metrics?.totalWebsiteClicks || 0,
      totalMapsImpressions: metrics?.totalMapsImpressions || 0,
      totalSearchImpressions: metrics?.totalSearchImpressions || 0,
      totalImpressions: (metrics?.totalMapsImpressions || 0) + (metrics?.totalSearchImpressions || 0), // ← yeh line add karo
    };

    console.log("📊 metricsToSave:", metricsToSave);

    const normalizedDateRange = {
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    };

    let savedInsight;
    let isUpdated = false;

    if (existingInsight) {
      savedInsight = await PerformanceInsights.findByIdAndUpdate(
        existingInsight._id,
        {
          businessName,
          locationName,
          city: city || "",
          locality: locality || "",
          businessProfileId,
          insightsData,
          searchKeywords,
          metrics: metricsToSave,
          dateRange: normalizedDateRange,
          reportMonth,
          reportYear,
          updatedAt: new Date(),
        },
        { new: true },
      );
      isUpdated = true;
      console.log("✅ UPDATED → metrics saved:", savedInsight.metrics);
    } else {
      const performanceInsights = new PerformanceInsights({
        locationId,
        businessName,
        locationName,
        city: city || "",
        locality: locality || "",
        businessProfileId,
        insightsData,
        searchKeywords,
        metrics: metricsToSave,
        dateRange: normalizedDateRange,
        reportMonth,
        reportYear,
        userId: session.user.id || session.user.email,
      });

      savedInsight = await performanceInsights.save();
      console.log("✅ CREATED → _id:", savedInsight._id, "| metrics:", savedInsight.metrics);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(
      {
        success: true,
        message: isUpdated ? "Insights updated successfully" : "Insights saved successfully",
        data: savedInsight,
        updated: isUpdated,
      },
      { status: isUpdated ? 200 : 201 },
    );
  } catch (error) {
    console.error("❌ Error saving performance insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save insights" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const reportMonth = searchParams.get("reportMonth");
    const reportYear = searchParams.get("reportYear");
    const city = searchParams.get("city");
    const locality = searchParams.get("locality");

    console.log("📥 GET params:", { locationId, reportMonth, reportYear, city, locality });

    // ✅ reportMonth + reportYear = exact date period identifier
    let query = { userId: session.user.id || session.user.email };

    if (locationId) query.locationId = locationId;
    if (reportMonth) query.reportMonth = reportMonth;       // "April-May" ya "April"
    if (reportYear)  query.reportYear  = parseInt(reportYear); // 2026
    if (city)        query.city        = city;
    if (locality)    query.locality    = locality;

    console.log("🔍 Final Query:", query);

    const insights = await PerformanceInsights.find(query)
      .sort({ updatedAt: -1 })
      .limit(10);

    console.log("✅ Found:", insights.length);

    if (insights.length === 0) {
      return NextResponse.json(
        { success: true, message: "No insights found", data: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, data: insights }, { status: 200 });

  } catch (error) {
    console.error("❌ GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
