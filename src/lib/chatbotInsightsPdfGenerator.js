/**
 * chatbotInsightsPdfGenerator.js
 *
 * Server-side PDF generator for GMB Performance Insights.
 *
 * Strategy (same pipeline as magicQrCardGenerator.js):
 *   1. Build a large SVG string that mirrors PerformanceInsightsReport.jsx exactly
 *   2. Render SVG → PNG with sharp (no browser needed)
 *   3. Slice the tall PNG into A4 pages with pdfkit
 *
 * Layout matches PerformanceInsightsReport.jsx colour-for-colour:
 *   bg-deep-charcoal #1E293B  |  bg-pure-white #FFFFFF
 *   lemon-glow #EAB308        |  cyber-black   #0B0F19
 *   tech-silver #94A3B8       |  tech-gray     #64748B
 *   blue-600 #2563EB  emerald-600 #059669  amber-600 #D97706
 *   violet-600 #7C3AED  rose-600 #E11D48  teal-600 #0D9488
 */

import PDFDocument from "pdfkit";
import sharp from "sharp";
import {
  ensureInterFonts,
  interTextPath,
  kpiLucideIcon,
  mapPinIcon,
} from "@/lib/svgInterText";
import {
  ymdFromApi,
  isYmdInClosedRange,
  toYmd,
} from "./performanceInsightsUtils.js";

// ── Colours ───────────────────────────────────────────────────────────────────
const BG        = "#F8FAFC";
const WHITE     = "#FFFFFF";
const BLACK     = "#000000";
const LEMON     = "#EAB308";
const SILVER    = "#475569";
const GRAY      = "#64748B";
const BORDER    = "#E2E8F0";
const CARD_DARK = "#F8FAFC";

const BLUE    = "#2563EB";
const EMERALD = "#059669";
const AMBER   = "#D97706";
const VIOLET  = "#7C3AED";
const ROSE    = "#E11D48";
const TEAL    = "#0D9488";
const GREEN   = "#16A34A";
const RED     = "#DC2626";

// Soft icon bg colours
const BLUE_SOFT    = "#EFF6FF";
const EMERALD_SOFT = "#ECFDF5";
const AMBER_SOFT   = "#FFFBEB";
const VIOLET_SOFT  = "#F5F3FF";
const ROSE_SOFT    = "#FFF1F2";

// SVG canvas width (scaled 2× on final PNG → 2400px)
const W = 1200;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString("en-IN");

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function deltaInfo(cur, prev, prevHasData) {
  if (!prevHasData || prev == null) return null;
  if (prev === 0 && cur === 0) return null;
  const pct = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
  return { pct, up: pct > 0, flat: pct === 0, label: `${Math.abs(pct)}%` };
}

// Round-rect path helper for SVG
function rr(x, y, w, h, r) {
  return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
}

// Horizontal dashed line
function dashLine(x1, y1, x2, color = BORDER) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y1}" stroke="${color}" stroke-width="1" stroke-dasharray="4 4"/>`;
}

// ── Chart Data (same logic as buildChartData in PerformanceInsightsReport) ────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  return Array.from(map.values()).sort((a, b) => (a.label < b.label ? -1 : 1));
}

// ── SVG Section Builders ──────────────────────────────────────────────────────

/** Header card: lemon badge, business name, location, report window box */
function buildHeader({ businessName, locationName, city, dateRange }, y) {
  const PAD = 32;
  const H   = 120;
  const drLabel = dateRange
    ? `${fmtDate(dateRange.startDate)} – ${fmtDate(dateRange.endDate)}`
    : "—";

  const parts = [];

  // White card
  parts.push(`<path d="${rr(PAD, y, W - PAD * 2, H, 16)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>`);

  // ── Left side ──
  // Lemon badge
  const bx = PAD + 24, by = y + 20;
  parts.push(`<path d="${rr(bx, by, 160, 22, 6)}" fill="${LEMON}"/>`);
  // dot
  parts.push(`<circle cx="${bx + 10}" cy="${by + 11}" r="4" fill="${BLACK}"/>`);
  parts.push(
    interTextPath({
      text: "LIMBU AI ANALYTICS",
      x: bx + 22,
      y: by + 15,
      size: 10,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );

  // Business name
  parts.push(
    interTextPath({
      text: businessName || "Business Profile",
      x: bx,
      y: y + 64,
      size: 26,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );

  const locRaw = [locationName, city].filter(Boolean).join("  /  ");
  if (locRaw) {
    parts.push(mapPinIcon(SILVER, bx + 8, y + 83, 0.78));
    parts.push(
      interTextPath({
        text: locRaw,
        x: bx + 26,
        y: y + 88,
        size: 12,
        fill: SILVER,
        anchor: "left",
        weight: 500,
      }),
    );
  }

  // ── Right side: dark report window box ──
  const boxW = 200, boxH = 60;
  const bpx  = W - PAD - 24 - boxW;
  const bpy  = y + (H - boxH) / 2;
  parts.push(`<path d="${rr(bpx, bpy, boxW, boxH, 10)}" fill="${BLACK}"/>`);
  parts.push(
    interTextPath({
      text: "REPORT WINDOW",
      x: bpx + boxW / 2,
      y: bpy + 18,
      size: 9,
      fill: GRAY,
      anchor: "center",
      weight: 700,
    }),
  );
  const drParts = drLabel.split("–");
  if (drParts.length === 2) {
    parts.push(
      interTextPath({
        text: drParts[0].trim(),
        x: bpx + boxW / 2,
        y: bpy + 36,
        size: 11,
        fill: WHITE,
        anchor: "center",
        weight: 700,
      }),
    );
    parts.push(
      interTextPath({
        text: `– ${drParts[1].trim()}`,
        x: bpx + boxW / 2,
        y: bpy + 52,
        size: 11,
        fill: WHITE,
        anchor: "center",
        weight: 700,
      }),
    );
  } else {
    parts.push(
      interTextPath({
        text: drLabel,
        x: bpx + boxW / 2,
        y: bpy + 40,
        size: 11,
        fill: WHITE,
        anchor: "center",
        weight: 700,
      }),
    );
  }

  return { svg: parts.join("\n"), height: H + 24 };
}

/** Single KPI card */
function buildKpiCard({ label, value, prevValue, prevHasData, accentColor, softBg, iconType }, x, y, w) {
  const H   = 150;
  const PAD = 16;
  const parts = [];

  // Card base
  parts.push(`<path d="${rr(x, y, w, H, 12)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>`);
  // Accent top border
  parts.push(`<path d="${rr(x, y, w, 4, 2)}" fill="${accentColor}"/>`);
  parts.push(`<rect x="${x}" y="${y + 2}" width="${w}" height="2" fill="${accentColor}"/>`);

  // Icon circle
  const iconX = x + PAD, iconY = y + PAD + 4;
  parts.push(`<path d="${rr(iconX, iconY, 36, 36, 8)}" fill="${softBg}"/>`);
  parts.push(kpiLucideIcon(iconType, accentColor, iconX + 18, iconY + 18, 0.82));

  // Delta badge
  const d = deltaInfo(value, prevValue, prevHasData);
  if (d) {
    const dColor = d.up ? GREEN : (d.flat ? GRAY : RED);
    const dBg    = d.up ? "#F0FDF4" : (d.flat ? "#F8FAFC" : "#FEF2F2");
    const dText  = `${d.up ? "▲" : (d.flat ? "→" : "▼")} ${d.label}`;
    const dW     = dText.length * 7 + 16;
    const dX     = x + w - PAD - dW;
    const dY     = iconY;
    parts.push(`<path d="${rr(dX, dY, dW, 22, 11)}" fill="${dBg}" stroke="${dColor}" stroke-width="0.5"/>`);
    parts.push(
      interTextPath({
        text: dText,
        x: dX + dW / 2,
        y: dY + 15,
        size: 10,
        fill: dColor,
        anchor: "center",
        weight: 800,
      }),
    );
  }

  parts.push(
    interTextPath({
      text: fmt(value),
      x: x + PAD,
      y: y + 78,
      size: 30,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );

  parts.push(
    interTextPath({
      text: label.toUpperCase(),
      x: x + PAD,
      y: y + 96,
      size: 9,
      fill: GRAY,
      anchor: "left",
      weight: 700,
    }),
  );

  parts.push(dashLine(x + PAD, y + 110, x + w - PAD));

  parts.push(
    interTextPath({
      text: "PREVIOUS PERIOD",
      x: x + PAD,
      y: y + 126,
      size: 8,
      fill: GRAY,
      anchor: "left",
      weight: 700,
    }),
  );
  const prvText = prevHasData ? fmt(prevValue) : "No data";
  parts.push(
    interTextPath({
      text: prvText,
      x: x + PAD,
      y: y + 142,
      size: 12,
      fill: SILVER,
      anchor: "left",
      weight: 700,
    }),
  );

  return { svg: parts.join("\n"), height: H };
}

/** 5 KPI cards row */
function buildKpiRow({ metrics, prevMetrics, prevHasData }, y) {
  const PAD   = 32;
  const GAP   = 12;
  const cardW = (W - PAD * 2 - GAP * 4) / 5;

  const cards = [
    { label: "Impressions",   value: metrics.totalImpressions,      prevValue: prevMetrics?.totalImpressions,      accentColor: BLUE,    softBg: BLUE_SOFT,    iconType: "activity" },
    { label: "Maps Views",    value: metrics.totalMapsImpressions,   prevValue: prevMetrics?.totalMapsImpressions,  accentColor: EMERALD, softBg: EMERALD_SOFT, iconType: "map" },
    { label: "Search Views",  value: metrics.totalSearchImpressions, prevValue: prevMetrics?.totalSearchImpressions,accentColor: AMBER,   softBg: AMBER_SOFT,   iconType: "search" },
    { label: "Phone Calls",   value: metrics.totalCalls,             prevValue: prevMetrics?.totalCalls,            accentColor: VIOLET,  softBg: VIOLET_SOFT,  iconType: "phone" },
    { label: "Web Clicks",    value: metrics.totalWebsiteClicks,     prevValue: prevMetrics?.totalWebsiteClicks,    accentColor: ROSE,    softBg: ROSE_SOFT,    iconType: "globe" },
  ];

  const parts = [];
  cards.forEach((card, i) => {
    const cx = PAD + i * (cardW + GAP);
    const { svg } = buildKpiCard({ ...card, prevHasData }, cx, y, cardW);
    parts.push(svg);
  });

  return { svg: parts.join("\n"), height: 150 + 24 };
}

/** SVG bar chart panel */
function buildBarChart({ title, subtitle, accentColor, data, series }, x, y, w, h) {
  const PAD    = 24;
  const titleH = 56;
  const innerX = x + PAD + 30; // 30 for y-axis labels
  const innerY = y + PAD + titleH;
  const innerW = w - PAD * 2 - 30;
  const innerH = h - PAD * 2 - titleH - 36; // 36 for x-labels + legend
  const parts  = [];

  // Card background
  parts.push(`<path d="${rr(x, y, w, h, 20)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>`);

  // Title accent bar
  parts.push(`<rect x="${x + PAD}" y="${y + PAD}" width="4" height="18" rx="2" fill="${accentColor}"/>`);
  parts.push(
    interTextPath({
      text: title.toUpperCase(),
      x: x + PAD + 12,
      y: y + PAD + 14,
      size: 14,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );
  if (subtitle) {
    parts.push(
      interTextPath({
        text: subtitle,
        x: x + PAD + 12,
        y: y + PAD + 32,
        size: 10,
        fill: SILVER,
        anchor: "left",
        weight: 400,
      }),
    );
  }

  if (!data || data.length === 0) {
    parts.push(
      interTextPath({
        text: "No data available",
        x: x + w / 2,
        y: y + h / 2,
        size: 11,
        fill: SILVER,
        anchor: "center",
        weight: 500,
      }),
    );
    return { svg: parts.join("\n") };
  }

  // Find max
  let maxVal = 0;
  data.forEach((row) => series.forEach(({ key }) => { if ((row[key] || 0) > maxVal) maxVal = row[key] || 0; }));
  if (maxVal === 0) maxVal = 1;

  // Y-axis gridlines (4 lines)
  for (let gi = 0; gi <= 4; gi++) {
    const gy     = innerY + innerH - (gi / 4) * innerH;
    const gLabel = Math.round((gi / 4) * maxVal);
    parts.push(`<line x1="${innerX}" y1="${gy}" x2="${innerX + innerW}" y2="${gy}" stroke="${BORDER}" stroke-width="0.5"/>`);
    parts.push(
      interTextPath({
        text: String(gLabel),
        x: innerX - 6,
        y: gy + 4,
        size: 9,
        fill: GRAY,
        anchor: "end",
        weight: 500,
      }),
    );
  }

  // Bars
  const n        = data.length;
  const groupW   = innerW / n;
  const barW     = Math.max(4, Math.min(28, (groupW * 0.75) / series.length));
  const groupPad = (groupW - barW * series.length) / 2;

  data.forEach((row, ri) => {
    const gx = innerX + ri * groupW + groupPad;
    series.forEach(({ key, color }, si) => {
      const val  = row[key] || 0;
      const barH = Math.max(2, (val / maxVal) * innerH);
      const bx   = gx + si * (barW + 2);
      const by   = innerY + innerH - barH;
      // Rounded top bars
      if (barH > 6) {
        parts.push(`<path d="M${bx},${by + 4} Q${bx},${by} ${bx + 4},${by} H${bx + barW - 4} Q${bx + barW},${by} ${bx + barW},${by + 4} V${by + barH} H${bx} Z" fill="${color}"/>`);
      } else {
        parts.push(`<rect x="${bx}" y="${by}" width="${barW}" height="${barH}" fill="${color}"/>`);
      }
    });

    // X-axis label
    parts.push(
      interTextPath({
        text: row.label,
        x: gx + groupW / 2,
        y: innerY + innerH + 14,
        size: 9,
        fill: GRAY,
        anchor: "center",
        weight: 700,
      }),
    );
  });

  // Legend
  const legendY = innerY + innerH + 26;
  let lx = innerX;
  series.forEach(({ key, color }) => {
    parts.push(`<circle cx="${lx + 6}" cy="${legendY + 6}" r="5" fill="${color}"/>`);
    parts.push(
      interTextPath({
        text: key.toUpperCase(),
        x: lx + 16,
        y: legendY + 11,
        size: 10,
        fill: GRAY,
        anchor: "left",
        weight: 700,
      }),
    );
    lx += 16 + key.length * 7 + 20;
  });

  return { svg: parts.join("\n") };
}

/** Two chart panels side by side */
function buildChartsRow({ monthlyVis, monthlyEng }, y) {
  const PAD   = 32;
  const GAP   = 16;
  const panelW = (W - PAD * 2 - GAP) / 2;
  const panelH = 340;

  const parts = [];

  const { svg: visSvg } = buildBarChart({
    title: "Visibility Trends",
    subtitle: "Organic impressions on Search & Maps",
    accentColor: BLUE,
    data: monthlyVis,
    series: [
      { key: "Maps Views",   color: BLUE },
      { key: "Search Views", color: TEAL },
    ],
  }, PAD, y, panelW, panelH);
  parts.push(visSvg);

  const { svg: engSvg } = buildBarChart({
    title: "User Engagement",
    subtitle: "Direct actions taken by potential customers",
    accentColor: VIOLET,
    data: monthlyEng,
    series: [
      { key: "Calls",         color: VIOLET },
      { key: "Directions",    color: AMBER  },
      { key: "Website Clicks",color: ROSE   },
    ],
  }, PAD + panelW + GAP, y, panelW, panelH);
  parts.push(engSvg);

  return { svg: parts.join("\n"), height: panelH + 24 };
}

/** Keywords section */
function buildKeywords(keywords, y) {
  const PAD    = 32;
  const panelX = PAD;
  const panelW = W - PAD * 2;

  if (!keywords || keywords.length === 0) {
    const emptyH = 80;
    return {
      svg: `<path d="${rr(panelX, y, panelW, emptyH, 20)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>
${interTextPath({
  text: "NO KEYWORD DATA AVAILABLE FOR THIS RANGE",
  x: W / 2,
  y: y + 46,
  size: 12,
  fill: SILVER,
  anchor: "center",
  weight: 700,
})}`,
      height: emptyH + 24,
    };
  }

  const COLS    = 3;
  const kwList  = keywords.slice(0, 10);
  const ROWS    = Math.ceil(kwList.length / COLS);
  const CARD_H  = 48;
  const CARD_GAP= 10;
  const CARD_W  = (panelW - 48 - CARD_GAP * (COLS - 1)) / COLS;
  const titleH  = 60;
  const panelH  = titleH + ROWS * (CARD_H + CARD_GAP) + 24;

  const parts = [];

  // Panel bg
  parts.push(`<path d="${rr(panelX, y, panelW, panelH, 20)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>`);

  // Section title
  parts.push(`<rect x="${panelX + 24}" y="${y + 20}" width="4" height="18" rx="2" fill="${LEMON}"/>`);
  parts.push(
    interTextPath({
      text: "SEARCH QUERIES",
      x: panelX + 36,
      y: y + 34,
      size: 14,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );
  parts.push(
    interTextPath({
      text: "Top keywords leading customers to your business",
      x: panelX + 36,
      y: y + 52,
      size: 10,
      fill: SILVER,
      anchor: "left",
      weight: 400,
    }),
  );

  // Keyword cards
  kwList.forEach((kw, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx  = panelX + 24 + col * (CARD_W + CARD_GAP);
    const cy  = y + titleH + row * (CARD_H + CARD_GAP);

    // Dark card
    parts.push(`<path d="${rr(cx, cy, CARD_W, CARD_H, 10)}" fill="${CARD_DARK}" stroke="${BORDER}" stroke-width="1"/>`);

    // Number badge
    const badgeSize = 26;
    parts.push(`<path d="${rr(cx + 8, cy + (CARD_H - badgeSize) / 2, badgeSize, badgeSize, 6)}" fill="${BLACK}"/>`);
    parts.push(
      interTextPath({
        text: String(i + 1).padStart(2, "0"),
        x: cx + 8 + badgeSize / 2,
        y: cy + (CARD_H - badgeSize) / 2 + 17,
        size: 9,
        fill: LEMON,
        anchor: "center",
        weight: 900,
      }),
    );

    const kwText = (kw.searchKeyword || kw.keyword || "—").slice(0, 36);
    parts.push(
      interTextPath({
        text: kwText,
        x: cx + 44,
        y: cy + 21,
        size: 11,
        fill: BLACK,
        anchor: "left",
        weight: 700,
      }),
    );

    const countVal = kw.insightsValue?.value
      ? Number(kw.insightsValue.value).toLocaleString()
      : kw.insightsValue?.threshold
        ? `<${kw.insightsValue.threshold}`
        : "0";
    parts.push(
      interTextPath({
        text: countVal,
        x: cx + CARD_W - 12,
        y: cy + 21,
        size: 12,
        fill: BLACK,
        anchor: "end",
        weight: 900,
      }),
    );
    parts.push(
      interTextPath({
        text: "SEARCHES",
        x: cx + CARD_W - 12,
        y: cy + 34,
        size: 8,
        fill: GRAY,
        anchor: "end",
        weight: 700,
      }),
    );
  });

  return { svg: parts.join("\n"), height: panelH + 24 };
}

/** Footer */
function buildFooter({ businessName }, y) {
  const H   = 56;
  const PAD = 32;
  const parts = [];

  parts.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${BORDER}" stroke-width="1"/>`);

  // Left: Limbu AI
  parts.push(`<path d="${rr(PAD, y + 10, 36, 36, 8)}" fill="${LEMON}"/>`);
  parts.push(
    interTextPath({
      text: "L",
      x: PAD + 18,
      y: y + 33,
      size: 14,
      fill: BLACK,
      anchor: "center",
      weight: 900,
    }),
  );
  parts.push(
    interTextPath({
      text: "Limbu AI",
      x: PAD + 46,
      y: y + 25,
      size: 11,
      fill: BLACK,
      anchor: "left",
      weight: 900,
    }),
  );
  parts.push(
    interTextPath({
      text: "ANALYTICS REPORT",
      x: PAD + 46,
      y: y + 40,
      size: 9,
      fill: SILVER,
      anchor: "left",
      weight: 700,
    }),
  );

  const dateStr = `DOCUMENT GENERATED ON: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  parts.push(`<path d="${rr(W - PAD - 300, y + 14, 300, 28, 14)}" fill="${WHITE}" stroke="${BORDER}" stroke-width="1"/>`);
  parts.push(
    interTextPath({
      text: dateStr,
      x: W - PAD - 150,
      y: y + 32,
      size: 9,
      fill: GRAY,
      anchor: "center",
      weight: 400,
    }),
  );

  return { svg: parts.join("\n"), height: H };
}

// ── Main SVG Builder ──────────────────────────────────────────────────────────

function buildFullSvg({
  businessName, locationName, city, dateRange,
  metrics, prevMetrics, prevHasData,
  monthlyVis, monthlyEng, keywords,
}) {
  const SECTION_GAP = 24;
  let cursor = 24; // start y
  const sections = [];

  // Header
  const hdr = buildHeader({ businessName, locationName, city, dateRange }, cursor);
  sections.push(hdr.svg);
  cursor += hdr.height + SECTION_GAP;

  // KPI
  const kpi = buildKpiRow({ metrics, prevMetrics, prevHasData }, cursor);
  sections.push(kpi.svg);
  cursor += kpi.height + SECTION_GAP;

  // Charts
  const charts = buildChartsRow({ monthlyVis, monthlyEng }, cursor);
  sections.push(charts.svg);
  cursor += charts.height + SECTION_GAP;

  // Keywords
  const kws = buildKeywords(keywords, cursor);
  sections.push(kws.svg);
  cursor += kws.height + SECTION_GAP;

  // Footer
  const ftr = buildFooter({ businessName }, cursor);
  sections.push(ftr.svg);
  cursor += ftr.height + 24;

  const totalH = cursor;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${totalH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background -->
  <rect width="${W}" height="${totalH}" fill="${BG}"/>
  ${sections.join("\n")}
</svg>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a performance insights PDF buffer matching PerformanceInsightsReport.jsx.
 *
 * Pipeline:
 *   1. Build SVG string with full report layout
 *   2. sharp: SVG → PNG at 2× pixel density (crisp on retina)
 *   3. pdfkit: embed PNG across A4 pages
 *
 * @param {{
 *   businessName: string,
 *   locationName: string,
 *   city: string,
 *   dateRange: { startDate: string, endDate: string },
 *   metrics: object,
 *   prevMetrics: object,
 *   prevHasData: boolean,
 *   insightsData: object,
 *   keywords: object[],
 * }} opts
 * @returns {Promise<Buffer>} PDF buffer
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
  // ── 1. Build chart datasets ──────────────────────────────────────────────────
  const startYmd = dateRange?.startDate ? toYmd(new Date(dateRange.startDate)) : null;
  const endYmd   = dateRange?.endDate   ? toYmd(new Date(dateRange.endDate))   : null;

  const monthlyVis = buildChartData([
    [dvFiltered(insightsData, "BUSINESS_IMPRESSIONS_MOBILE_MAPS",   startYmd, endYmd), "Maps Views"],
    [dvFiltered(insightsData, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", startYmd, endYmd), "Search Views"],
  ]);
  const monthlyEng = buildChartData([
    [dvFiltered(insightsData, "CALL_CLICKS",                        startYmd, endYmd), "Calls"],
    [dvFiltered(insightsData, "BUSINESS_DIRECTION_REQUESTS",        startYmd, endYmd), "Directions"],
    [dvFiltered(insightsData, "WEBSITE_CLICKS",                     startYmd, endYmd), "Website Clicks"],
  ]);

  // ── 2. Build SVG → PNG (Inter as paths — no system fonts required) ───────────
  await ensureInterFonts();
  const svg       = buildFullSvg({ businessName, locationName, city, dateRange, metrics, prevMetrics, prevHasData, monthlyVis, monthlyEng, keywords });
  const svgBuf    = Buffer.from(svg, "utf8");

  // Opaque RGB raster (JPEG) to avoid PNG/smask quirks in some PDF viewers.
  const rasterBuffer = await sharp(svgBuf, { density: 192 })
    .resize({ width: W * 2, kernel: sharp.kernel.lanczos3 })
    .flatten({ background: BG })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const meta = await sharp(rasterBuffer).metadata();
  const imgW = meta.width  || W * 2;
  const imgH = meta.height || 1000;
  if (!imgW || !imgH) {
    throw new Error(`Insights PDF: raster export invalid size (${imgW}x${imgH})`);
  }

  // ── 3. One giant embedded image + clip() breaks many PDF viewers (black/grey pages).
  //    Slice into one JPEG per A4 page with sharp.extract — each page is a normal image.
  const A4_W      = 595.28;
  const A4_H      = 841.89;
  const scale     = A4_W / imgW;
  const pageH_px  = Math.floor(A4_H / scale);
  const pageTotal = Math.max(1, Math.ceil(imgH / pageH_px));

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title:   `Performance Insights – ${businessName}`,
        Author:  "Limbu AI",
        Subject: "GMB Performance Report",
      },
    });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    (async () => {
      try {
        let srcY = 0;
        let page = 0;
        while (srcY < imgH) {
          const sliceH = Math.min(pageH_px, imgH - srcY);
          const sliceBuf = await sharp(rasterBuffer)
            .extract({ left: 0, top: srcY, width: imgW, height: sliceH })
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();

          if (page > 0) doc.addPage();

          const drawH = sliceH * scale;
          doc.image(sliceBuf, 0, 0, { width: A4_W, height: drawH });

          doc.fontSize(7).fillColor("#94A3B8")
            .text(
              `Generated by Limbu AI | ${businessName} | Page ${page + 1} of ${pageTotal}`,
              20, A4_H - 18,
              { width: A4_W - 40, align: "center" }
            );

          srcY += sliceH;
          page++;
        }
        doc.end();
      } catch (e) {
        reject(e);
      }
    })();
  });
}
