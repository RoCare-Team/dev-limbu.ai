/**
 * chatbotHealthPdfGenerator.js  —  Server-side GMB Health Score PDF
 *
 * Visual design mirrors GBPAuditCard.jsx exactly:
 *   Page 1 → Header + Business Info + Speedometer Gauge + 5 Stat Cards
 *   Page 2 → Categories + Services + Score Breakdown (ring charts)
 *   Page 3 → AI Guidance + Action Required + What You're Doing Right
 *
 * Uses pdfkit (Node.js, no browser DOM required).
 */

import PDFDocument from "pdfkit";

// ── Brand colours (mirror GBPAuditCard) ──────────────────────────────────────
const C = {
  yellow:   "#EAB308",   // --lemon-hover
  black:    "#1C1C1E",
  dark:     "#1f2937",
  slate9:   "#0f172a",
  slate8:   "#1e293b",
  slate7:   "#334155",
  slate6:   "#475569",
  slate5:   "#64748b",
  slate4:   "#94a3b8",
  slate3:   "#cbd5e1",
  slate2:   "#e2e8f0",
  slate1:   "#f1f5f9",
  slate0:   "#f8fafc",
  white:    "#FFFFFF",
  red:      "#ef4444",
  orange:   "#fb923c",
  green:    "#22c55e",
  blue:     "#3b82f6",
  purple:   "#8b5cf6",
  pink:     "#ec4899",
  teal:     "#10b981",
  // status tones
  successDark: "#15803d",
  successBg:   "#f0fdf4",
  successBdr:  "#bbf7d0",
  dangerDark:  "#b91c1c",
  dangerBg:    "#fef2f2",
  dangerBdr:   "#fecaca",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrapAudit(raw) {
  if (!raw || typeof raw !== "object") return {};
  return ("" in raw) ? raw[""] : raw;
}

function scoreStyle(score) {
  if (score >= 90) return { color: C.green,  label: "Great Shape"         };
  if (score >= 60) return { color: C.yellow, label: "Needs Work"          };
  return               { color: C.red,    label: "Needs Urgent Fixes"  };
}

function scoreBarColor(pct) {
  if (pct >= 90) return C.green;
  if (pct >= 60) return C.orange;
  return C.red;
}

/** Draw a filled rounded-rect */
function rrect(doc, x, y, w, h, r, fill, stroke) {
  doc.save().roundedRect(x, y, w, h, r);
  if (fill)   { doc.fillColor(fill);   doc.fill();   }
  if (stroke) { doc.strokeColor(stroke); doc.stroke(); }
  doc.restore();
}

/** Draw footer on every page */
function addFooter(doc) {
  const pw = doc.page.width;
  const ph = doc.page.height;
  const L  = 40;
  const PW = pw - 80;

  doc.save()
    .moveTo(L, ph - 42)
    .lineTo(L + PW, ph - 42)
    .lineWidth(0.5).strokeColor(C.slate2).stroke()
    .restore();

  doc.save()
    .fontSize(8).fillColor(C.slate4).font("Helvetica")
    .text("Powered by Limbu.ai  •  limbu.ai", L, ph - 32, { width: PW, align: "center" })
    .restore();
}

// ── Speedometer gauge (mirrors Speedometer.jsx exactly) ───────────────────────
function drawSpeedometer(doc, cx, cy, score) {
  const SCALE = 0.62;
  const R     = Math.round(140 * SCALE);   // 87
  const SW    = Math.round(24  * SCALE);   // 15
  const DEG   = (d) => d * Math.PI / 180;

  const pt = (deg) => ({
    x: cx + R * Math.cos(DEG(deg)),
    y: cy + R * Math.sin(DEG(deg)),
  });

  // Three arc segments — using SVG path inside pdfkit
  const arcPath = (a1, a2) => {
    const s = pt(a1); const e = pt(a2);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  // Background track (gray)
  doc.save().path(arcPath(180, 360)).lineWidth(SW).lineCap("round").strokeColor(C.slate2).stroke().restore();

  // Red zone 180°→288°
  doc.save().path(arcPath(180, 288)).lineWidth(SW).lineCap("butt").strokeColor(C.red).stroke().restore();
  // Orange zone 288°→324°
  doc.save().path(arcPath(288, 324)).lineWidth(SW).lineCap("butt").strokeColor(C.orange).stroke().restore();
  // Green zone 324°→360°
  doc.save().path(arcPath(324, 360)).lineWidth(SW).lineCap("round").strokeColor(C.green).stroke().restore();

  // Tick labels: 0, 25, 50, 75, 100
  const LABEL_R = Math.round((140 - 35) * SCALE);
  [0, 25, 50, 75, 100].forEach((val) => {
    const deg = 180 + (val / 100) * 180;
    const rad = DEG(deg);
    const lx  = cx + LABEL_R * Math.cos(rad);
    const ly  = cy + LABEL_R * Math.sin(rad);
    doc.save().fontSize(7).fillColor(C.slate5).font("Helvetica")
      .text(String(val), lx - 8, ly - 4, { width: 16, align: "center" })
      .restore();
  });

  // Needle
  const needleDeg = 180 + (score / 100) * 180;
  const needleR   = Math.round((140 - 20) * SCALE);
  const nx = cx + needleR * Math.cos(DEG(needleDeg));
  const ny = cy + needleR * Math.sin(DEG(needleDeg));

  // Dark center hub
  doc.circle(cx, cy, Math.round(45 * SCALE)).fillColor(C.dark).fill();

  // Needle line
  doc.save()
    .moveTo(cx, cy).lineTo(nx, ny)
    .lineWidth(3).lineCap("round").strokeColor(C.dark).stroke()
    .restore();

  // Red centre dot
  doc.circle(cx, cy, Math.round(6 * SCALE)).fillColor(C.red).fill();
}

// ── Ring chart for ScoreItem (mirrors ScoreItem.jsx) ─────────────────────────
function drawRing(doc, cx, cy, r, pct, color) {
  const DEG = (d) => d * Math.PI / 180;
  const SW  = 4;

  // Background gray ring
  doc.save()
    .circle(cx, cy, r)
    .lineWidth(SW).strokeColor(C.slate2)
    .stroke()
    .restore();

  if (pct <= 0) return;

  // Colored arc (starts at -90°=North, goes clockwise)
  const startDeg = -90;
  const endDeg   = startDeg + (pct / 100) * 360;
  const clampEnd = Math.min(endDeg, startDeg + 359.9); // avoid full-circle path issue

  const sx = cx + r * Math.cos(DEG(startDeg));
  const sy = cy + r * Math.sin(DEG(startDeg));
  const ex = cx + r * Math.cos(DEG(clampEnd));
  const ey = cy + r * Math.sin(DEG(clampEnd));
  const large = (pct > 50) ? 1 : 0;

  doc.save()
    .path(`M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`)
    .lineWidth(SW).lineCap("round").strokeColor(color)
    .stroke()
    .restore();
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function drawStatCard(doc, x, y, w, h, title, value, color) {
  // Card bg + border
  rrect(doc, x, y, w, h, 10, C.white);
  doc.save().roundedRect(x, y, w, h, 10).lineWidth(0.8).strokeColor(C.slate2).stroke().restore();

  // Color accent strip on left
  rrect(doc, x, y, 4, h, 2, color);

  // Value
  doc.save()
    .fontSize(22).font("Helvetica-Bold").fillColor(C.black)
    .text(String(value ?? "—"), x + 12, y + 12, { width: w - 20, align: "center" })
    .restore();

  // Label
  doc.save()
    .fontSize(8).font("Helvetica").fillColor(C.slate5)
    .text(title.toUpperCase(), x + 12, y + 40, { width: w - 20, align: "center", characterSpacing: 0.5 })
    .restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function generateHealthScorePdf(opts) {
  const { rawData = {}, generatedAt = new Date().toISOString() } = opts;

  const audit          = unwrapAudit(rawData);
  const snap           = audit.dataSnapshot ?? {};
  const scoreBreakdown = Array.isArray(audit.scoreBreakdown) ? audit.scoreBreakdown : [];
  const recSignals     = audit.recommendationSignals ?? {};
  const guidanceText   = audit.output?.[0]?.content?.[0]?.text || "";

  const score        = audit.totalScore ?? audit.score ?? audit.healthScore ?? audit.health_score ?? opts.score ?? null;
  const statusLabel  = audit.status ?? scoreStyle(score ?? 0).label;
  const businessName = snap.businessName || opts.businessName || "Your Business";
  const address      = snap.storeAddress || snap.address || opts.address || "";
  const phone        = snap.phone || "";
  const website      = snap.website || "";

  const sStyle = scoreStyle(score ?? 0);

  const categories = [snap.primaryCategory, ...(snap.additionalCategories || [])].filter(Boolean);
  const services   = (snap.services || []).map((s) =>
    typeof s === "string" ? s : s?.displayName || String(s),
  );

  const severityRank = { high: 1, medium: 2, low: 3 };
  const actionItems = Object.entries(recSignals)
    .filter(([, d]) => d && d.reason)
    .map(([, d]) => d)
    .sort((a, b) =>
      (severityRank[a.severity?.toLowerCase()] || 99) -
      (severityRank[b.severity?.toLowerCase()] || 99),
    );

  const successItems = scoreBreakdown
    .filter((item) => item.outOf > 0 && item.score / item.outOf >= 0.8)
    .map((item) => item.factor);

  const dateStr = new Date(generatedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size:    "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title:   `Business Health Report — ${businessName}`,
        Author:  "Limbu AI",
        Subject: "Google Business Profile Health Report",
      },
      autoFirstPage: false,
    });

    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW  = 595.28;
    const PH  = 841.89;
    const L   = 40;        // left margin
    const R   = PW - 40;   // right edge
    const UW  = PW - 80;   // usable width
    const CX  = PW / 2;    // page center x

    // ─────────────────────────────────────────────────────────────────────────
    //  PAGE 1 — Header · Business Info · Speedometer · Stat Cards
    // ─────────────────────────────────────────────────────────────────────────
    doc.addPage();

    // ── Top header bar ────────────────────────────────────────────────────────
    const hBarH = 60;
    rrect(doc, 0, 0, PW, hBarH, 0, C.slate0);

    // Yellow left accent
    rrect(doc, 0, 0, 5, hBarH, 0, C.yellow);

    // Icon bubble
    rrect(doc, L, 15, 30, 30, 6, C.yellow + "22");
    // Activity icon placeholder (simple pulse lines)
    doc.save()
      .moveTo(L + 8,  30).lineTo(L + 12, 24).lineTo(L + 16, 36).lineTo(L + 20, 28).lineTo(L + 22, 30)
      .lineWidth(1.5).strokeColor(C.yellow).stroke()
      .restore();

    // "Business Health Report"
    doc.save()
      .font("Helvetica-Bold").fontSize(15).fillColor(C.black)
      .text("Business ", L + 40, 20, { continued: true })
      .fillColor(C.yellow).text("Health ", { continued: true })
      .fillColor(C.black).text("Report")
      .restore();

    // Generated date
    doc.save()
      .font("Helvetica").fontSize(8).fillColor(C.slate5)
      .text(`Generated: ${dateStr}`, R - 120, 24, { width: 120, align: "right" })
      .restore();

    // ── Business Info Card ────────────────────────────────────────────────────
    let y = hBarH + 12;
    const infoH = phone || website ? 72 : 60;
    rrect(doc, L, y, UW, infoH, 10, C.slate0);
    doc.save().roundedRect(L, y, UW, infoH, 10).lineWidth(0.5).strokeColor(C.slate2).stroke().restore();

    // Location pin dot
    doc.circle(L + 18, y + 18, 5).fillColor(C.yellow).fill();

    doc.save()
      .font("Helvetica-Bold").fontSize(13).fillColor(C.black)
      .text(businessName, L + 32, y + 10, { width: UW - 50 })
      .restore();

    if (address) {
      doc.save()
        .font("Helvetica").fontSize(9).fillColor(C.slate5)
        .text(address, L + 32, y + 27, { width: UW - 50 })
        .restore();
    }

    if (phone || website) {
      let infoX = L + 32;
      if (phone) {
        doc.save().font("Helvetica-Bold").fontSize(9).fillColor(C.slate7)
          .text(`☎  ${phone}`, infoX, y + 50, { width: 160 }).restore();
        infoX += 170;
      }
      if (website) {
        doc.save().font("Helvetica").fontSize(9).fillColor(C.blue)
          .text(`🌐  ${website}`, infoX, y + 50, { width: UW - (infoX - L) - 10 }).restore();
      }
    }

    y += infoH + 16;

    // ── Speedometer gauge ────────────────────────────────────────────────────
    const gaugeY = y + 90; // center of gauge
    drawSpeedometer(doc, CX, gaugeY, score ?? 0);

    // Score number below gauge
    const scoreY = gaugeY + 100;
    const scoreNum = score !== null ? String(score) : "—";

    doc.save()
      .font("Helvetica-Bold").fontSize(54).fillColor(sStyle.color)
      .text(scoreNum, CX - 60, scoreY, { width: 120, align: "center" })
      .restore();

    doc.save()
      .font("Helvetica").fontSize(16).fillColor(C.slate4)
      .text("/100", CX - 30, scoreY + 44, { width: 60, align: "center" })
      .restore();

    // Status badge pill
    const badgeW = 140; const badgeH = 26; const badgeX = CX - badgeW / 2;
    const badgeY_ = scoreY + 70;
    rrect(doc, badgeX, badgeY_, badgeW, badgeH, 13, sStyle.color + "22");
    doc.save().roundedRect(badgeX, badgeY_, badgeW, badgeH, 13).lineWidth(1).strokeColor(sStyle.color + "55").stroke().restore();
    doc.save()
      .font("Helvetica-Bold").fontSize(10).fillColor(sStyle.color)
      .text(statusLabel.toUpperCase(), badgeX, badgeY_ + 7, { width: badgeW, align: "center", characterSpacing: 1.5 })
      .restore();

    // Tagline
    doc.save()
      .font("Helvetica").fontSize(9).fillColor(C.slate5)
      .text(
        `Based on 24 key success factors, your profile currently captures ${score ?? 0}% of its potential customers.`,
        L + 40, badgeY_ + 36, { width: UW - 80, align: "center" },
      )
      .restore();

    // ── 5 Stat Cards ──────────────────────────────────────────────────────────
    const statCards = [
      { title: "Reviews", value: snap.totalReviews    ?? "—", color: C.blue   },
      { title: "Rating",  value: snap.averageRating   ?? "—", color: C.yellow },
      { title: "Posts",   value: snap.totalPosts      ?? "—", color: C.purple },
      { title: "Recent",  value: snap.postsLast30Days ?? "—", color: C.teal   },
      { title: "Media",   value: snap.totalMedia      ?? "—", color: C.pink   },
    ];

    const cW  = Math.floor((UW - 16) / 5);  // card width
    const cH  = 62;
    const cY  = badgeY_ + 76;

    statCards.forEach((sc, i) => {
      drawStatCard(doc, L + i * (cW + 4), cY, cW, cH, sc.title, sc.value, sc.color);
    });

    addFooter(doc);

    // ─────────────────────────────────────────────────────────────────────────
    //  PAGE 2 — Categories · Services · Score Breakdown
    // ─────────────────────────────────────────────────────────────────────────
    doc.addPage();

    let y2 = 30;

    // ── Categories ────────────────────────────────────────────────────────────
    if (categories.length) {
      doc.save()
        .font("Helvetica-Bold").fontSize(9).fillColor(C.slate5)
        .text("CORE CATEGORIES", L, y2, { characterSpacing: 2 })
        .restore();

      y2 += 16;
      let tagX = L;
      categories.slice(0, 6).forEach((cat, i) => {
        const tw = Math.min(doc.widthOfString(cat, { fontSize: 9 }) + 20, 180);
        if (tagX + tw > R - 10) { tagX = L; y2 += 22; }
        rrect(doc, tagX, y2, tw, 18, 9, i === 0 ? C.black : C.white);
        if (i !== 0) { doc.save().roundedRect(tagX, y2, tw, 18, 9).lineWidth(0.5).strokeColor(C.slate2).stroke().restore(); }
        doc.save()
          .font("Helvetica-Bold").fontSize(8)
          .fillColor(i === 0 ? C.white : C.slate7)
          .text(cat + (i === 0 ? " (Primary)" : ""), tagX + 6, y2 + 4, { width: tw - 12 })
          .restore();
        tagX += tw + 6;
      });
      y2 += 30;
    }

    // ── Services ──────────────────────────────────────────────────────────────
    if (services.length) {
      doc.save()
        .font("Helvetica-Bold").fontSize(9).fillColor(C.slate5)
        .text("IDENTIFIED SERVICES", L, y2, { characterSpacing: 2 })
        .restore();

      y2 += 16;
      let tagX2 = L;
      services.slice(0, 8).forEach((svc) => {
        const tw = Math.min(doc.widthOfString(svc, { fontSize: 9 }) + 20, 200);
        if (tagX2 + tw > R - 10) { tagX2 = L; y2 += 22; }
        rrect(doc, tagX2, y2, tw, 18, 9, C.white);
        doc.save().roundedRect(tagX2, y2, tw, 18, 9).lineWidth(0.5).strokeColor(C.slate2).stroke().restore();
        doc.save()
          .font("Helvetica").fontSize(8).fillColor(C.slate7)
          .text(svc, tagX2 + 6, y2 + 4, { width: tw - 12 })
          .restore();
        tagX2 += tw + 6;
      });
      y2 += 30;
    }

    // ── Score Breakdown heading ───────────────────────────────────────────────
    if (scoreBreakdown.length) {
      // Divider + title
      doc.save().moveTo(L, y2).lineTo(R, y2).lineWidth(0.5).strokeColor(C.slate2).stroke().restore();
      y2 += 14;

      doc.save()
        .font("Helvetica-Bold").fontSize(16).fillColor(C.black)
        .text("Detailed ", L, y2, { continued: true })
        .fillColor(C.yellow).text("Performance ", { continued: true })
        .fillColor(C.black).text("Check")
        .restore();

      // Yellow underline bar
      const titleW = doc.widthOfString("Detailed Performance Check", { fontSize: 16 }) + 10;
      rrect(doc, L, y2 + 22, 48, 3, 1.5, C.black);

      y2 += 36;

      // Grid: 3 cards per row
      const COLS  = 3;
      const GAP   = 10;
      const CARD_W = Math.floor((UW - GAP * (COLS - 1)) / COLS); // ~160
      const RING_R = 20;
      const RING_CY_OFF = 28;

      scoreBreakdown.forEach((item, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const cx_  = L + col * (CARD_W + GAP);
        const cy_  = y2 + row * 0;  // calculated below after first row height

        // Calculate card height based on details
        const detailsCount = Array.isArray(item.details) ? item.details.length : 0;
        const CARD_H = 90 + detailsCount * 18;

        const cardY = y2 + row * (CARD_H + GAP);

        // Check if we need a new page
        if (cardY + CARD_H > PH - 60) {
          doc.addPage();
          y2 = 30;
        }
        const actualCardY = cardY < y2 ? y2 : cardY;

        // Card background + border
        rrect(doc, cx_, actualCardY, CARD_W, CARD_H, 10, C.white);
        doc.save().roundedRect(cx_, actualCardY, CARD_W, CARD_H, 10).lineWidth(0.7).strokeColor(C.slate2).stroke().restore();

        // Ring chart
        const pct   = item.outOf > 0 ? Math.round((item.score / item.outOf) * 100) : 0;
        const rCol  = scoreBarColor(pct);
        const ringCX = cx_ + CARD_W / 2;
        const ringCY = actualCardY + RING_CY_OFF;
        drawRing(doc, ringCX, ringCY, RING_R, pct, rCol);

        // Percentage text inside ring
        doc.save()
          .font("Helvetica-Bold").fontSize(10).fillColor(rCol)
          .text(`${pct}%`, ringCX - 14, ringCY - 7, { width: 28, align: "center" })
          .restore();

        // Factor name
        doc.save()
          .font("Helvetica-Bold").fontSize(9).fillColor(C.dark)
          .text(item.factor, cx_ + 6, actualCardY + RING_CY_OFF + RING_R + 8, { width: CARD_W - 12, align: "center" })
          .restore();

        // Score/outOf pts
        doc.save()
          .font("Helvetica").fontSize(8).fillColor(C.slate5)
          .text(`${item.score}/${item.outOf} pts`, cx_ + 6, actualCardY + RING_CY_OFF + RING_R + 22, { width: CARD_W - 12, align: "center" })
          .restore();

        // Detail sub-items
        if (detailsCount > 0) {
          doc.save()
            .moveTo(cx_ + 8, actualCardY + RING_CY_OFF + RING_R + 36)
            .lineTo(cx_ + CARD_W - 8, actualCardY + RING_CY_OFF + RING_R + 36)
            .lineWidth(0.4).strokeColor(C.slate2).stroke()
            .restore();

          item.details.forEach((d, di) => {
            const dy = actualCardY + RING_CY_OFF + RING_R + 42 + di * 18;
            doc.save().font("Helvetica").fontSize(7).fillColor(C.slate6)
              .text(d.item, cx_ + 8, dy, { width: CARD_W - 50 })
              .restore();
            doc.save().font("Helvetica-Bold").fontSize(7).fillColor(C.dark)
              .text(`${d.score}/${d.outOf}`, cx_ + CARD_W - 38, dy, { width: 30, align: "right" })
              .restore();
          });
        }
      });
    }

    addFooter(doc);

    // ─────────────────────────────────────────────────────────────────────────
    //  PAGE 3 — AI Guidance · Action Required · What You're Doing Right
    // ─────────────────────────────────────────────────────────────────────────
    doc.addPage();
    let y3 = 30;

    // ── AI Guidance / Smart Advice ────────────────────────────────────────────
    if (guidanceText) {
      // Section header
      rrect(doc, L, y3, UW, 30, 8, C.slate1);
      doc.save().roundedRect(L, y3, UW, 30, 8).lineWidth(0.5).strokeColor(C.slate2).stroke().restore();
      doc.save()
        .font("Helvetica-Bold").fontSize(12).fillColor(C.black)
        .text("Smart ", L + 12, y3 + 8, { continued: true })
        .fillColor(C.yellow).text("Advice")
        .restore();

      y3 += 38;

      // Render guidance text (line by line, same logic as JSX)
      guidanceText.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "---") { y3 += 6; return; }

        if (trimmed.startsWith("###")) {
          y3 += 4;
          doc.save().font("Helvetica-Bold").fontSize(11).fillColor(C.dark)
            .text(trimmed.replace(/###/g, "").trim(), L, y3, { width: UW })
            .restore();
          y3 += doc.currentLineHeight() + 4;
          return;
        }

        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          doc.save().font("Helvetica-Bold").fontSize(9).fillColor(C.slate6)
            .text(trimmed.replace(/\*\*/g, "").trim().toUpperCase(), L, y3, { width: UW, characterSpacing: 0.8 })
            .restore();
          y3 += doc.currentLineHeight() + 3;
          return;
        }

        if (trimmed.startsWith("•")) {
          doc.circle(L + 5, y3 + 4, 2).fillColor(C.slate5).fill();
          doc.save().font("Helvetica").fontSize(9).fillColor(C.slate7)
            .text(trimmed.replace("•", "").trim(), L + 14, y3, { width: UW - 14 })
            .restore();
          y3 += doc.currentLineHeight() + 3;
          return;
        }

        doc.save().font("Helvetica").fontSize(9).fillColor(C.slate7)
          .text(trimmed, L, y3, { width: UW })
          .restore();
        y3 += doc.currentLineHeight() + 3;

        if (y3 > PH - 80) { doc.addPage(); y3 = 30; }
      });

      y3 += 12;
    }

    // ── Action Required ───────────────────────────────────────────────────────
    if (actionItems.length) {
      const boxItems = actionItems.slice(0, 7);
      const boxH = 40 + boxItems.length * 38;

      if (y3 + boxH > PH - 60) { doc.addPage(); y3 = 30; }

      rrect(doc, L, y3, UW, boxH, 12, C.dangerBg);
      doc.save().roundedRect(L, y3, UW, boxH, 12).lineWidth(1.5).strokeColor(C.dangerBdr).stroke().restore();

      doc.save()
        .font("Helvetica-Bold").fontSize(13).fillColor(C.dangerDark)
        .text("❌  Action Required", L + 14, y3 + 12, { width: UW - 28 })
        .restore();

      const severityColors = { high: C.red, medium: C.orange, low: C.yellow };
      const severityBg     = { high: "#fee2e2", medium: "#ffedd5", low: "#fef9c3" };

      boxItems.forEach((item, i) => {
        const iy = y3 + 38 + i * 38;

        // Alert circle icon (red)
        doc.circle(L + 22, iy + 8, 6).lineWidth(1.5).strokeColor(C.red).stroke();
        doc.save().font("Helvetica-Bold").fontSize(7).fillColor(C.red)
          .text("!", L + 19, iy + 4, { width: 6, align: "center" }).restore();

        // Severity badge
        const sev = (item.severity || "low").toLowerCase();
        const bw  = 36;
        rrect(doc, R - bw - 4, iy + 1, bw, 14, 4, severityBg[sev] || severityBg.low);
        doc.save().font("Helvetica-Bold").fontSize(7)
          .fillColor(severityColors[sev] || C.yellow)
          .text(sev.toUpperCase(), R - bw - 4, iy + 4, { width: bw, align: "center", characterSpacing: 0.5 })
          .restore();

        // Reason
        doc.save().font("Helvetica-Bold").fontSize(9).fillColor(C.dark)
          .text(item.reason, L + 34, iy, { width: UW - bw - 50 })
          .restore();

        // Impact
        if (item.impact) {
          doc.save().font("Helvetica").fontSize(8).fillColor(C.slate5)
            .text(`↳ ${item.impact}`, L + 36, iy + 14, { width: UW - bw - 52 })
            .restore();
        }
      });

      // Tagline
      doc.save().font("Helvetica").fontSize(8).fillColor(C.dangerDark + "99")
        .text("Fixing these can significantly improve your local ranking.", L + 14, y3 + boxH - 18, { width: UW - 28 })
        .restore();

      y3 += boxH + 14;
    }

    // ── What You're Doing Right ───────────────────────────────────────────────
    if (successItems.length) {
      const boxH2 = 40 + successItems.length * 22;

      if (y3 + boxH2 > PH - 60) { doc.addPage(); y3 = 30; }

      rrect(doc, L, y3, UW, boxH2, 12, C.successBg);
      doc.save().roundedRect(L, y3, UW, boxH2, 12).lineWidth(1.5).strokeColor(C.successBdr).stroke().restore();

      doc.save()
        .font("Helvetica-Bold").fontSize(13).fillColor(C.successDark)
        .text("✓  What You're Doing Right", L + 14, y3 + 12, { width: UW - 28 })
        .restore();

      successItems.forEach((factor, i) => {
        const iy = y3 + 38 + i * 22;
        doc.circle(L + 22, iy + 6, 5).fillColor(C.successBg).lineWidth(1.5).strokeColor(C.green).stroke();
        // checkmark
        doc.save().moveTo(L + 19, iy + 6).lineTo(L + 21, iy + 8).lineTo(L + 25, iy + 4)
          .lineWidth(1.5).strokeColor(C.green).stroke().restore();

        doc.save().font("Helvetica-Bold").fontSize(9).fillColor(C.dark)
          .text(factor, L + 34, iy, { width: UW - 44 })
          .restore();
      });

      y3 += boxH2 + 14;
    }

    addFooter(doc);
    doc.end();
  });
}

// ── Text summary builder (WhatsApp) ──────────────────────────────────────────

export function buildHealthScoreText(opts) {
  const { rawData = {} } = opts;

  const audit          = unwrapAudit(rawData);
  const score          = audit.totalScore ?? audit.score ?? audit.healthScore ?? audit.health_score ?? null;
  const status         = audit.status ?? null;
  const snap           = audit.dataSnapshot ?? {};
  const scoreBreakdown = Array.isArray(audit.scoreBreakdown) ? audit.scoreBreakdown : [];
  const recSignals     = audit.recommendationSignals ?? {};

  const businessName = snap.businessName || opts.businessName || "Your Business";
  const storeAddress = snap.storeAddress || snap.address || "";
  const sStyle       = scoreStyle(score ?? 0);

  const lines = [];

  lines.push(`📊 *GMB Health Report — ${businessName}*`);
  if (storeAddress) lines.push(`📍 ${storeAddress}`);
  lines.push(``);
  lines.push(`🏆 *Overall Score: ${score !== null ? `${score}/100` : "N/A"} — ${status || sStyle.label}*`);
  lines.push(``);

  const stats = [];
  if (snap.totalReviews    != null) stats.push(`💬 Reviews: ${snap.totalReviews}`);
  if (snap.averageRating   != null) stats.push(`⭐ Rating: ${snap.averageRating}`);
  if (snap.totalPosts      != null) stats.push(`📝 Posts: ${snap.totalPosts}`);
  if (snap.postsLast30Days != null) stats.push(`🕐 Posts (30d): ${snap.postsLast30Days}`);
  if (snap.totalMedia      != null) stats.push(`🖼️ Media: ${snap.totalMedia}`);
  if (stats.length) { lines.push(...stats); lines.push(``); }

  if (snap.phone)   lines.push(`📞 ${snap.phone}`);
  if (snap.website) lines.push(`🌐 ${snap.website}`);
  if (snap.phone || snap.website) lines.push(``);

  if (scoreBreakdown.length) {
    lines.push(`📋 *Performance Breakdown:*`);
    scoreBreakdown.forEach((item) => {
      const pct = item.outOf > 0 ? Math.round((item.score / item.outOf) * 100) : 0;
      const bar = pct >= 80 ? "🟢" : pct >= 50 ? "🟡" : "🔴";
      lines.push(`  ${bar} ${item.factor}: ${item.score}/${item.outOf} (${pct}%)`);
    });
    lines.push(``);
  }

  const severityRank = { high: 1, medium: 2, low: 3 };
  const actionItems  = Object.entries(recSignals)
    .filter(([, d]) => d && d.reason)
    .map(([, d]) => d)
    .sort((a, b) =>
      (severityRank[a.severity?.toLowerCase()] || 99) -
      (severityRank[b.severity?.toLowerCase()] || 99),
    );

  if (actionItems.length) {
    lines.push(`⚠️ *Action Required:*`);
    actionItems.slice(0, 6).forEach((item) => {
      const sev  = item.severity?.toLowerCase();
      const icon = sev === "high" ? "🔴" : sev === "medium" ? "🟡" : "🔵";
      lines.push(`  ${icon} ${item.reason}`);
      if (item.impact) lines.push(`     ↳ ${item.impact}`);
    });
    lines.push(``);
  }

  const successItems = scoreBreakdown
    .filter((item) => item.outOf > 0 && item.score / item.outOf >= 0.8)
    .map((item) => item.factor);

  if (successItems.length) {
    lines.push(`✅ *What You're Doing Right:*`);
    successItems.forEach((f) => lines.push(`  ✔️ ${f}`));
    lines.push(``);
  }

  const categories = [snap.primaryCategory, ...(snap.additionalCategories || [])].filter(Boolean);
  if (categories.length) {
    lines.push(`🗂️ *Categories:* ${categories.slice(0, 4).join(", ")}${categories.length > 4 ? ` +${categories.length - 4} more` : ""}`);
    lines.push(``);
  }

  const services = (snap.services || []).map((s) =>
    typeof s === "string" ? s : s?.displayName || String(s),
  );
  if (services.length) {
    lines.push(`🛠️ *Services:* ${services.slice(0, 5).join(", ")}${services.length > 5 ? ` +${services.length - 5} more` : ""}`);
    lines.push(``);
  }

  lines.push(`📄 Full PDF report attached below.`);
  return lines.join("\n");
}
