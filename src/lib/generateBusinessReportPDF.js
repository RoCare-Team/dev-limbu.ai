import fs from "fs";
import PDFDocument from "pdfkit";

/* ============================ helpers ============================ */

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

function readableCategory(place) {
  const primary = place?.primaryType ? [place.primaryType] : [];
  const types = Array.isArray(place?.types) ? place.types : [];
  const merged = [...new Set([...primary, ...types])].filter(
    (t) => !GENERIC_TYPES.has(t),
  );
  const list = merged.length ? merged : types;
  return list.slice(0, 2).map(titleCase).join(" & ") || "Local Business";
}

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

/** Derives audit scores + missing fields from the Places data. */
function auditData(place, breakdown) {
  const fields = {
    "Business Name": !!(place?.displayName?.text || place?.displayName),
    "Phone Number": !!place?.nationalPhoneNumber,
    "Website Link": !!place?.websiteUri,
    "Business Hours": !!place?.regularOpeningHours,
    Address: !!place?.formattedAddress,
    Category: !!place?.primaryType,
    Photos: breakdown.total > 0,
  };
  const keys = Object.keys(fields);
  const present = keys.filter((k) => fields[k]).length;
  const completion = Math.round((present / keys.length) * 100);
  const missing = keys.filter((k) => !fields[k]);

  const rating = place?.rating != null ? Number(place.rating) : 0;
  const reviews = place?.userRatingCount || 0;

  const seoScore = Math.round(
    30 +
      (rating / 5) * 22 +
      Math.min(reviews / 100, 1) * 20 +
      Math.min(breakdown.total / 10, 1) * 13 +
      (completion / 100) * 15,
  );
  const currentScore = Math.round(seoScore * 0.7 + completion * 0.3);
  const potentialScore = Math.min(
    96,
    Math.round(currentScore + (100 - currentScore) * 0.82),
  );

  return {
    completion,
    missing,
    seoScore: Math.min(seoScore, 100),
    currentScore: Math.min(currentScore, 100),
    potentialScore,
    rating,
    reviews,
  };
}

/* ============================ renderer ============================ */

export async function generateBusinessReportPDFBuffer(place = {}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
  });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  const pdfPromise = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(buffers))),
  );

  const W = doc.page.width;
  const H = doc.page.height;
  const M = 40;
  const CW = W - M * 2;
  const BOTTOM = H - 55; // reserve space for footer

  /* professional palette */
  const blue = "#2563eb"; // primary accent
  const navy = "#0f172a"; // headings (slate-900)
  const dark = "#0f172a"; // strong text / values
  const body = "#334155"; // body copy (slate-700)
  const muted = "#64748b"; // labels (slate-500)
  const border = "#e2e8f0";
  const green = "#059669";
  const red = "#dc2626";
  const amber = "#d97706";
  const softBlue = "#eef4fd";
  const softAmber = "#fef8ec";

  /* data */
  const name = (place?.displayName?.text || place?.displayName || "Business").toString();
  const city =
    place?.businessReportCity ||
    (place?.formattedAddress || "").split(",").slice(-3, -2)[0]?.trim() ||
    "your area";
  const category = readableCategory(place);
  const breakdown = photoBreakdown(place, name);
  const audit = auditData(place, breakdown);
  const avgHours = avgHoursPerDay(place);

  /* ---- register Poppins (professional typeface); fall back to Helvetica ---- */
  let FN_R = "Helvetica";
  let FN_M = "Helvetica";
  let FN_SB = "Helvetica-Bold";
  let FN_B = "Helvetica-Bold";
  try {
    const dir = "public/fonts";
    if (fs.existsSync(`${dir}/Poppins-Regular.ttf`)) {
      doc.registerFont("PoppinsR", `${dir}/Poppins-Regular.ttf`);
      doc.registerFont("PoppinsM", `${dir}/Poppins-Medium.ttf`);
      doc.registerFont("PoppinsSB", `${dir}/Poppins-SemiBold.ttf`);
      doc.registerFont("PoppinsB", `${dir}/Poppins-Bold.ttf`);
      FN_R = "PoppinsR";
      FN_M = "PoppinsM";
      FN_SB = "PoppinsSB";
      FN_B = "PoppinsB";
    }
  } catch (e) {
    // keep Helvetica fallback
  }

  /* ---- per-page chrome (bg + watermark) ---- */
  const drawChrome = () => {
    doc.save();
    doc.rect(0, 0, W, H).fill("#ffffff");
    const logoPath = "public/images/bg-logo.png";
    if (fs.existsSync(logoPath)) {
      doc.opacity(0.035);
      const s = 300;
      doc.image(logoPath, (W - s) / 2, (H - s) / 2, { width: s });
    } else {
      doc
        .rotate(-30, { origin: [W / 2, H / 2] })
        .fillColor("#0f5132")
        .opacity(0.03)
        .fontSize(100)
        .font(FN_SB)
        .text("LIMBU AI", 0, H / 2 - 70, { width: W, align: "center" });
    }
    doc.restore();
  };
  doc.on("pageAdded", drawChrome);
  drawChrome();

  /* ---- primitives ---- */
  const ensure = (h) => {
    if (doc.y + h > BOTTOM) doc.addPage();
  };

  const heading = (text, opts = {}) => {
    const gap = opts.top != null ? opts.top : 14;
    doc.y += gap;
    ensure(26);
    const yy = doc.y;
    doc.save().rect(M, yy + 1, 4, 15).fill(opts.color || blue).restore();
    doc
      .fillColor(navy)
      .font(FN_SB)
      .fontSize(13)
      .text(text.toUpperCase(), M + 12, yy, { width: CW - 12 });
    doc.y = yy + 20;
    doc.x = M;
  };

  const numberedSub = (n, text) => {
    doc.y += 8;
    ensure(20);
    const yy = doc.y;
    doc.save().roundedRect(M, yy, 15, 14, 3).fill(blue).restore();
    doc
      .fillColor("#ffffff")
      .font(FN_SB)
      .fontSize(9)
      .text(String(n), M, yy + 3, { width: 15, align: "center" });
    doc
      .fillColor(blue)
      .font(FN_SB)
      .fontSize(11)
      .text(text, M + 22, yy + 1, { width: CW - 22 });
    doc.y = yy + 18;
    doc.x = M;
  };

  const statusBox = (text) => {
    ensure(24);
    const yy = doc.y;
    const h = 20;
    doc.save().roundedRect(M, yy, CW, h, 5).fill(softBlue).restore();
    doc
      .fillColor(blue)
      .font(FN_SB)
      .fontSize(9)
      .text(text, M + 10, yy + 6, { width: CW - 20, lineBreak: false, ellipsis: true });
    doc.y = yy + h + 6;
    doc.x = M;
  };

  const rich = (label, text, color = body) => {
    // measure with the wider bold font so the whole run always fits on one page
    doc.font(FN_SB).fontSize(9.3);
    const h = doc.heightOfString(label + "  " + text, { width: CW }) + 12;
    ensure(h);
    const yy = doc.y;
    doc.x = M;
    doc
      .font(FN_SB)
      .fontSize(9.3)
      .fillColor(dark)
      .text(label + "  ", M, yy, { continued: true, width: CW })
      .font(FN_R)
      .fillColor(color)
      .text(text);
    doc.y = Math.max(doc.y, yy) + 5;
    doc.x = M;
  };

  const bullet = (text, bold) => {
    doc.font(FN_SB).fontSize(9.3);
    const h = doc.heightOfString(text, { width: CW - 16 }) + 6;
    ensure(h);
    const yy = doc.y;
    doc
      .fillColor(blue)
      .font(FN_SB)
      .fontSize(9.3)
      .text("•", M + 4, yy, { width: 10 });
    doc
      .fillColor(bold ? dark : body)
      .font(bold ? FN_SB : FN_R)
      .fontSize(9.3)
      .text(text, M + 16, yy, { width: CW - 16 });
    doc.y = Math.max(doc.y, yy) + 4;
    doc.x = M;
  };

  const progressBar = (x, y, w, pct, color) => {
    doc.save();
    doc.roundedRect(x, y, w, 8, 4).fill("#e5e9f0");
    if (pct > 0)
      doc.roundedRect(x, y, Math.max(6, (w * pct) / 100), 8, 4).fill(color);
    doc.restore();
  };

  const arrow = (x, y, color) => {
    doc.save().fillColor(color);
    doc.moveTo(x, y - 4).lineTo(x + 8, y).lineTo(x, y + 4).fill();
    doc.restore();
  };

  /* ================= PAGE 1: title + intro ================= */
  doc
    .fillColor(navy)
    .font(FN_B)
    .fontSize(19)
    .text("GOOGLE BUSINESS HEALTH REPORT", M, M, { width: CW });
  doc
    .fillColor(muted)
    .font(FN_R)
    .fontSize(10.5)
    .text("Automated Audit & Strategic Local SEO Growth Blueprint", M, doc.y + 2);
  doc.y += 6;
  doc.save().rect(M, doc.y, CW, 3).fill(blue).restore();
  doc.y += 16;

  doc
    .fillColor(dark)
    .font(FN_SB)
    .fontSize(11)
    .text(`Hello to the team at ${name}!`, M, doc.y);
  doc.y += 4;
  doc
    .fillColor(body)
    .font(FN_R)
    .fontSize(9.6)
    .text(
      `Your Google Business Profile (GBP) is the digital storefront for your business. When local customers ` +
        `search for ${category} services in ${city}, your profile decides whether they choose you or your closest ` +
        `competitor. This audit analyzes your live Google data, identifies hidden ranking leaks, and provides a ` +
        `data-backed blueprint to dominate your local market.`,
      M,
      doc.y,
      { width: CW, lineGap: 2 },
    );

  /* ---------- BUSINESS SNAPSHOT ---------- */
  heading("Business Snapshot");
  const snap = [
    { label: "BUSINESS NAME", value: name, color: dark },
    { label: "CATEGORY", value: category, color: dark },
    { label: "CURRENT RATING", value: `${audit.rating || "—"} / 5`, color: amber, star: true },
    { label: "TOTAL REVIEWS", value: `${audit.reviews} Reviews`, color: dark },
    { label: "PROFILE COMPLETION", value: `${audit.completion}% Completed`, color: green, bar: audit.completion },
    { label: "LOCAL SEO SCORE", value: `${audit.seoScore} / 100`, color: blue, bar: audit.seoScore },
  ];
  const scGap = 12;
  const scW = (CW - scGap) / 2;
  const scH = 52;
  const startY = doc.y;
  snap.forEach((t, i) => {
    const col = i % 2;
    const rowi = Math.floor(i / 2);
    const x = M + col * (scW + scGap);
    const yy = startY + rowi * (scH + scGap);
    doc.save().roundedRect(x, yy, scW, scH, 8).fill("#f8fafc").lineWidth(1).strokeColor(border).stroke().restore();
    doc.save().roundedRect(x, yy, 4, scH, 2).fill(t.color).restore();
    doc.fillColor(muted).font(FN_SB).fontSize(8).text(t.label, x + 14, yy + 10, { width: scW - 24 });
    doc.fillColor(t.color).font(FN_SB).fontSize(13).text(t.value, x + 14, yy + 24, { width: scW - 24, lineBreak: false, ellipsis: true });
    if (t.star) {
      const vw = doc.widthOfString(t.value);
      doc.save().fillColor(amber);
      const cx = x + 14 + vw + 9, cy = yy + 31, r = 5;
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const rad = (Math.PI / 5) * k - Math.PI / 2;
        const rr = k % 2 === 0 ? r : r * 0.45;
        pts.push([cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)]);
      }
      doc.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => doc.lineTo(p[0], p[1]));
      doc.fill().restore();
    }
    if (t.bar != null) progressBar(x + 14, yy + scH - 12, scW - 28, t.bar, t.color);
  });
  doc.y = startY + 3 * (scH + scGap);
  doc.x = M;

  /* ---------- Expert Assessment ---------- */
  {
    const txt =
      audit.currentScore >= 70
        ? "Your profile holds a strong foundation, but you are leaving local traffic on the table. By closing informational gaps and automating customer engagement, we can push your visibility to the top of local search."
        : "Your profile has real potential but critical gaps are limiting reach. By completing your listing and automating reviews & content, we can dramatically increase your local search visibility.";
    doc.font(FN_M).fontSize(9.4);
    const th = doc.heightOfString("Expert Assessment:  " + txt, { width: CW - 28 });
    const h = th + 22;
    ensure(h + 6);
    const yy = doc.y;
    doc.save().roundedRect(M, yy, CW, h, 8).fill(softBlue).restore();
    doc.save().roundedRect(M, yy, 4, h, 2).fill(blue).restore();
    doc
      .fillColor(dark)
      .font(FN_SB)
      .fontSize(9.4)
      .text("Expert Assessment:  ", M + 14, yy + 11, { continued: true, width: CW - 28 })
      .font(FN_M)
      .fillColor(body)
      .text(txt);
    doc.y = yy + h;
    doc.x = M;
  }

  /* ================= DETAILED ANALYSIS ================= */
  heading("Detailed Analysis");

  // 1. Profile Completion
  numberedSub(1, "Profile Completion");
  statusBox(
    `Current Status: ${audit.completion}% Completed   |   Missing: ${
      audit.missing.length ? audit.missing.join(", ") : "None — great job!"
    }`,
  );
  rich("Why This Matters:", "Google's algorithm relies on data density. A complete profile builds instant trust with Google's indexing and signals that your business is active and legitimate.");
  rich("How It Affects Visibility:", "Profiles with missing fields get fewer impressions in the local Map Pack. Google hesitates to recommend businesses with incomplete operational details.");
  rich("How Limbu AI Fixes It:", "Limbu AI scans your profile 24/7, detects missing structural data, and auto-updates attributes so your listing stays close to 100% complete.");
  rich("Expected Improvement:", `Up to ${Math.min(100, audit.completion + 25)}% profile completion within the first 24 hours.`, green);

  // 2. Local SEO Analysis
  numberedSub(2, "Local SEO Analysis");
  statusBox(`Local SEO Score: ${audit.seoScore} / 100`);
  rich("Keyword Optimization:", `Your current profile captures basic search intent but lacks the hyper-local keyword clustering needed to rank for high-value transactional searches in ${city}.`);
  rich("Visibility Risk:", "Without consistent, keyword-rich updates and strong local signals, your business risks slipping below the top-3 Map Pack results — missing up to 70% of mobile click-throughs.");
  rich("How Limbu AI Helps:", "Limbu AI analyzes local search trends for your segment and auto-schedules geo-targeted, keyword-optimized posts that signal active relevance to Google's ranking algorithm.");
  rich("Expected Ranking Lift:", "Up to 45% increase in local Map Pack visibility within 90 days.", green);

  // 3. Reviews Analysis
  numberedSub(3, "Reviews Analysis");
  statusBox(`Current Rating: ${audit.rating || "—"} / 5   |   Total Reviews: ${audit.reviews}`);
  rich("Why Review Velocity Matters:", "Google monitors how frequently you receive new reviews. A stagnant review profile signals an inactive business and lowers your local ranking.");
  rich("Business Impact:", "Low review volume weakens buyer confidence when customers compare you directly against competitors nearby.");
  rich("Monthly Target:", "Target 15–30+ fresh reviews every month to shift consumer perception and outpace market averages.", dark);
  rich("How Magic QR Helps:", "Limbu AI deploys a Magic QR system at your counter and on invoices. Customers scan and are routed instantly to leave a positive Google review — removing all friction.");
  rich("Expected Improvement:", "A projected 300–500% surge in monthly review acquisition velocity.", green);

  // 4. Review Reply Analysis
  numberedSub(4, "Review Reply Analysis");
  rich("Why Google Values Replies:", "Responding to reviews signals that you actively manage your community. Google states that replying to reviews improves local SEO ranking.");
  rich("Impact on Trust:", "Unanswered reviews look like neglect. Prompt, professional replies build strong buyer confidence.");
  rich("Recommendation:", "Reply to 100% of incoming reviews — positive and negative — within 24–48 hours.");
  rich("How Limbu AI Auto-Reply Fixes It:", "Limbu AI reads and replies to incoming reviews instantly with personalized, context-aware responses that include natural local keywords — keeping your reply rate locked at 100%.", green);

  /* ================= TRANSFORM TABLE ================= */
  heading("How Limbu AI Transforms Your Business");
  {
    const rows = [
      ["Review Collection", "Low / manual", "50+ reviews/month via Magic QR"],
      ["Reply Rate", "Inconsistent", "100% instant AI auto-responses"],
      ["Google Posts", "Occasional / none", "Automated weekly AI updates"],
      ["Profile Content", `${audit.completion}% complete`, "100% complete & optimized"],
      ["SEO Monitoring", "Manual / blind spots", "Continuous local rank tracking"],
    ];
    const c1 = 120, c3x = M + CW - 200, arrowX = c3x - 22;
    ensure(30);
    let yy = doc.y;
    // header
    doc.save().roundedRect(M, yy, CW, 24, 5).fill(navy).restore();
    doc.fillColor("#ffffff").font(FN_SB).fontSize(8.5);
    doc.text("FEATURE", M + 10, yy + 8, { width: c1 - 10 });
    doc.text("CURRENT", M + c1, yy + 8, { width: c3x - (M + c1) - 20 });
    doc.text("AFTER LIMBU AI", c3x, yy + 8, { width: 200 });
    yy += 24;
    rows.forEach((r, i) => {
      doc.font(FN_R).fontSize(8.8);
      const h1 = doc.heightOfString(r[1], { width: c3x - (M + c1) - 24 });
      const h2 = doc.heightOfString(r[2], { width: 190 });
      const rh = Math.max(24, h1 + 12, h2 + 12);
      if (yy + rh > BOTTOM) {
        doc.addPage();
        yy = doc.y;
      }
      if (i % 2 === 1) doc.save().rect(M, yy, CW, rh).fill("#f8fafc").restore();
      doc.fillColor(dark).font(FN_SB).fontSize(8.8).text(r[0], M + 10, yy + 6, { width: c1 - 12 });
      doc.fillColor(muted).font(FN_R).fontSize(8.8).text(r[1], M + c1, yy + 6, { width: c3x - (M + c1) - 24 });
      arrow(arrowX, yy + rh / 2, blue);
      doc.fillColor(green).font(FN_SB).fontSize(8.8).text(r[2], c3x, yy + 6, { width: 190 });
      doc.save().moveTo(M, yy + rh).lineTo(M + CW, yy + rh).lineWidth(0.5).strokeColor(border).stroke().restore();
      yy += rh;
    });
    doc.y = yy + 4;
    doc.x = M;
  }

  /* ================= EXPECTED RESULTS ================= */
  heading("Expected Results (Next 90 Days)");
  bullet("Weekly Reviews: shift from a slow trickle to 5+ verified reviews weekly.");
  bullet("Reply Rate: locked permanently at 100%.");
  bullet("Local Search Visibility: +40% increase in map impressions.");
  bullet("Customer Conversions: +35% boost in call and direction clicks.");
  bullet("Local Ranking: a clear path to the coveted Top-3 Local Map Pack.");

  /* ================= PROJECTED IMPACT ================= */
  heading("Projected Business Impact");
  doc
    .fillColor(body)
    .font(FN_R)
    .fontSize(9.4)
    .text("Optimizing your profile translates directly to revenue. By scaling visibility and filling informational gaps, you can expect:", M, doc.y, { width: CW, lineGap: 2 });
  doc.y += 4;
  bullet("+40% more phone calls from mobile searchers looking for immediate service.", true);
  bullet("+35% more website visits from high-intent local prospects.", true);
  bullet("+50% higher customer trust, lowering sales friction and increasing walk-ins.", true);

  /* ================= FINAL SCORE ================= */
  heading("Final Business Score");
  ensure(90);
  {
    const yy = doc.y;
    const cardW = (CW - 60) / 2;
    const h = 74;
    // current
    doc.save().roundedRect(M, yy, cardW, h, 8).fill("#fef2f2").lineWidth(1).strokeColor("#fecaca").stroke().restore();
    doc.fillColor(muted).font(FN_SB).fontSize(9).text("CURRENT HEALTH SCORE", M, yy + 14, { width: cardW, align: "center" });
    doc.fillColor(red).font(FN_B).fontSize(28).text(`${audit.currentScore} / 100`, M, yy + 32, { width: cardW, align: "center" });
    // arrow
    arrow(M + cardW + 26, yy + h / 2, blue);
    doc.save().moveTo(M + cardW + 14, yy + h / 2).lineTo(M + cardW + 30, yy + h / 2).lineWidth(2).strokeColor(blue).stroke().restore();
    // potential
    const px = M + cardW + 60;
    doc.save().roundedRect(px, yy, cardW, h, 8).fill("#f0fdf4").lineWidth(1).strokeColor("#bbf7d0").stroke().restore();
    doc.fillColor(muted).font(FN_SB).fontSize(9).text("POTENTIAL AI SCORE", px, yy + 14, { width: cardW, align: "center" });
    doc.fillColor(green).font(FN_B).fontSize(28).text(`${audit.potentialScore} / 100`, px, yy + 32, { width: cardW, align: "center" });
    doc.y = yy + h + 6;
    doc.x = M;
  }

  /* ================= CTA ================= */
  {
    const pad = 16;
    const innerW = CW - pad * 2;
    const l1 = "Your Google Business Profile has a strong foundation, but manual management takes time away from running your business.";
    const l2 = "Limbu AI works as your round-the-clock digital growth engineer — continuously monitoring your profile, accelerating reviews with frictionless Magic QR codes, crafting instant hyper-local AI replies, scheduling engaging posts, and tracking your SEO performance.";
    const l3 = "Start using Limbu AI today and let AI continuously optimize your Google Business Profile.";
    doc.font(FN_R).fontSize(9.4);
    const bh = doc.heightOfString(l1, { width: innerW }) + doc.heightOfString(l2, { width: innerW }) + doc.heightOfString(l3, { width: innerW });
    const h = bh + 64;
    ensure(h + 8);
    const yy = doc.y + 6;
    doc.save().roundedRect(M, yy, CW, h, 10).fill(navy).restore();
    doc.fillColor("#ffffff").font(FN_SB).fontSize(13).text("READY TO GROW YOUR BUSINESS?", M + pad, yy + 14, { width: innerW });
    doc.fillColor("#cbd5e1").font(FN_R).fontSize(9.4).text(l1, M + pad, yy + 36, { width: innerW, lineGap: 2 });
    doc.fillColor("#cbd5e1").font(FN_R).text(l2, M + pad, doc.y + 4, { width: innerW, lineGap: 2 });
    doc.fillColor("#ffffff").font(FN_SB).text(l3, M + pad, doc.y + 4, { width: innerW, lineGap: 2 });
  }

  /* ================= footers with page numbers ================= */
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // writing inside the bottom margin would auto-add pages — disable it here
    doc.page.margins.bottom = 0;
    doc.save();
    doc.moveTo(M, H - 42).lineTo(W - M, H - 42).lineWidth(0.5).strokeColor(border).stroke();
    doc.fillColor(muted).font(FN_R).fontSize(8);
    doc.text("Powered by Limbu AI  •  Growth Audit", M, H - 34, {
      width: CW / 2,
      lineBreak: false,
    });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, M + CW / 2, H - 34, {
      width: CW / 2,
      align: "right",
      lineBreak: false,
    });
    doc.restore();
  }

  doc.end();
  return pdfPromise;
}
