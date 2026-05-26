/**
 * app/api/conversation-stages/route.js
 *
 * GET /api/conversation-stages
 *   → returns only stageCounts (for dashboard/sidebar cards)
 *
 * GET /api/conversation-stages?stage=GMB+Connected
 *   → returns stageCounts + paginated user list for that stage
 *
 * Query params:
 *   stage   — optional, one of CONVERSATION_STAGE_KEYS
 *   page    — default 1
 *   limit   — default 50
 */

import { NextResponse } from "next/server";
import {
  CONVERSATION_STAGE_KEYS,
  getLimbuBotStageWithUsers,
} from "@/lib/limbuBotUserSync";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = (searchParams.get("stage") || "").trim();
    const page  = Math.max(1, parseInt(searchParams.get("page"))  || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit")) || 50);

    // validate stage if provided
    if (stage && stage !== "All" && !CONVERSATION_STAGE_KEYS.includes(stage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid stage. Valid values: All, ${CONVERSATION_STAGE_KEYS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const result = await getLimbuBotStageWithUsers({ stage, page, limit });

    return NextResponse.json(result);
  } catch (error) {
    const isTimeout =
      error.name === "TimeoutError" || error.name === "AbortError";

    console.error("[conversation-stages] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? "LimbuBot API timed out. Check service availability."
          : error.message || "Server error",
      },
      { status: isTimeout ? 504 : 500 },
    );
  }
}
