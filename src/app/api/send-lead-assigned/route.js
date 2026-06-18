// app/api/send-lead-assigned/route.js  (Next.js App Router)
// OR pages/api/send-lead-assigned.js   (Next.js Pages Router)

// ─── APP ROUTER VERSION ───────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { sendLeadAssignedTemplate } from "@/lib/sendLeadAssignedTemplate";

export async function POST(request) {
  try {
    const body = await request.json();

    console.log("[send-lead-assigned] Body received:", body);

    const { destination, agentName, customerName, customerPhone, source } =
      body;

    // Validate required field
    if (!destination) {
      return NextResponse.json(
        { success: false, error: "destination is required" },
        { status: 400 },
      );
    }

    const result = await sendLeadAssignedTemplate({
      destination,
      agentName,
      customerName,
      customerPhone,
      source,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Template send failed",
          data: result.data,
        },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "WhatsApp template sent", data: result.data },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API /send-lead-assigned] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
