import PDFDocument from "pdfkit";
import Post from "@/models/PostStatus";
import GmbActivity from "@/models/GmbActivity";

/**
 * The client's weekly "here is what we did" PDF.
 *
 * Every number comes from a record of work that actually happened — published
 * posts from the Post log, replies and profile edits from GmbActivity. Nothing
 * is estimated: if a week has no rows, the report says so rather than padding.
 */

// Keyed on what `whenPosted` actually stores ("fb", "ig"), with the longer
// aliases kept so older rows still render with a real name.
const PLATFORM_LABELS = {
  gmb: "Google Business Profile",
  fb: "Facebook",
  ig: "Instagram",
  pin: "Pinterest",
  li: "LinkedIn",
  yt: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

/** Pretty names for the profile fields the optimization screen can change. */
const FIELD_LABELS = {
  // "profile" is Google's own field name for the description — the one a
  // client actually sees on their listing, so it must not show up raw.
  profile: "Business description",
  phoneNumbers: "Phone number",
  description: "Business description",
  services: "Services",
  serviceItems: "Service list",
  serviceArea: "Service areas",
  websiteUri: "Website link",
  whatsappUri: "WhatsApp link",
  primaryPhone: "Phone number",
  bookingUri: "Booking link",
  regularHours: "Business hours",
  specialHours: "Holiday hours",
  categories: "Categories",
  attributes: "Attributes",
  title: "Business name",
  storefrontAddress: "Address",
  latlng: "Map pin",
};

/** Google reports star ratings as words; clients read numbers faster. */
const STAR_LABELS = {
  ONE: "1/5",
  TWO: "2/5",
  THREE: "3/5",
  FOUR: "4/5",
  FIVE: "5/5",
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Gathers one user's week. Returns plain data so it can be tested or reused. */
export async function collectWeeklyReport({ userId, from, to }) {
  const [posts, activities] = await Promise.all([
    Post.find({ userId, updatedAt: { $gte: from, $lte: to } })
      .select("whenPosted status promat gmbDescription updatedAt")
      .lean(),
    GmbActivity.find({ userId, at: { $gte: from, $lte: to } }).sort({ at: 1 }).lean(),
  ]);

  const perPlatform = {};
  const publishedPosts = [];
  // Which search terms this week's posts were actually built around. Clients
  // ask "what are you doing for my ranking" — this is the answer, from the
  // keyword each post was generated for, not from a plan setting.
  const keywordCounts = {};
  let failed = 0;

  for (const post of posts) {
    const rows = Array.isArray(post.whenPosted) ? post.whenPosted : [];
    const live = rows.filter(
      (r) => r.posted && r.postedDate && new Date(r.postedDate) >= from
    );

    if (live.length) {
      for (const r of live) perPlatform[r.platform] = (perPlatform[r.platform] || 0) + 1;
      const keyword = String(post.promat || "").trim();
      if (keyword) keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      publishedPosts.push({
        at: live[0].postedDate,
        platforms: live.map((r) => r.platform),
        keyword,
        text: (post.gmbDescription || post.promat || "").slice(0, 160),
      });
    } else if (["failed", "partial_failed"].includes(post.status)) {
      failed += 1;
    }
  }

  publishedPosts.sort((a, b) => new Date(a.at) - new Date(b.at));

  const reviewReplies = activities.filter((a) => a.type === "review_reply");
  const profileUpdates = activities.filter((a) => a.type === "profile_update");

  // Which fields were touched, and how often.
  const fieldCounts = {};
  for (const u of profileUpdates) {
    for (const f of u.details?.fields || []) {
      fieldCounts[f] = (fieldCounts[f] || 0) + 1;
    }
  }

  // The newest wording we pushed for the fields a client actually cares about
  // reading back: their description and their service list. Newest wins, so the
  // report shows what is live now rather than every intermediate edit.
  const latestCopy = {};
  for (const u of profileUpdates) {
    for (const [field, note] of Object.entries(u.details?.changes || {})) {
      latestCopy[field] = { note, at: u.at };
    }
  }

  return {
    publishedCount: publishedPosts.length,
    failed,
    perPlatform,
    publishedPosts,
    keywordCounts,
    reviewReplies,
    profileUpdates,
    fieldCounts,
    latestCopy,
    totalActions: publishedPosts.length + reviewReplies.length + profileUpdates.length,
  };
}

/** Renders the report to a PDF buffer. */
export async function buildWeeklyReportPdf({ user, from, to, data }) {
  const doc = new PDFDocument({ size: "A4", margin: 44, bufferPages: true });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const ACCENT = "#B45309";
  const INK = "#111827";
  const MUTED = "#6B7280";
  const LINE = "#E5E7EB";

  const rule = () => {
    doc.moveTo(44, doc.y).lineTo(551, doc.y).strokeColor(LINE).lineWidth(1).stroke();
    doc.moveDown(0.6);
  };

  const heading = (text) => {
    if (doc.y > 720) doc.addPage();
    doc.moveDown(0.5);
    doc.fillColor(ACCENT).fontSize(12).font("Helvetica-Bold").text(text.toUpperCase());
    doc.moveDown(0.25);
    rule();
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.fillColor(INK).fontSize(20).font("Helvetica-Bold").text("Weekly Activity Report");
  doc.moveDown(0.2);
  doc.fillColor(MUTED).fontSize(10).font("Helvetica")
    .text(`${user.businessName || user.fullName || "Your business"}  ·  ${fmtDate(from)} – ${fmtDate(to)}`);
  doc.moveDown(0.8);
  rule();

  // ── At a glance ───────────────────────────────────────────────────────────
  const cards = [
    ["Posts published", String(data.publishedCount)],
    ["Keywords targeted", String(Object.keys(data.keywordCounts || {}).length)],
    ["Reviews replied", String(data.reviewReplies.length)],
    ["Profile updates", String(data.profileUpdates.length)],
  ];
  const cardTop = doc.y + 4;
  // Four cards across the 507pt text column: 120 wide, 9 apart.
  cards.forEach(([label, value], i) => {
    const x = 44 + i * 129;
    doc.roundedRect(x, cardTop, 120, 54, 8).fillAndStroke("#FFFBEB", LINE);
    doc.fillColor(INK).fontSize(21).font("Helvetica-Bold").text(value, x + 12, cardTop + 9);
    doc.fillColor(MUTED).fontSize(8).font("Helvetica")
      .text(label, x + 12, cardTop + 36, { width: 100 });
  });
  // Drawing the cards left the text cursor inside the last one, which squeezed
  // every following paragraph into a ~15pt column. Put it back on the margin.
  doc.x = 44;
  doc.y = cardTop + 70;

  if (data.totalActions === 0) {
    doc.moveDown(1);
    doc.fillColor(MUTED).fontSize(11).font("Helvetica")
      .text("No activity was recorded on your profile in this period.", { align: "center" });
    doc.end();
    return done;
  }

  // ── Posts ─────────────────────────────────────────────────────────────────
  if (data.publishedPosts.length) {
    heading("Posts published");
    const platformLine = Object.entries(data.perPlatform)
      .map(([p, n]) => `${PLATFORM_LABELS[p] || p}: ${n}`)
      .join("   ·   ");
    doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(platformLine);
    doc.moveDown(0.5);

    data.publishedPosts.forEach((p, i) => {
      if (doc.y > 740) doc.addPage();
      doc.fillColor(INK).fontSize(9.5).font("Helvetica-Bold")
        .text(`${i + 1}.  ${fmtDate(p.at)}`, { continued: true });
      doc.fillColor(MUTED).font("Helvetica")
        .text(
          `   ${p.platforms.map((x) => PLATFORM_LABELS[x] || x).join(", ")}` +
            (p.keyword ? `   ·   ${p.keyword}` : ""),
        );
      if (p.text) {
        doc.fillColor("#374151").fontSize(9).font("Helvetica")
          .text(p.text, { indent: 14, lineGap: 1 });
      }
      doc.moveDown(0.35);
    });
  }

  // ── Keywords ──────────────────────────────────────────────────────────────
  // A client seeing only pictures assumes we are "just posting". Naming the
  // search terms each post targeted is what makes the SEO work visible.
  const keywords = Object.entries(data.keywordCounts || {}).sort((a, b) => b[1] - a[1]);
  if (keywords.length) {
    heading("Keywords we targeted");
    doc.fillColor(MUTED).fontSize(9).font("Helvetica")
      .text("Every post this week was written around one of these search terms, so your profile keeps building relevance for them.");
    doc.moveDown(0.5);
    keywords.forEach(([kw, n]) => {
      if (doc.y > 740) doc.addPage();
      doc.fillColor(INK).fontSize(9.5).font("Helvetica-Bold").text(kw, { continued: true });
      doc.fillColor(MUTED).font("Helvetica").text(`   ${n} post${n === 1 ? "" : "s"}`);
    });
    doc.moveDown(0.3);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  if (data.reviewReplies.length) {
    heading("Reviews replied");
    data.reviewReplies.forEach((r, i) => {
      if (doc.y > 740) doc.addPage();
      const rating = STAR_LABELS[r.details?.rating] || "";
      doc.fillColor(INK).fontSize(9.5).font("Helvetica-Bold")
        .text(`${i + 1}.  ${r.details?.reviewer || "Customer"}`, { continued: true });
      doc.fillColor(MUTED).font("Helvetica")
        .text(`   ${rating ? rating + " · " : ""}${fmtDate(r.at)}${r.locationName ? " · " + r.locationName : ""}`);
      if (r.details?.comment) {
        doc.fillColor("#374151").fontSize(9).font("Helvetica-Oblique")
          .text(`"${r.details.comment}"`, { indent: 14, lineGap: 1 });
      }
      doc.moveDown(0.35);
    });
  }

  // ── Optimization ──────────────────────────────────────────────────────────
  if (data.profileUpdates.length) {
    heading("Profile optimization");
    const summary = Object.entries(data.fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([f, n]) => `${FIELD_LABELS[f] || f}${n > 1 ? ` (${n}×)` : ""}`)
      .join("   ·   ");
    if (summary) {
      doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(summary);
      doc.moveDown(0.5);
    }

    data.profileUpdates.forEach((u, i) => {
      if (doc.y > 740) doc.addPage();
      const fields = (u.details?.fields || []).map((f) => FIELD_LABELS[f] || f).join(", ");
      doc.fillColor(INK).fontSize(9.5).font("Helvetica-Bold")
        .text(`${i + 1}.  ${fmtDate(u.at)}`, { continued: true });
      doc.fillColor("#374151").font("Helvetica").text(`   ${fields || "profile updated"}`);
      doc.moveDown(0.3);
    });

    // What the wording actually says now. Without this the client can see that
    // we edited their description but not what we wrote.
    const copy = [
      ["profile", "Business description now reads"],
      ["serviceItems", "Services now listed"],
      ["categories", "Categories now set to"],
    ].filter(([f]) => data.latestCopy?.[f]?.note);

    if (copy.length) {
      doc.moveDown(0.3);
      copy.forEach(([field, label]) => {
        if (doc.y > 700) doc.addPage();
        doc.fillColor(ACCENT).fontSize(9).font("Helvetica-Bold").text(label);
        doc.fillColor("#374151").fontSize(9).font("Helvetica")
          .text(data.latestCopy[field].note, { indent: 10, lineGap: 1 });
        doc.moveDown(0.4);
      });
    }
  }

  if (data.failed) {
    heading("Needs attention");
    doc.fillColor("#B91C1C").fontSize(9.5).font("Helvetica")
      .text(`${data.failed} post${data.failed === 1 ? "" : "s"} could not be published this period. Our team is on it.`);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    // Writing below the bottom margin makes pdfkit start a fresh page, which is
    // how the footer was adding a blank one. Drop the margin while stamping it.
    doc.page.margins.bottom = 0;
    doc.fillColor(MUTED).fontSize(8).font("Helvetica")
      .text(`Limbu AI  ·  generated ${fmtDate(new Date())}  ·  page ${i + 1} of ${range.count}`, 44, doc.page.height - 34, {
        width: 507,
        align: "center",
      });
  }

  doc.end();
  return done;
}
