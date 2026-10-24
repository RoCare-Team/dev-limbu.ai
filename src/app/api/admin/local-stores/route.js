import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import LocalStore from "@/models/LocalStore";
import { seedLocalStoresIfEmpty } from "@/lib/localStores";
import { cityToSlug, findCityBySlug } from "@/utils/citySlug";

const JWT_SECRET = process.env.JWT_SECRET || "mannubhai_secret";

export const dynamic = "force-dynamic";

/** Same Bearer-JWT check the other admin routes use. */
function requireAdmin(req) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    return null;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 },
    );
  }
}

/**
 * Normalises one submitted store. The city can be typed either way ("Kanpur"
 * or "kanpur") — it is stored as a slug so the public pages find it.
 */
function cleanPayload(body) {
  const citySlug = cityToSlug(body.city || body.citySlug || "");
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();

  if (!citySlug) return { error: "City is required" };
  if (!name) return { error: "Store name is required" };
  if (!address) return { error: "Address is required" };

  return {
    data: {
      citySlug,
      cityName:
        String(body.cityName || "").trim() || findCityBySlug(citySlug) || "",
      name,
      address,
      whatsapp: String(body.whatsapp || "").trim(),
      phone: String(body.phone || "").trim(),
      mapUrl: String(body.mapUrl || "").trim(),
      isActive: body.isActive !== false,
      order: Number(body.order) || 0,
    },
  };
}

/** GET /api/admin/local-stores — every store, newest city first. */
export async function GET(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    await seedLocalStoresIfEmpty();

    const stores = await LocalStore.find({})
      .sort({ citySlug: 1, order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    console.error("GET /api/admin/local-stores error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

/** POST — add a store. */
export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const { data, error } = cleanPayload(body);
    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 400 },
      );
    }

    const created = await LocalStore.create(data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/local-stores error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

/** PUT — edit a store. body: { id, ...fields } */
export async function PUT(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || body._id || "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 },
      );
    }

    const { data, error } = cleanPayload(body);
    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 400 },
      );
    }

    const updated = await LocalStore.findByIdAndUpdate(id, data, { new: true });
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/admin/local-stores error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}

/** DELETE /api/admin/local-stores?id=... */
export async function DELETE(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const id = (new URL(req.url).searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 },
      );
    }

    const removed = await LocalStore.findByIdAndDelete(id);
    if (!removed) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "Store deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/local-stores error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
