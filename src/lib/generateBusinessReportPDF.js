import fs from "fs";
import PDFDocument from "pdfkit";

/* ---------------- helpers ---------------- */

const titleCase = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "store",
  "food",
]);

function readableCategories(place) {
  const primary = place?.primaryType ? [place.primaryType] : [];
  const types = Array.isArray(place?.types) ? place.types : [];
  const merged = [...new Set([...primary, ...types])].filter(
    (t) => !GENERIC_TYPES.has(t),
  );
  const list = merged.length ? merged : types;
  return list.slice(0, 3).map(titleCase).join("  ·  ") || "—";
}

/** Average open hours/day from Places regularOpeningHours.periods. */
function avgHoursPerDay(place) {
  const periods = place?.regularOpeningHours?.periods;
  if (!Array.isArray(periods) || !periods.length) return null;
  let totalMin = 0;
  let days = 0;
  periods.forEach((p) => {
    if (p?.open?.hour == null || p?.close?.hour == null) return;
    const openMin = p.open.hour * 60 + (p.open.minute || 0);
    const closeMin = p.close.hour * 60 + (p.close.minute || 0);
    let diff = closeMin - openMin;
    if (diff < 0) diff += 24 * 60;
    totalMin += diff;
    days += 1;
  });
  if (!days) return null;
  return Math.round(totalMin / days / 60);
}

/** Collapse weekdayDescriptions to a compact set of {label, value} rows. */
function compactHours(place) {
  const desc = place?.regularOpeningHours?.weekdayDescriptions;
  if (!Array.isArray(desc) || !desc.length) return [];
  // Each item looks like "Monday: 9:00 AM – 9:00 PM"
  const rows = desc.map((d) => {
    const idx = d.indexOf(":");
    const day = idx > 0 ? d.slice(0, idx).trim() : d;
    const val = idx > 0 ? d.slice(idx + 1).trim() : "";
    return { day: day.slice(0, 3), val };
  });
  // Collapse if all identical values → "Mon – Sun"
  const allSame = rows.every((r) => r.val === rows[0].val);
  if (allSame) {
    return [{ label: `${rows[0].day} – ${rows[rows.length - 1].day}`, value: rows[0].val }];
  }
  return rows.map((r) => ({ label: r.day, value: r.val }));
}

/** Rough owner-vs-customer photo split from authorAttributions. */
function photoBreakdown(place, businessName) {
  const photos = Array.isArray(place?.photos) ? place.photos : [];
  const first = (businessName || "").toLowerCase().split(/\s+/)[0] || "";
  let owner = 0;
  let customer = 0;
  photos.forEach((p) => {
    const author = (p?.authorAttributions?.[0]?.displayName || "").toLowerCase();
    if (author && first && author.includes(first)) owner += 1;
    else if (!author) owner += 1;
    else customer += 1;
  });
  return { total: photos.length, owner, customer };
}

function buildImprovements(place, breakdown) {
  const tips = [];
  const reviews = place?.userRatingCount || 0;
  const rating = place?.rating;

  // Framed as what Limbu AI will do to grow the business.
  tips.push(
    "Local visibility — Limbu ranks your business in the Google Map Pack (top-3) so nearby customers find you first.",
  );
  if (reviews < 100)
    tips.push(
      `Only ${reviews} reviews — Limbu brings 100+ genuine reviews through automated WhatsApp review requests.`,
    );
  if (rating != null && rating < 4.5)
    tips.push(
      `Rating ${rating} — Limbu lifts it to 4.5+ with timely review replies and feedback management.`,
    );
  if (breakdown.customer === 0)
    tips.push(
      "0 customer photos — Limbu collects real customer photos & content to strengthen your profile.",
    );
  tips.push(
    "More calls & leads — Limbu's Magic QR, WhatsApp chatbot and GMB call button drive direct inquiries.",
  );
  if (!place?.websiteUri)
    tips.push(
      "No website — Limbu builds a business website + booking page to grow your online presence.",
    );
  tips.push(
    "Weekly posts, offers and Q&A — Limbu's auto-content keeps your profile active and ranking higher.",
  );
  return tips.slice(0, 5);
}

/**
 * Builds a professional, card-style, image-watermarked business report PDF
 * (single A4 page) from a Google Places `searchText` result.
 * @returns {Promise<Buffer>}
 */
export async function generateBusinessReportPDFBuffer(place = {}) {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  const pdfPromise = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(buffers))),
  );

  const W = doc.page.width; // 595.28
  const H = doc.page.height; // 841.89
  const M = 30;
  const CW = W - M * 2;

  /* professional color palette */
  const pageBg = "#ffffff";      // Pure white professional background
  const cardBg = "#ffffff";
  const border = "#e2e8f0";      // Subtle slate border for clear visual structure
  const dark = "#1e293b";        // Slate 800
  const muted = "#64748b";       // Slate 500
  const green = "#059669";       // Emerald 600
  const blue = "#2563eb";        // Blue 600
  const amberBg = "#fefaf0";     // Light warm alert background
  const amberBorder = "#fde68a"; // Warm yellow border
  const amberText = "#92400e";   // Dark amber text

  /* data */
  const name = place?.displayName?.text || place?.displayName || "Business";
  const city =
    place?.businessReportCity ||
    (place?.formattedAddress || "").split(",").slice(-3, -2)[0]?.trim() ||
    "";
  const subtitle = `${titleCase(place?.primaryType) || "Business"}${
    city ? "  ·  " + city : ""
  }`;
  const rating = place?.rating != null ? Number(place.rating) : null;
  const reviews = place?.userRatingCount != null ? place.userRatingCount : 0;
  const breakdown = photoBreakdown(place, name);
  const avgHours = avgHoursPerDay(place);
  const isOperational = (place?.businessStatus || "") === "OPERATIONAL";
  const openNow = place?.regularOpeningHours?.openNow;

  /* ---------- page background ---------- */
  doc.rect(0, 0, W, H).fill(pageBg);

  /* ---------- watermark ---------- */
  const logoPath = "public/images/bg-logo.png";
  if (fs.existsSync(logoPath)) {
    doc.save();
    doc.opacity(0.04); // Low opacity logo watermark in the center
    const imgSize = 300;
    doc.image(logoPath, (W - imgSize) / 2, (H - imgSize) / 2, { width: imgSize });
    doc.restore();
  } else {
    // Robust fallback watermark in case physical file is missing
    doc.save();
    doc.rotate(-30, { origin: [W / 2, H / 2] });
    doc
      .fillColor("#0f5132")
      .opacity(0.03)
      .fontSize(100)
      .font("Helvetica-Bold")
      .text("LIMBU AI", 0, H / 2 - 80, { width: W, align: "center" });
    doc.restore();
  }

  /* ---------- rounded card helper ---------- */
  const card = (x, y, w, h, fill = cardBg, strokeColor = border) => {
    doc
      .roundedRect(x, y, w, h, 12)
      .fillOpacity(1)
      .fill(fill)
      .lineWidth(1)
      .strokeColor(strokeColor)
      .stroke();
  };

  const badge = (x, y, text, color) => {
    doc.font("Helvetica-Bold").fontSize(8.5);
    const tw = doc.widthOfString(text) + 16;
    doc
      .roundedRect(x - tw, y, tw, 17, 8.5)
      .fill("#ffffff")
      .lineWidth(1)
      .strokeColor(color)
      .stroke();
    doc.fillColor(color).text(text, x - tw, y + 4.5, { width: tw, align: "center" });
    return tw;
  };

  /* ---------- header card ---------- */
  let y = M;
  const headerH = 74;
  card(M, y, CW, headerH);

  // avatar
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  doc.roundedRect(M + 14, y + 15, 44, 44, 10).fill("#dbeafe");
  doc
    .fillColor(blue)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(initials, M + 14, y + 29, { width: 44, align: "center" });

  // name + subtitle
  doc
    .fillColor(dark)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(name.toUpperCase(), M + 70, y + 18, { width: CW - 210, height: 18, ellipsis: true });
  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(9.5)
    .text(subtitle, M + 70, y + 40, { width: CW - 210, lineBreak: false });

  // status badges (right)
  let bx = M + CW - 16;
  if (openNow != null) {
    const w = badge(bx, y + 14, openNow ? "Open now" : "Closed", blue);
    bx -= w + 8;
  }
  badge(bx, y + 14, isOperational ? "Operational" : "Closed", green);

  /* ---------- stat tiles ---------- */
  y += headerH + 12;
  const tileH = 58;
  const gap = 10;
  const tileW = (CW - gap * 3) / 4;
  
  // small gold star (WinAnsi-safe, drawn as a polygon)
  const drawStar = (cx, cy, r, color) => {
    doc.save().fillColor(color);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      pts.push([cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)]);
    }
    doc.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach((p) => doc.lineTo(p[0], p[1]));
    doc.fill().restore();
  };

  const tiles = [
    { label: "Rating", value: rating != null ? `${rating}` : "—", star: rating != null },
    { label: "Total reviews", value: String(reviews) },
    { label: "Photos", value: String(breakdown.total) },
    { label: "Open hours", value: avgHours != null ? `${avgHours}h /day` : "—" },
  ];
  tiles.forEach((t, i) => {
    const x = M + i * (tileW + gap);
    card(x, y, tileW, tileH, "#f8fafc"); // Light tint inside cards for flat aesthetic structure
    doc
      .fillColor(muted)
      .font("Helvetica")
      .fontSize(8.5)
      .text(t.label, x + 12, y + 12, { width: tileW - 24 });
    doc
      .fillColor(dark)
      .font("Helvetica-Bold")
      .fontSize(17)
      .text(t.value, x + 12, y + 27, { width: tileW - 24, lineBreak: false });
    if (t.star) {
      const vw = doc.widthOfString(t.value);
      drawStar(x + 12 + vw + 12, y + 36, 6.5, "#f59e0b");
    }
  });

  /* ---------- contact & location (Dynamic Sizing) ---------- */
  y += tileH + 12;

  const contactRows = [
    { label: "Phone", value: place?.nationalPhoneNumber || "—" },
    { label: "Address", value: place?.formattedAddress || "—" },
    { label: "Website", value: place?.websiteUri || "—", color: place?.websiteUri ? blue : dark },
    { label: "Coordinates", value: place?.location?.latitude != null ? `${place.location.latitude}, ${place.location.longitude}` : "—" },
    { label: "Categories", value: readableCategories(place) }
  ];

  // Dynamic contact block height to handle wrapping gracefully
  let contactBodyHeight = 0;
  doc.font("Helvetica").fontSize(9.5);
  contactRows.forEach(row => {
    const textHeight = doc.heightOfString(String(row.value), { width: CW - 140 });
    row.computedHeight = Math.max(16, textHeight + 6);
    contactBodyHeight += row.computedHeight;
  });
  const contactH = 34 + contactBodyHeight + 12;

  card(M, y, CW, contactH);
  doc
    .fillColor(muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("CONTACT & LOCATION", M + 16, y + 12);

  let ry = y + 34;
  contactRows.forEach(row => {
    doc
      .fillColor(muted)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(row.label.toUpperCase(), M + 16, ry, { width: 100 });
    doc
      .fillColor(row.color || dark)
      .font("Helvetica")
      .fontSize(9.5)
      .text(row.value, M + 120, ry, { width: CW - 140 });
    ry += row.computedHeight;
  });

  /* ---------- opening hours + photo breakdown (2 cols) ---------- */
  y += contactH + 12;
  const colGap = 15;
  const colW = (CW - colGap) / 2;
  const colH = 136;

  // Opening hours
  card(M, y, colW, colH);
  doc
    .fillColor(muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("OPENING HOURS", M + 14, y + 12);
  const hrs = compactHours(place);
  let hy = y + 32;
  if (!hrs.length) {
    doc.fillColor(muted).font("Helvetica").fontSize(9).text("Not available", M + 14, hy);
  } else {
    hrs.slice(0, 5).forEach((h) => {
      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(h.label.toUpperCase(), M + 14, hy, { width: 90, lineBreak: false });
      doc
        .fillColor(dark)
        .font("Helvetica")
        .fontSize(9)
        .text(h.value, M + 14 + 95, hy, { width: colW - 120, lineBreak: false });
      hy += 15;
    });
  }
  const openAllWeek =
    hrs.length === 1 && String(hrs[0].label).includes("–");
  if (openAllWeek) {
    doc
      .fillColor(muted)
      .font("Helvetica-Oblique")
      .fontSize(8)
      .text("Open all week, no weekly off.", M + 14, y + colH - 18, {
        width: colW - 28,
      });
  }

  // Photo breakdown
  const px = M + colW + colGap;
  card(px, y, colW, colH);
  doc
    .fillColor(muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("PHOTO BREAKDOWN", px + 14, y + 12);
  doc
    .fillColor(green)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(String(breakdown.owner), px + 14, y + 32, { continued: true })
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(9)
    .text("  owner-uploaded");
  doc
    .fillColor(breakdown.customer > 0 ? blue : "#ef4444")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(String(breakdown.customer), px + 14, y + 58, { continued: true })
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(9)
    .text("  customer photos");
  // progress bar (owner share)
  const barY = y + colH - 26;
  const barW = colW - 28;
  const ownerShare = breakdown.total ? breakdown.owner / breakdown.total : 0;
  doc.roundedRect(px + 14, barY, barW, 7, 3.5).fill("#e2e8f0");
  if (ownerShare > 0)
    doc.roundedRect(px + 14, barY, Math.max(6, barW * ownerShare), 7, 3.5).fill(blue);

  /* ---------- improvement areas ---------- */
  y += colH + 12;
  const tips = buildImprovements(place, breakdown);
  // measure each tip so multi-line bullets don't overlap
  doc.font("Helvetica").fontSize(9);
  const tipHeights = tips.map(
    (t) => Math.max(14, doc.heightOfString(t, { width: CW - 46 }) + 5),
  );
  const tipsH = 32 + tipHeights.reduce((a, b) => a + b, 0) + 8;
  card(M, y, CW, tipsH, amberBg, amberBorder);
  
  // warning triangle (drawn manually for maximum rendering safety)
  const wtx = M + 16;
  const wty = y + 12;
  doc
    .save()
    .fillColor("#d97706")
    .moveTo(wtx + 6, wty)
    .lineTo(wtx + 12, wty + 11)
    .lineTo(wtx, wty + 11)
    .fill();
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("!", wtx, wty + 3.5, { width: 12, align: "center" });
  doc.restore();
  
  doc
    .fillColor(amberText)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("How Limbu AI will grow your business", M + 34, y + 12);
  let ty = y + 32;
  tips.forEach((t, i) => {
    doc
      .fillColor(amberText)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("•", M + 18, ty, { width: 10, lineBreak: false });
    doc
      .fillColor("#7c4a03")
      .font("Helvetica")
      .fontSize(9)
      .text(t, M + 30, ty, { width: CW - 46 });
    ty += tipHeights[i];
  });

  /* ---------- About Limbu AI ---------- */
  y += tipsH + 12;
  const aboutH = 96;
  card(M, y, CW, aboutH, "#eef4ff", "#dbe6ff");
  doc
    .fillColor(blue)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("About Limbu AI", M + 16, y + 12);
  doc
    .fillColor(dark)
    .font("Helvetica")
    .fontSize(8.8)
    .text(
      "Limbu AI is an all-in-one local growth platform that manages and optimizes your Google Business Profile — " +
        "so you get more calls, leads and customers. Review automation, local SEO & Map Pack ranking, WhatsApp chatbot, " +
        "Magic QR, weekly posts and a business website — all in one place.",
      M + 16,
      y + 30,
      { width: CW - 32, lineGap: 1.5 },
    );

  // service chips
  const services = [
    "Local Visibility",
    "More Calls & Leads",
    "Reviews & Ratings",
    "GMB Optimization",
    "WhatsApp Chatbot",
    "Website & Magic QR",
  ];
  let cx = M + 16;
  let cyy = y + aboutH - 24;
  doc.font("Helvetica-Bold").fontSize(7.5);
  services.forEach((s) => {
    const w = doc.widthOfString(s) + 14;
    if (cx + w > M + CW - 16) return;
    doc.roundedRect(cx, cyy, w, 15, 7.5).fill("#dbe6ff");
    doc.fillColor(blue).text(s, cx, cyy + 4, { width: w, align: "center" });
    cx += w + 6;
  });

  /* ---------- footer ---------- */
  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `Auto-generated by Limbu AI from public Google data  ·  ${new Date().toLocaleDateString(
        "en-IN",
      )}   ·   © Limbu AI`,
      M,
      H - 26,
      { width: CW, align: "center" },
    );

  doc.end();
  return pdfPromise;
}