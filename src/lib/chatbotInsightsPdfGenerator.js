/**
 * chatbotInsightsPdfGenerator.js
 *
 * Server-side PDF generator for GMB Performance Insights — mirrors the visual
 * layout of PerformanceInsightsReport.jsx / performancePdfGenerator.js exactly.
 *
 * Layout (A4, portrait):
 *   Page 1 – Header + 5 KPI cards (Impressions, Maps Views, Search Views,
 *             Phone Calls, Web Clicks) + delta badges
 *   Page 2 – Visibility Trends bar chart + User Engagement bar chart
 *   Page 3 – Search Queries (top keywords) + Footer
 *
 * Uses pdfkit (already a dependency for the health-score PDF).
 */

import PDFDocument from "pdfkit";
import {
  getMetricByType,
  ymdFromApi,
  isYmdInClosedRange,
  toYmd,
} from "./performanceInsightsUtils.js";

// ── Colours (match Tailwind classes in PerformanceInsightsReport.jsx) ─────────
const C = {
  black:       [11,  15,  25],   // cyber-black  #0B0F19
  white:       [255, 255, 255],
  lemon:       [234, 179,  8],   // lemon-glow   #EAB308
  gray:        [100, 116, 139],  // tech-silver  #64748B
  lightGray:   [226, 232, 240],  // slate-200    #E2E8F0
  charcoal:    [30,  41,  59],   // deep-charcoal #1E293B
  blue:        [37,  99, 235],   // blue-600
  emerald:     [5,  150, 105],   // emerald-600
  amber:       [217, 119,  6],   // amber-600
  violet:      [124, 58, 237],   // violet-600
  rose:        [225, 29,  72],   // rose-600
  teal:        [13, 148, 136],   // teal-600
  green:       [22, 163,  74],   // delta-up
  red:         [220,  38,  38],  // delta-down
};

// A4 dimensions (points)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Helpers ──────────────────────────────────────────────────────────────────

function rgb(arr) { return { r: arr[0] / 255, g: arr[1] / 255, b: arr[2] / 255 }; }

function fillRgb(doc, arr) { doc.fillColor(`rgb(${arr[0]},${arr[1]},${arr[2]})`); }
function strokeRgb(doc, arr) { doc.strokeColor(`rgb(${arr[0]},${arr[1]},${arr[2]})`); }

function roundRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r).fillAndStroke();
}

/** Draw a small coloured filled rect (no stroke). */
function filledRect(doc, x, y, w, h, colArr) {
  fillRgb(doc, colArr);
  strokeRgb(doc, colArr);
  doc.rect(x, y, w, h).fill();
}

/** Draw text with fillColor already set. */
function txt(doc, text, x, y, opts = {}) {
  doc.text(String(text ?? ""), x, y, opts);
}

/** Format number with commas. */
const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN");

/** Delta percent string. */
function deltaStr(cur, prev) {
  if (prev == null || prev === undefined) return null;
  if (prev === 0 && cur === 0) return null;
  const pct = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
  return { pct, up: pct >= 0, label: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%` };
}

/** Format date as "9 Mar – 8 Apr 2026" */
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ── Chart Data Builder (mirrors buildChartData in PerformanceInsightsReport) ─

function dvFiltered(insightsData, type, startYmd, endYmd) {
  if (!insightsData?.multiDailyMetricTimeSeries) return [];
  const root   = insightsData.multiDailyMetricTimeSeries;
  const metric = root[0]?.dailyMetricTimeSeries
    ? root[0].dailyMetricTimeSeries.find((m) => m.dailyMetric === type)
    : root.find((m) => m.dailyMetric === type);
  const all = metric?.timeSeries?.datedValues || [];
  if (!startYmd || !endYmd) return all;
  return all.filter((d) => {
    const ymd = ymdFromApi(d.date);
    return ymd && isYmdInClosedRange(ymd, startYmd, endYmd);
  });
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildChartData(pairs) {
  const map = new Map();
  pairs.forEach(([series, key]) => {
    series.forEach((d) => {
      const dk    = `${d.date.year}-${String(d.date.month).padStart(2, "0")}`;
      const label = `${MONTH_NAMES[d.date.month - 1]} '${String(d.date.year).slice(-2)}`;
      if (!map.has(dk)) map.set(dk, { label });
      const v = parseInt(d.value || 0, 10);
      map.get(dk)[key] = (map.get(dk)[key] || 0) + (isNaN(v) ? 0 : v);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.label < b.label ? -1 : 1);
}

// ── PDF Sections ──────────────────────────────────────────────────────────────

function drawHeader(doc, { businessName, locationName, city, dateRange }) {
  const y0 = MARGIN;

  // Yellow "LIMBU AI ANALYTICS" badge
  const badgeW = 160;
  filledRect(doc, MARGIN, y0, badgeW, 18, C.lemon);
  fillRgb(doc, C.black);
  doc.font("Helvetica-Bold").fontSize(7);
  txt(doc, "LIMBU AI ANALYTICS", MARGIN + 8, y0 + 5, { lineBreak: false });

  // Report window box (right side)
  const drLabel = dateRange
    ? `${fmtDate(dateRange.startDate)} – ${fmtDate(dateRange.endDate)}`
    : "—";
  const boxW = 170;
  const boxX = PAGE_W - MARGIN - boxW;
  filledRect(doc, boxX, y0, boxW, 38, C.black);
  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(7);
  txt(doc, "REPORT WINDOW", boxX + 8, y0 + 6, { lineBreak: false });
  fillRgb(doc, C.white);
  doc.font("Helvetica-Bold").fontSize(9);
  txt(doc, drLabel, boxX + 8, y0 + 18, { lineBreak: false, width: boxW - 16 });

  // Business name
  fillRgb(doc, C.black);
  doc.font("Helvetica-Bold").fontSize(22);
  txt(doc, businessName || "Business Profile", MARGIN, y0 + 26, { width: CONTENT_W - boxW - 20, lineBreak: false });

  // Location + city
  const locStr = [locationName, city].filter(Boolean).join("  /  ");
  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(10);
  txt(doc, locStr, MARGIN, y0 + 54, { width: CONTENT_W - boxW - 20, lineBreak: false });

  // Separator line
  doc.moveTo(MARGIN, y0 + 72).lineTo(PAGE_W - MARGIN, y0 + 72);
  strokeRgb(doc, C.lightGray);
  doc.lineWidth(0.5).stroke();

  return y0 + 82; // next Y
}

function drawKpiCards(doc, { metrics, prevMetrics, prevHasData }, y) {
  const cards = [
    { label: "IMPRESSIONS",   key: "totalImpressions",      accent: C.blue    },
    { label: "MAPS VIEWS",    key: "totalMapsImpressions",   accent: C.emerald },
    { label: "SEARCH VIEWS",  key: "totalSearchImpressions", accent: C.amber   },
    { label: "PHONE CALLS",   key: "totalCalls",             accent: C.violet  },
    { label: "WEB CLICKS",    key: "totalWebsiteClicks",     accent: C.rose    },
  ];

  const cardW  = (CONTENT_W - 16) / 5;
  const cardH  = 88;
  const gap    = 4;

  cards.forEach((card, i) => {
    const x   = MARGIN + i * (cardW + gap);
    const cur = metrics?.[card.key] ?? 0;
    const prv = prevMetrics?.[card.key] ?? 0;

    // Card background
    fillRgb(doc, C.white);
    strokeRgb(doc, C.lightGray);
    doc.lineWidth(0.5).roundedRect(x, y, cardW, cardH, 4).fillAndStroke();

    // Accent top border
    filledRect(doc, x, y, cardW, 3, card.accent);

    // Label
    fillRgb(doc, C.gray);
    doc.font("Helvetica-Bold").fontSize(7);
    txt(doc, card.label, x + 6, y + 8, { lineBreak: false });

    // Value
    fillRgb(doc, C.black);
    doc.font("Helvetica-Bold").fontSize(20);
    txt(doc, fmt(cur), x + 6, y + 20, { lineBreak: false });

    // Delta badge
    if (prevHasData) {
      const d = deltaStr(cur, prv);
      if (d) {
        const dCol = d.up ? C.green : C.red;
        fillRgb(doc, dCol);
        doc.font("Helvetica-Bold").fontSize(8);
        txt(doc, d.label, x + 6, y + 46, { lineBreak: false });
      }
    }

    // Previous period
    const prevLineY = y + 58;
    // Dashed separator
    strokeRgb(doc, C.lightGray);
    doc.lineWidth(0.4).dash(2, { space: 2 })
      .moveTo(x + 6, prevLineY).lineTo(x + cardW - 6, prevLineY).stroke();
    doc.undash();

    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(7);
    txt(doc, "PREVIOUS PERIOD", x + 6, prevLineY + 4, { lineBreak: false });
    fillRgb(doc, C.gray);
    doc.font("Helvetica-Bold").fontSize(10);
    txt(doc, prevHasData ? fmt(prv) : "No data", x + 6, prevLineY + 14, { lineBreak: false });
  });

  return y + cardH + 14;
}

/**
 * Draw a grouped bar chart from chartData (array of {label, key1, key2, ...}).
 * series = [ { key, color } ]
 */
function drawBarChart(doc, chartData, series, x, y, w, h, title, subtitle) {
  // Section title
  filledRect(doc, x, y, 3, 14, C.blue);
  fillRgb(doc, C.black);
  doc.font("Helvetica-Bold").fontSize(11);
  txt(doc, title, x + 8, y, { lineBreak: false });
  if (subtitle) {
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(8);
    txt(doc, subtitle, x + 8, y + 14, { lineBreak: false });
  }

  const chartY   = y + 30;
  const chartH   = h - 30;
  const chartW   = w;
  const padLeft  = 28;  // y-axis labels
  const padBot   = 22;  // x-axis labels
  const innerW   = chartW - padLeft;
  const innerH   = chartH - padBot;

  if (!chartData || chartData.length === 0) {
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(9);
    txt(doc, "No data available for this period", x + padLeft + innerW / 2 - 60, chartY + innerH / 2, { lineBreak: false });
    return y + h;
  }

  // Find max value
  let maxVal = 0;
  chartData.forEach((row) => {
    series.forEach(({ key }) => { if ((row[key] || 0) > maxVal) maxVal = row[key] || 0; });
  });
  if (maxVal === 0) maxVal = 1;

  // Y-axis gridlines + labels
  const gridLines = 4;
  for (let gi = 0; gi <= gridLines; gi++) {
    const gy     = chartY + innerH - (gi / gridLines) * innerH;
    const gLabel = Math.round((gi / gridLines) * maxVal);
    strokeRgb(doc, C.lightGray);
    doc.lineWidth(0.3).moveTo(x + padLeft, gy).lineTo(x + padLeft + innerW, gy).stroke();
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(6);
    txt(doc, String(gLabel), x, gy - 3, { width: padLeft - 2, align: "right", lineBreak: false });
  }

  // Bars
  const n         = chartData.length;
  const groupW    = innerW / n;
  const barW      = Math.max(2, (groupW * 0.7) / series.length);
  const groupPad  = (groupW - barW * series.length) / 2;

  chartData.forEach((row, ri) => {
    const gx = x + padLeft + ri * groupW + groupPad;
    series.forEach(({ key, color }, si) => {
      const val  = row[key] || 0;
      const barH = Math.max(1, (val / maxVal) * innerH);
      const bx   = gx + si * barW;
      const by   = chartY + innerH - barH;
      filledRect(doc, bx, by, barW - 1, barH, color);
    });
    // X-axis label
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(6);
    txt(doc, row.label, gx, chartY + innerH + 4, { width: groupW, align: "center", lineBreak: false });
  });

  // Legend
  const legY = chartY + innerH + 14;
  let legX   = x + padLeft;
  series.forEach(({ key, color }) => {
    filledRect(doc, legX, legY + 2, 8, 8, color);
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(7);
    txt(doc, key, legX + 11, legY + 2, { lineBreak: false });
    legX += doc.widthOfString(key) + 22;
  });

  return y + h;
}

function drawKeywords(doc, keywords, y) {
  // Section header
  filledRect(doc, MARGIN, y, 3, 14, C.lemon);
  fillRgb(doc, C.black);
  doc.font("Helvetica-Bold").fontSize(11);
  txt(doc, "SEARCH QUERIES", MARGIN + 8, y, { lineBreak: false });
  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(8);
  txt(doc, "Top keywords leading customers to your business", MARGIN + 8, y + 14, { lineBreak: false });

  y += 32;

  if (!keywords || keywords.length === 0) {
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(9);
    txt(doc, "No keyword data available for this period.", MARGIN, y, { lineBreak: false });
    return y + 20;
  }

  const colW  = (CONTENT_W - 8) / 2;
  const rowH  = 26;

  keywords.slice(0, 10).forEach((kw, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const kx  = MARGIN + col * (colW + 8);
    const ky  = y + row * (rowH + 4);

    // Card background
    filledRect(doc, kx, ky, colW, rowH, C.charcoal);

    // Number badge
    fillRgb(doc, C.black);
    doc.font("Helvetica-Bold").fontSize(7);
    doc.roundedRect(kx + 6, ky + 6, 16, 14, 2).fill();
    fillRgb(doc, C.lemon);
    txt(doc, String(i + 1).padStart(2, "0"), kx + 6, ky + 10, { width: 16, align: "center", lineBreak: false });

    // Keyword text
    fillRgb(doc, C.white);
    doc.font("Helvetica-Bold").fontSize(9);
    const kwText = kw.searchKeyword || kw.keyword || "—";
    txt(doc, kwText, kx + 28, ky + 8, { width: colW - 70, lineBreak: false });

    // Search count
    const countVal = kw.insightsValue?.value
      ? Number(kw.insightsValue.value).toLocaleString()
      : kw.insightsValue?.threshold
        ? `< ${kw.insightsValue.threshold}`
        : "—";
    fillRgb(doc, C.white);
    doc.font("Helvetica-Bold").fontSize(10);
    const countW = 40;
    txt(doc, countVal, kx + colW - countW - 6, ky + 6, { width: countW, align: "right", lineBreak: false });
    fillRgb(doc, C.gray);
    doc.font("Helvetica").fontSize(6);
    txt(doc, "SEARCHES", kx + colW - countW - 6, ky + 17, { width: countW, align: "right", lineBreak: false });
  });

  return y + Math.ceil(Math.min(keywords.length, 10) / 2) * (rowH + 4) + 10;
}

function drawFooter(doc, { businessName, pageNum, pageTotal }) {
  const fy = PAGE_H - 28;
  strokeRgb(doc, C.lightGray);
  doc.lineWidth(0.5).moveTo(MARGIN, fy).lineTo(PAGE_W - MARGIN, fy).stroke();

  fillRgb(doc, C.black);
  doc.font("Helvetica-Bold").fontSize(8);
  txt(doc, "Limbu AI", MARGIN, fy + 6, { lineBreak: false });
  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(7);
  txt(doc, "Analytics Report", MARGIN + doc.widthOfString("Limbu AI") + 4, fy + 6, { lineBreak: false });

  const genStr = `DOCUMENT GENERATED ON: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(7);
  txt(doc, genStr, PAGE_W - MARGIN - 200, fy + 6, { width: 200, align: "right", lineBreak: false });

  fillRgb(doc, C.gray);
  doc.font("Helvetica").fontSize(7);
  txt(doc, `Generated by Limbu AI | ${businessName} | Page ${pageNum} of ${pageTotal}`, MARGIN, fy + 14, { lineBreak: false });
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Generate a performance insights PDF buffer, mirroring PerformanceInsightsReport.jsx.
 *
 * @param {{
 *   businessName: string,
 *   locationName: string,
 *   city: string,
 *   dateRange: { startDate: string, endDate: string },
 *   metrics: object,
 *   prevMetrics: object,
 *   prevHasData: boolean,
 *   insightsData: object,   ← raw Google API response (for chart data)
 *   keywords: object[],    ← searchKeywordsCounts from monthly keywords API
 * }} opts
 * @returns {Promise<Buffer>}
 */
export async function generateInsightsPdf({
  businessName,
  locationName,
  city,
  dateRange,
  metrics,
  prevMetrics,
  prevHasData,
  insightsData,
  keywords = [],
}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0, info: {
      Title:   `Performance Insights – ${businessName}`,
      Author:  "Limbu AI",
      Subject: "GMB Performance Report",
    }});

    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Build chart datasets ─────────────────────────────────────────────────
    const startYmd = dateRange?.startDate ? toYmd(new Date(dateRange.startDate)) : null;
    const endYmd   = dateRange?.endDate   ? toYmd(new Date(dateRange.endDate))   : null;

    const monthlyVis = buildChartData([
      [dvFiltered(insightsData, "BUSINESS_IMPRESSIONS_MOBILE_MAPS",    startYmd, endYmd), "Maps Views"],
      [dvFiltered(insightsData, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",  startYmd, endYmd), "Search Views"],
    ]);
    const monthlyEng = buildChartData([
      [dvFiltered(insightsData, "CALL_CLICKS",                         startYmd, endYmd), "Calls"],
      [dvFiltered(insightsData, "BUSINESS_DIRECTION_REQUESTS",         startYmd, endYmd), "Directions"],
      [dvFiltered(insightsData, "WEBSITE_CLICKS",                      startYmd, endYmd), "Website Clicks"],
    ]);

    const TOTAL_PAGES = keywords.length > 0 ? 3 : 2;

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1 — Header + KPI cards
    // ════════════════════════════════════════════════════════════════════════
    filledRect(doc, 0, 0, PAGE_W, PAGE_H, C.charcoal); // page bg

    let y = drawHeader(doc, { businessName, locationName, city, dateRange });
    y = drawKpiCards(doc, { metrics, prevMetrics, prevHasData }, y);
    drawFooter(doc, { businessName, pageNum: 1, pageTotal: TOTAL_PAGES });

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 2 — Visibility + Engagement charts
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    filledRect(doc, 0, 0, PAGE_W, PAGE_H, C.charcoal);

    // White chart panels
    const chartPanelH = 240;
    const halfW       = (CONTENT_W - 10) / 2;

    // Visibility panel
    fillRgb(doc, C.white);
    strokeRgb(doc, C.lightGray);
    doc.lineWidth(0.5).roundedRect(MARGIN, MARGIN, halfW, chartPanelH, 8).fillAndStroke();
    drawBarChart(
      doc,
      monthlyVis,
      [{ key: "Maps Views", color: C.blue }, { key: "Search Views", color: C.teal }],
      MARGIN + 8, MARGIN + 8, halfW - 16, chartPanelH - 16,
      "Visibility Trends",
      "Organic impressions on Search & Maps",
    );

    // Engagement panel
    const engX = MARGIN + halfW + 10;
    fillRgb(doc, C.white);
    strokeRgb(doc, C.lightGray);
    doc.lineWidth(0.5).roundedRect(engX, MARGIN, halfW, chartPanelH, 8).fillAndStroke();
    drawBarChart(
      doc,
      monthlyEng,
      [
        { key: "Calls",         color: C.violet },
        { key: "Directions",    color: C.amber  },
        { key: "Website Clicks",color: C.rose   },
      ],
      engX + 8, MARGIN + 8, halfW - 16, chartPanelH - 16,
      "User Engagement",
      "Direct actions taken by potential customers",
    );

    drawFooter(doc, { businessName, pageNum: 2, pageTotal: TOTAL_PAGES });

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 3 — Search Queries (if any keywords)
    // ════════════════════════════════════════════════════════════════════════
    if (keywords.length > 0) {
      doc.addPage();
      filledRect(doc, 0, 0, PAGE_W, PAGE_H, C.charcoal);
      // White content background
      fillRgb(doc, C.white);
      strokeRgb(doc, C.lightGray);
      doc.lineWidth(0.5)
        .roundedRect(MARGIN, MARGIN, CONTENT_W, PAGE_H - MARGIN * 2 - 30, 8)
        .fillAndStroke();

      drawKeywords(doc, keywords, MARGIN + 16);
      drawFooter(doc, { businessName, pageNum: 3, pageTotal: TOTAL_PAGES });
    }

    doc.end();
  });
}
