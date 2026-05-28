import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PerformanceInsights from "@/models/PerformanceInsights";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    if (!locationId || !businessName || !locationName || !insightsData || !dateRange) {
      return NextResponse.json(
        { error: "Missing required fields: locationId, businessName, locationName, insightsData, dateRange" },
        { status: 400 }
      );
    }

    const existingQuery = {
      locationId,
      reportMonth,
      reportYear,
      userId: session.user.id || session.user.email,
    };

    if (city) existingQuery.city = city;
    if (locality) existingQuery.locality = locality;
    if (dateRange?.startDate && dateRange?.endDate) {
      existingQuery["dateRange.startDate"] = new Date(dateRange.startDate);
      existingQuery["dateRange.endDate"] = new Date(dateRange.endDate);
    }

    // Check if insight with same location, report period, and exact range already exists
    const existingInsight = await PerformanceInsights.findOne(existingQuery);

    let savedInsight;
    let isUpdated = false;

    if (existingInsight) {
      // Update existing record
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
          metrics: metrics || {},
          dateRange,
          reportMonth,
          reportYear,
          updatedAt: new Date(),
        },
        { new: true }
      );
      isUpdated = true;
    } else {
      // Create new record
      const performanceInsights = new PerformanceInsights({
        locationId,
        businessName,
        locationName,
        city: city || "",
        locality: locality || "",
        businessProfileId,
        insightsData,
        searchKeywords,
        metrics: metrics || {},
        dateRange,
        reportMonth,
        reportYear,
        userId: session.user.id || session.user.email,
      });

      savedInsight = await performanceInsights.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: isUpdated ? "Insights updated successfully" : "Insights saved successfully",
        data: savedInsight,
        updated: isUpdated,
      },
      { status: isUpdated ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error saving performance insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save insights" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const reportMonth = searchParams.get("reportMonth");
    const reportYear = searchParams.get("reportYear");
    const city = searchParams.get("city");
    const locality = searchParams.get("locality");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = { userId: session.user.id || session.user.email };

    if (locationId) {
      query.locationId = locationId;
    }

    if (reportMonth) {
      query.reportMonth = reportMonth;
    }

    if (reportYear) {
      query.reportYear = parseInt(reportYear);
    }

    if (city) {
      query.city = city;
    }

    if (locality) {
      query.locality = locality;
    }

    if (startDate && endDate) {
      query["dateRange.startDate"] = new Date(startDate);
      query["dateRange.endDate"] = new Date(endDate);
    }

    console.log("GET Query:", query);

    const insights = await PerformanceInsights.find(query)
      .sort({ updatedAt: -1 })
      .limit(100);

    console.log("Found insights count:", insights.length);

    if (insights.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No insights found for the given criteria",
          data: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: insights,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching performance insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
