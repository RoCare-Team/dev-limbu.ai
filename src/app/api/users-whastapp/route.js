import { NextResponse } from "next/server";
import { getKeywordResearchWhatsAppKey } from "@/lib/keywordResearchWhatsApp";

const AISENSY_URL = "https://whatsapp.limbu.ai/api/campaigns/send";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      campaignName,
      phone,
      firstName,
      planName,
      expiryDate,
      subscriptionLink,
      reportUrl,
      month, // "current" or "last" - for GMB report
      startDate,
      validUntil,
      dashboardLink,
    } = body;

    let templateParams = [];
    let media = {};
    let campaignTitle = campaignName;

    // 🔥 Dynamic Template Mapping
    switch (campaignName) {
      case "subscription_expiring_new":
        templateParams = [
          firstName,
          planName,
          expiryDate,
          subscriptionLink,
        ];
        break;

      case "subscription_expired_new":
        templateParams = [
          firstName,
          planName,
          expiryDate,
          subscriptionLink,
        ];
        break;

      case "welcome_onboard_new":
        const userPlan = body.planName || body.userPlan || "Free";
        templateParams = [
          firstName,
          userPlan,
          startDate || "",
          validUntil || "",
          dashboardLink || "https://limbu.ai/dashboard"
        ];
        break;

      case "gmb_report":
        // Handle month parameter for GMB report
        let reportMonth = month || "current";
        let monthLabel = "";
        
        if (reportMonth === "current") {
          monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
        } else {
          // Last month
          const lastMonthDate = new Date();
          lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
          monthLabel = lastMonthDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
        }
        
        templateParams = [firstName, monthLabel];
        campaignTitle = `gmb_report_${reportMonth}`;
        media = {
          url: reportUrl,
          filename: `GMB_Report_${monthLabel.replace(" ", "_")}`,
        };
        break;

      case "keyword_research_update":
        templateParams = ["$FirstName", "$LastName"];
        if (reportUrl) {
          media = {
            url: reportUrl,
            filename: body.reportFilename || "Keyword_Research_Report",
          };
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid campaignName" },
          { status: 400 }
        );
    }

    const response = await fetch(AISENSY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey:
          campaignName === "keyword_research_update"
            ? getKeywordResearchWhatsAppKey()
            : process.env.LIMBU_AI_WHATSAPP_KEY1 || process.env.AISENSY_API_KEY,
        campaignName,
        destination: phone,
        userName: campaignName === "keyword_research_update" ? "YOUR_BRAND_NAME" : "LimbuAI",
        templateParams,
        source: campaignName === "keyword_research_update" ? "api" : "system-trigger",
        media,
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue:
          campaignName === "keyword_research_update"
            ? {
                FirstName: firstName || body.firstName || "User",
                LastName: body.lastName || "",
              }
            : {
                FirstName: "User",
              },
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Campaign Send Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send campaign" },
      { status: 500 }
    );
  }
}