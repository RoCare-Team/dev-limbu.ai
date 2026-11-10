import { NextResponse } from "next/server";
import { AuditError, runWebsiteAudit } from "@/lib/websiteAudit";

// PageSpeed Insights alone can take ~30 s.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** POST { url } -> audit report (see lib/websiteAudit.js). */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const report = await runWebsiteAudit(body?.url);
    return NextResponse.json({ success: true, report });
  } catch (err) {
    if (err instanceof AuditError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error("website-audit error:", err);
    return NextResponse.json(
      { success: false, error: "The audit failed. Please try again." },
      { status: 500 }
    );
  }
}
