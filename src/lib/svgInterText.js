/**
 * Render text as SVG <path> outlines using bundled Inter (WOFF2 via @fontsource/inter).
 * sharp/librsvg has no web fonts — plain SVG <text> becomes tofu on servers.
 *
 * Uses fontkit (supports WOFF2). opentype.js only supports TTF/OTF/WOFF, not wOF2.
 */

import { create as createFont } from "fontkit";
import fs from "fs/promises";
import path from "path";

/** @type {Record<number, import("fontkit").Font>} */
const fontData = {};

let loadPromise = null;

function woff2Path(weight) {
  const files = {
    400: "inter-latin-400-normal.woff2",
    600: "inter-latin-600-normal.woff2",
    700: "inter-latin-700-normal.woff2",
    900: "inter-latin-900-normal.woff2",
  };
  const file = files[weight];
  if (!file) throw new Error(`svgInterText: unsupported weight ${weight}`);
  return path.join(process.cwd(), "node_modules", "@fontsource", "inter", "files", file);
}

async function loadAll() {
  const weights = [400, 600, 700, 900];
  await Promise.all(
    weights.map(async (w) => {
      const buf = await fs.readFile(woff2Path(w));
      fontData[w] = createFont(buf);
    }),
  );
}

export function ensureInterFonts() {
  if (fontData[400]) return Promise.resolve();
  if (!loadPromise) loadPromise = loadAll();
  return loadPromise;
}

function pickFont(weight) {
  const w = Number(weight);
  if (!fontData[400]) {
    throw new Error("ensureInterFonts() must be awaited before interTextPath()");
  }
  if (w >= 850) return fontData[900];
  if (w >= 750) return fontData[700];
  if (w >= 550) return fontData[600];
  return fontData[400];
}

function measureAdvancePx(font, str, fontSize) {
  if (!str) return 0;
  const run = font.layout(str);
  return run.advanceWidth * (fontSize / font.unitsPerEm);
}

/**
 * Outline → SVG d=… at baseline y, left edge at xOrigin (px).
 */
function layoutToSvgPathD(font, str, xOrigin, yBaseline, fontSize) {
  if (!str) return "";
  const run = font.layout(str);
  const upem = font.unitsPerEm;
  const scale = fontSize / upem;

  let cursorX = xOrigin;
  const dChunks = [];

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const pos = run.positions[i];
    const xAdv = pos?.xAdvance ?? glyph.advanceWidth ?? 0;
    const xOff = pos?.xOffset ?? 0;
    const yOff = pos?.yOffset ?? 0;

    const ox = cursorX + xOff * scale;
    const oy = yBaseline - yOff * scale;

    if (glyph.path) {
      const p = glyph.path.scale(scale, -scale).translate(ox, oy);
      const frag = typeof p.toSVG === "function" ? p.toSVG(2) : "";
      if (frag) dChunks.push(frag);
    }

    cursorX += xAdv * scale;
  }

  return dChunks.join(" ");
}

function escAttr(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/**
 * @param {{
 *   text: string,
 *   x: number,
 *   y: number,
 *   size: number,
 *   fill?: string,
 *   anchor?: 'left'|'center'|'middle'|'right'|'end',
 *   weight?: number,
 * }} opts
 */
export function interTextPath(opts) {
  const {
    text,
    x,
    y,
    size,
    fill = "#000000",
    anchor = "left",
    weight = 400,
  } = opts;

  const font = pickFont(weight);
  const str = String(text ?? "");
  if (!str) return "";

  const adv = measureAdvancePx(font, str, size);
  let x0 = x;
  if (anchor === "center" || anchor === "middle") {
    x0 = x - adv / 2;
  } else if (anchor === "right" || anchor === "end") {
    x0 = x - adv;
  }

  const d = layoutToSvgPathD(font, str, x0, y, size);
  if (!d) return "";
  return `<path fill="${escAttr(fill)}" d="${escAttr(d)}"/>`;
}

/**
 * Multiple segments on one baseline (different weights/colours), default centered at anchorX.
 * @param {{ text: string, weight?: number, fill: string }[]} segments
 */
export function interTextPathsColored(segments, baselineY, size, anchorX, anchor = "center") {
  let total = 0;
  const advs = segments.map((seg) => {
    const font = pickFont(seg.weight ?? 400);
    const a = measureAdvancePx(font, String(seg.text), size);
    total += a;
    return a;
  });

  let cursor = anchorX;
  if (anchor === "center" || anchor === "middle") {
    cursor = anchorX - total / 2;
  } else if (anchor === "right" || anchor === "end") {
    cursor = anchorX - total;
  }

  const out = [];
  segments.forEach((seg, i) => {
    const font = pickFont(seg.weight ?? 400);
    const t = String(seg.text);
    const d = layoutToSvgPathD(font, t, cursor, baselineY, size);
    if (d) {
      out.push(`<path fill="${escAttr(seg.fill)}" d="${escAttr(d)}"/>`);
    }
    cursor += advs[i];
  });
  return out.join("\n");
}

/** Match QRPreviewCard.jsx letter colours (Tailwind text-*-500), not marketing hex. */
export function interGoogleBrandWord(cx, baselineY, size) {
  const letters = [
    ["G", "#3B82F6"], // blue-500
    ["o", "#EF4444"], // red-500
    ["o", "#EAB308"], // yellow-500 (second “o” uses yellow-500 in card)
    ["g", "#3B82F6"],
    ["l", "#22C55E"], // green-500
    ["e", "#EF4444"],
  ];
  const font = pickFont(900);
  const tracking = size * -0.03;
  const adv = letters.map(([ch]) => measureAdvancePx(font, ch, size));
  const totalW = adv.reduce((a, b) => a + b, 0) + tracking * (letters.length - 1);
  let x = cx - totalW / 2;
  const parts = [];
  letters.forEach(([ch, fill], i) => {
    const d = layoutToSvgPathD(font, ch, x, baselineY, size);
    if (d) parts.push(`<path fill="${fill}" d="${escAttr(d)}"/>`);
    x += adv[i] + tracking;
  });
  return parts.join("\n");
}

/**
 * Lucide-style stroke icons (24×24) for KPI cards — replaces emoji (no emoji font in SVG raster).
 */
export function kpiLucideIcon(type, color, cx, cy, scale = 0.85) {
  const stroke = escAttr(color);
  const inner = (() => {
    switch (type) {
      case "activity":
        return `<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>`;
      case "map":
        return `<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894L15.553 19.553a2 2 0 0 0-1.105.342l-2.256 1.128a1 1 0 0 1-.947 0l-2.256-1.128a2 2 0 0 0-1.105-.342L4.553 16.276a2 2 0 0 0-1.105-.342L2 15.553V2.947A1 1 0 0 1 2.447 2.05l3.659 1.83a2 2 0 0 0 1.894 0L12 2.05l4 2v14.382l-4-2-4 2V4.618z"/>`;
      case "search":
        return `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`;
      case "phone":
        return `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`;
      case "globe":
        return `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`;
      default:
        return "";
    }
  })();
  if (!inner) return "";
  return `<g transform="translate(${cx},${cy}) scale(${scale}) translate(-12,-12)" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}

/** Minimap / map-pin beside location line (PerformanceInsights header). */
export function mapPinIcon(color, cx, cy, scale = 0.85) {
  const stroke = escAttr(color);
  const inner = `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`;
  return `<g transform="translate(${cx},${cy}) scale(${scale}) translate(-12,-12)" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}
