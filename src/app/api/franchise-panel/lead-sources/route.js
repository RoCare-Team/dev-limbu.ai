import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import FranchiseLeadSource from "@/models/FranchiseLeadSource";
import { assertFranchiseAdminAccess } from "@/lib/franchiseAuthServer";
import { getPlatform, validateLeadSource } from "@/lib/franchiseLeadSources";

/** Secrets never leave the server — the UI only needs to know they are set. */
function maskCredentials(platformKey, credentials = {}) {
  const platform = getPlatform(platformKey);
  const out = {};

  (platform?.fields || []).forEach((field) => {
    const value = credentials?.[field.key];
    if (!value) {
      out[field.key] = "";
      return;
    }
    out[field.key] = field.secret
      ? `••••••${String(value).slice(-4)}`
      : String(value);
  });

  return out;
}

function serialize(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    platform: doc.platform,
    credentials: maskCredentials(doc.platform, doc.credentials),
    defaultLeadStage: doc.defaultLeadStage,
    defaultLeadStatus: doc.defaultLeadStatus,
    assignMode: doc.assignMode,
    fixedAgentId: doc.fixedAgentId,
    ingestKey: doc.ingestKey,
    isActive: doc.isActive,
    totalLeads: doc.totalLeads,
    duplicateCount: doc.duplicateCount,
    lastLeadAt: doc.lastLeadAt,
    lastSyncAt: doc.lastSyncAt,
    lastError: doc.lastError,
    createdAt: doc.createdAt,
  };
}

function guard(req) {
  const access = assertFranchiseAdminAccess(req);
  if (!access.ok) {
    return {
      response: NextResponse.json(
        { success: false, message: access.message },
        { status: access.status },
      ),
    };
  }
  return { decoded: access.decoded };
}

// ── GET — list this franchise's sources ─────────────────────────
export async function GET(req) {
  try {
    await dbConnect();
    const { response, decoded } = guard(req);
    if (response) return response;

    const sources = await FranchiseLeadSource.find({
      franchiseCode: decoded.franchiseCode,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sources.map(serialize),
    });
  } catch (error) {
    console.error("Lead sources GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ── POST — connect a new platform ───────────────────────────────
export async function POST(req) {
  try {
    await dbConnect();
    const { response, decoded } = guard(req);
    if (response) return response;

    const body = await req.json();

    const config = {
      name: String(body.name || "").trim(),
      platform: body.platform,
      credentials: body.credentials || {},
    };

    const errors = validateLeadSource(config);
    if (errors.length) {
      return NextResponse.json(
        { success: false, message: errors[0], errors },
        { status: 400 },
      );
    }

    const duplicateName = await FranchiseLeadSource.findOne({
      franchiseCode: decoded.franchiseCode,
      name: new RegExp(`^${config.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();

    if (duplicateName) {
      return NextResponse.json(
        { success: false, message: "A source with this name already exists" },
        { status: 409 },
      );
    }

    const source = await FranchiseLeadSource.create({
      franchiseCode: decoded.franchiseCode,
      name: config.name,
      platform: config.platform,
      credentials: config.credentials,
      defaultLeadStage: body.defaultLeadStage || "Active",
      defaultLeadStatus: body.defaultLeadStatus || "",
      assignMode: body.assignMode || "round-robin",
      fixedAgentId:
        body.assignMode === "fixed" &&
        mongoose.Types.ObjectId.isValid(body.fixedAgentId)
          ? body.fixedAgentId
          : null,
      ingestKey: crypto.randomBytes(24).toString("hex"),
      isActive: body.isActive !== false,
      createdByEmail: decoded.email || "",
    });

    return NextResponse.json({
      success: true,
      message: "Lead source connected",
      data: serialize(source),
    });
  } catch (error) {
    console.error("Lead sources POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ── PUT — update, toggle, or rotate the ingest key ──────────────
export async function PUT(req) {
  try {
    await dbConnect();
    const { response, decoded } = guard(req);
    if (response) return response;

    const body = await req.json();
    const { id } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Valid source id is required" },
        { status: 400 },
      );
    }

    const source = await FranchiseLeadSource.findOne({
      _id: id,
      franchiseCode: decoded.franchiseCode,
    });

    if (!source) {
      return NextResponse.json(
        { success: false, message: "Source not found" },
        { status: 404 },
      );
    }

    if (body.rotateKey) {
      source.ingestKey = crypto.randomBytes(24).toString("hex");
    }

    if (body.name !== undefined) source.name = String(body.name).trim();
    if (body.defaultLeadStage) source.defaultLeadStage = body.defaultLeadStage;
    if (body.defaultLeadStatus !== undefined) {
      source.defaultLeadStatus = body.defaultLeadStatus;
    }
    if (body.isActive !== undefined) source.isActive = !!body.isActive;

    if (body.assignMode) {
      source.assignMode = body.assignMode;
      source.fixedAgentId =
        body.assignMode === "fixed" &&
        mongoose.Types.ObjectId.isValid(body.fixedAgentId)
          ? body.fixedAgentId
          : null;
    }

    // Blank / masked credential values mean "keep what is stored".
    if (body.credentials) {
      const platform = getPlatform(source.platform);
      const next = { ...(source.credentials || {}) };

      (platform?.fields || []).forEach((field) => {
        const value = body.credentials[field.key];
        if (value === undefined) return;
        const trimmed = String(value).trim();
        if (!trimmed || trimmed.startsWith("••")) return;
        next[field.key] = trimmed;
      });

      source.credentials = next;
      source.markModified("credentials");
    }

    const errors = validateLeadSource({
      name: source.name,
      platform: source.platform,
      credentials: source.credentials,
    });

    if (errors.length) {
      return NextResponse.json(
        { success: false, message: errors[0], errors },
        { status: 400 },
      );
    }

    await source.save();

    return NextResponse.json({
      success: true,
      message: "Lead source updated",
      data: serialize(source),
    });
  } catch (error) {
    console.error("Lead sources PUT error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

// ── DELETE — disconnect a source (leads already created stay) ───
export async function DELETE(req) {
  try {
    await dbConnect();
    const { response, decoded } = guard(req);
    if (response) return response;

    const id = new URL(req.url).searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Valid source id is required" },
        { status: 400 },
      );
    }

    const deleted = await FranchiseLeadSource.findOneAndDelete({
      _id: id,
      franchiseCode: decoded.franchiseCode,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Source not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead source disconnected",
    });
  } catch (error) {
    console.error("Lead sources DELETE error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
