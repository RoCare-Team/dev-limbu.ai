import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import FranchiseLeadSource from "@/models/FranchiseLeadSource";
import {
  flattenMetaFieldData,
  ingestFranchiseLead,
  recordIngestStats,
} from "@/lib/franchiseLeadIngest";

export const dynamic = "force-dynamic";

/**
 * Public lead intake. Authenticated by the per-source ingest key, so a
 * platform (Meta webhook, Google Ads, Zapier, a website form) can post leads
 * straight into one franchise's panel without a login.
 *
 *   POST /api/franchise-panel/lead-ingest?key=<ingestKey>
 *   { "fullName": "...", "email": "...", "phone": "..." }
 *
 * A `leads: [...]` array is also accepted for batches.
 */
function readKey(req, body) {
  const fromQuery = new URL(req.url).searchParams.get("key");
  if (fromQuery) return fromQuery.trim();

  const header = req.headers.get("x-lead-ingest-key");
  if (header) return header.trim();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.replace("Bearer ", "").trim();

  return String(body?.key || "").trim();
}

/** Accepts a single lead, a `leads` array, or a raw Meta webhook entry. */
function extractLeads(body) {
  if (Array.isArray(body?.leads)) return body.leads;
  if (Array.isArray(body)) return body;

  if (Array.isArray(body?.field_data)) {
    return [flattenMetaFieldData(body.field_data)];
  }

  if (body && typeof body === "object") {
    const { key, ...rest } = body;
    return [rest];
  }

  return [];
}

export async function POST(req) {
  try {
    await dbConnect();

    let body = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const key = readKey(req, body);
    if (!key) {
      return NextResponse.json(
        { success: false, message: "Ingest key is required" },
        { status: 401 },
      );
    }

    const source = await FranchiseLeadSource.findOne({ ingestKey: key });
    if (!source) {
      return NextResponse.json(
        { success: false, message: "Invalid ingest key" },
        { status: 401 },
      );
    }

    if (!source.isActive) {
      return NextResponse.json(
        { success: false, message: "This lead source is disabled" },
        { status: 403 },
      );
    }

    const leads = extractLeads(body);
    if (!leads.length) {
      return NextResponse.json(
        { success: false, message: "No lead data in request" },
        { status: 400 },
      );
    }

    let created = 0;
    let duplicates = 0;
    const rejected = [];

    for (const lead of leads) {
      const result = await ingestFranchiseLead({
        source,
        lead,
        externalId: lead?.leadId || lead?.lead_id || lead?.id || null,
      });

      if (result.status === "created") created += 1;
      else if (result.status === "duplicate") duplicates += 1;
      else rejected.push(result.reason || "Invalid lead");
    }

    await recordIngestStats(source._id, { created, duplicates, error: "" });

    return NextResponse.json({
      success: true,
      message: `${created} created, ${duplicates} duplicate, ${rejected.length} rejected`,
      created,
      duplicates,
      rejected,
      source: source.name,
    });
  } catch (error) {
    console.error("Lead ingest error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

/** Meta webhook verification handshake. */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("hub.challenge");

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ success: true, message: "Lead ingest endpoint ready" });
}
