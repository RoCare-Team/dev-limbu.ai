// lib/sendLeadAssignedTemplate.js

export async function sendLeadAssignedTemplate({
  destination,
  agentName,
  customerName,
  customerPhone,
  source,
}) {
  try {
    if (!destination) {
      throw new Error("Destination number is required");
    }

    const payload = {
      apiKey:
        process.env.LIMBU_WHATSAPP_API_KEY ||
        "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade",

      campaignName: "lead_assign_template",

      destination: String(destination),

      userName: "Limbu AI",

      templateParams: [
        agentName || "Agent",
        customerName || "Customer",
        customerPhone || "N/A",
        source || "Direct",
      ],

      source: "api",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},

      paramsFallbackValue: {
        agentName: "Agent",
        customerName: "Customer",
        customerPhone: "Phone",
        source: "Direct",
      },
    };

    console.log(
      `[LeadAssignTemplate] Sending to ${destination} | Customer: ${customerName}`,
    );

    const response = await fetch(
      "https://whatsapp.limbu.ai/api/campaigns/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        "[LeadAssignTemplate] API Error:",
        response.status,
        data,
      );

      return {
        success: false,
        status: response.status,
        data,
      };
    }

    console.log(
      `[LeadAssignTemplate] ✅ Sent Successfully -> ${destination}`,
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "[LeadAssignTemplate] Send Error:",
      error.message,
    );

    return {
      success: false,
      error: error.message,
    };
  }
}