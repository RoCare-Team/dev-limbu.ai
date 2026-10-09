import { NextResponse } from "next/server";
import mongoose from "mongoose";

import dbConnect from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";
import { uploadToS3 } from "@/utils/s3Config";
import { generateInvoicePDFBuffer } from "@/app/api/admin/invoice-tax/route";
import { assertPayoutAdmin } from "@/lib/franchisePayoutAccess";

/**
 * Builds the invoice for one collection entry, on demand.
 *
 * An invoice is normally written once, when the client is onboarded — but only
 * 123 of 300 revenue rows have one: the rest predate that step or lost it to a
 * failed upload, and there was no way to produce it afterwards. This runs the
 * SAME generator the onboarding path uses (`generateInvoicePDFBuffer`) and
 * stores it under the same S3 name, so a regenerated invoice is identical to
 * one made at onboarding rather than a second, slightly different document.
 *
 * POST { id, adminEmail } → { success, invoiceUrl }
 */
export const maxDuration = 120;

export async function POST(req) {
  try {
    await dbConnect();

    const { id, adminEmail } = await req.json();

    const access = await assertPayoutAdmin(adminEmail);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status },
      );
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "A valid collection entry id is required" },
        { status: 400 },
      );
    }

    const revenue = await FranchiseRevenue.findById(id).lean();
    if (!revenue) {
      return NextResponse.json(
        { success: false, message: "Collection entry not found" },
        { status: 404 },
      );
    }

    // The generator reads the client's contact details off the user record when
    // the revenue row does not carry them.
    const user = revenue.leadId
      ? await User.findOne({ userId: revenue.leadId })
          .select("email phone")
          .lean()
          .catch(() => null)
      : null;

    const buffer = await generateInvoicePDFBuffer({
      ...revenue,
      userEmail: revenue.email || user?.email || "",
      userPhone: revenue.phone || user?.phone || "",
    });

    const upload = await uploadToS3(
      buffer,
      `invoice-${revenue._id}.pdf`,
      "application/pdf",
    );

    if (!upload?.success || !upload.url) {
      return NextResponse.json(
        { success: false, message: upload?.error || "Invoice upload failed" },
        { status: 502 },
      );
    }

    await FranchiseRevenue.findByIdAndUpdate(revenue._id, {
      invoiceUrl: upload.url,
    });

    return NextResponse.json({ success: true, invoiceUrl: upload.url });
  } catch (error) {
    console.error("Franchise payout invoice error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
