import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import {
  CUSTOM_EMAIL_TEMPLATE_ID,
  buildCustomEmailHtml,
  getEmailTemplateById,
} from "@/lib/limbuEmailTemplates";

const MAIL_API_URL = "https://mail.limbutech.in/api/v1/campaigns/send";

/** The provider takes the whole contact list in one call — keep batches sane. */
const BATCH_SIZE = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeContact = (user) => {
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return null;
  return { email, name: String(user?.name || user?.fullName || "").trim() || "there" };
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { adminEmail, users, templateId, customSubject, customMessage } = body;

    if (!adminEmail || typeof adminEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "Admin email required" },
        { status: 400 },
      );
    }

    const admin = await Admin.findOne({ email: adminEmail.trim() }).select(
      "role email",
    );

    if (!admin || admin.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Users array is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIMBU_MAIL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "LIMBU_MAIL_API_KEY is not configured" },
        { status: 500 },
      );
    }

    // Resolve the campaign content server-side so the client can only pick a
    // template id — free-form html is allowed for the custom template only.
    let campaignName;
    let subject;
    let html;

    if (templateId === CUSTOM_EMAIL_TEMPLATE_ID) {
      subject = String(customSubject || "").trim();
      const message = String(customMessage || "").trim();
      if (!subject || !message) {
        return NextResponse.json(
          { success: false, message: "Subject and message are required" },
          { status: 400 },
        );
      }
      campaignName = `Custom — ${subject}`.slice(0, 120);
      html = buildCustomEmailHtml(message);
    } else {
      const template = getEmailTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { success: false, message: "Invalid template id" },
          { status: 400 },
        );
      }
      campaignName = template.campaignName || template.title;
      subject = String(customSubject || "").trim() || template.subject;
      html = template.html;
    }

    // Dedupe by address — the same lead can appear more than once in a selection.
    const seen = new Set();
    const contacts = [];
    let invalid = 0;

    for (const user of users) {
      const contact = normalizeContact(user);
      if (!contact) {
        invalid++;
        continue;
      }
      if (seen.has(contact.email)) continue;
      seen.add(contact.email);
      contacts.push(contact);
    }

    if (!contacts.length) {
      return NextResponse.json(
        { success: false, message: "No valid email addresses in selection" },
        { status: 400 },
      );
    }

    const batches = chunk(contacts, BATCH_SIZE);

    let queued = 0;
    const campaigns = [];
    const rejected = [];
    const skipped = [];
    const errors = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const name =
        batches.length > 1
          ? `${campaignName} (${i + 1}/${batches.length})`
          : campaignName;

      try {
        const response = await fetch(MAIL_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            subject,
            html,
            consent: true,
            contacts: batch,
          }),
        });

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          errors.push({
            batch: i + 1,
            status: response.status,
            message: json?.message || json?.error || "Mail API error",
          });
          continue;
        }

        queued += Number(json?.recipients ?? 0);
        if (json?.campaign_id) {
          campaigns.push({ id: json.campaign_id, status: json.status, poll: json.poll });
        }
        if (Array.isArray(json?.rejected)) rejected.push(...json.rejected);
        if (Array.isArray(json?.skipped)) skipped.push(...json.skipped);
      } catch (error) {
        errors.push({ batch: i + 1, message: error.message });
      }
    }

    const success = queued > 0;
    const parts = [`${queued} email${queued === 1 ? "" : "s"} queued`];
    if (rejected.length) parts.push(`${rejected.length} rejected`);
    if (skipped.length) parts.push(`${skipped.length} skipped`);
    if (invalid) parts.push(`${invalid} without a valid address`);
    if (errors.length) parts.push(`${errors.length} batch(es) failed`);

    return NextResponse.json(
      {
        success,
        message: success ? parts.join(", ") : "Email sending failed",
        totalUsers: users.length,
        sent: queued,
        failed: contacts.length - queued,
        invalid,
        campaigns,
        rejected: rejected.slice(0, 50),
        skipped: skipped.slice(0, 50),
        errors,
      },
      { status: success ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
