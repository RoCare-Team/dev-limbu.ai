import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import FranchiseLeadSource from "@/models/FranchiseLeadSource";
import { assertFranchiseAdminAccess } from "@/lib/franchiseAuthServer";
import { getPlatform } from "@/lib/franchiseLeadSources";
import {
  flattenMetaFieldData,
  ingestFranchiseLead,
  recordIngestStats,
} from "@/lib/franchiseLeadIngest";

const META_GRAPH_VERSION = "v24.0";
const PAGE_LIMIT = 200;

/**
 * Pulls new leads from Meta's Graph API for one configured source and turns
 * them into franchise-panel leads. Safe to run repeatedly — ingest dedupes on
 * the Meta lead id, so re-reading a page cannot create duplicates.
 */
async function syncMetaSource(source) {
  const { formId, accessToken } = source.credentials || {};

  if (!formId || !accessToken) {
    return { created: 0, duplicates: 0, error: "Form ID or access token missing" };
  }

  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${formId}/leads`,
  );
  url.searchParams.set("limit", String(PAGE_LIMIT));
  url.searchParams.set("access_token", accessToken);
  if (source.lastSyncCursor) {
    url.searchParams.set("after", source.lastSyncCursor);
  }

  const res = await fetch(url.toString());
  const payload = await res.json();

  if (!res.ok) {
    return {
      created: 0,
      duplicates: 0,
      error: payload?.error?.message || `Meta API error ${res.status}`,
    };
  }

  const leads = Array.isArray(payload.data) ? payload.data : [];
  let created = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const metaLead of leads) {
    const result = await ingestFranchiseLead({
      source,
      lead: flattenMetaFieldData(metaLead.field_data),
      externalId: metaLead.id,
    });

    if (result.status === "created") created += 1;
    else if (result.status === "duplicate") duplicates += 1;
    else invalid += 1;
  }

  return {
    created,
    duplicates,
    invalid,
    fetched: leads.length,
    cursor: payload.paging?.cursors?.after || source.lastSyncCursor || null,
    error: "",
  };
}

export async function POST(req) {
  try {
    await dbConnect();

    const access = assertFranchiseAdminAccess(req);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status },
      );
    }

    const { id } = await req.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Valid source id is required" },
        { status: 400 },
      );
    }

    const source = await FranchiseLeadSource.findOne({
      _id: id,
      franchiseCode: access.decoded.franchiseCode,
    });

    if (!source) {
      return NextResponse.json(
        { success: false, message: "Source not found" },
        { status: 404 },
      );
    }

    const platform = getPlatform(source.platform);
    if (!platform?.supportsSync) {
      return NextResponse.json(
        {
          success: false,
          message: `${platform?.label || source.platform} cannot be pulled — it delivers leads to the webhook URL instead.`,
        },
        { status: 400 },
      );
    }

    if (!source.isActive) {
      return NextResponse.json(
        { success: false, message: "Enable this source before syncing" },
        { status: 400 },
      );
    }

    const result = await syncMetaSource(source);

    source.lastSyncAt = new Date();
    if (result.cursor) source.lastSyncCursor = result.cursor;
    await source.save();

    await recordIngestStats(source._id, result);

    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.created
        ? `${result.created} new lead${result.created === 1 ? "" : "s"} imported`
        : "No new leads found",
      result,
    });
  } catch (error) {
    console.error("Lead source sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
