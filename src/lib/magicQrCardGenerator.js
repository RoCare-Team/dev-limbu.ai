/**
 * Server-side Magic QR review card PNG — matches the inner card in
 * {@link ../components/magic-qr/QRPreviewCard.jsx}: Google-colored frame,
 * white inner, multicolor "Google" wordmark, stars, business name, QR with
 * corner accents, review URL, Powered by LimbuAI.
 */

import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import {
  getEmbeddedNotoSansFontDefs,
  SHARP_SVG_FONT_FAMILY,
} from "@/lib/sharpSvgEmbeddedFonts";

const G = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
};

const QR_CORNER = {
  tl: "#EF4444",
  tr: "#3B82F6",
  bl: "#FACC15",
  br: "#22C55E",
};

const W = 640;
const OUTER_RX = 56;
const FRAME = 28;
const INNER_RX = 36;

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxChars) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length <= maxChars) cur = cand;
    else {
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? `${w.slice(0, maxChars - 1)}…` : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function truncUrl(url, maxLen) {
  const u = String(url || "");
  if (u.length <= maxLen) return u;
  return `${u.slice(0, maxLen - 1)}…`;
}

const FF = `'${SHARP_SVG_FONT_FAMILY}', sans-serif`;

/** Vector stars — avoids ★ (U+2605) missing from Noto Latin subsets when rasterizing on Linux. */
function goldStarsRowGroup(cx, starsY) {
  const d =
    "M0,-8 L2.35,-2.47 L8,-2.47 L3.1,1.23 L5.1,7.8 L0,4.5 L-5.1,7.8 L-3.1,1.23 L-8,-2.47 L-2.35,-2.47 Z";
  const offsets = [-42, -21, 0, 21, 42];
  return `<g transform="translate(${cx},${starsY}) scale(1.65)">${offsets
    .map((dx) => `<path transform="translate(${dx},0)" d="${d}" fill="#FBBF24"/>`)
    .join("")}</g>`;
}

async function fetchQrPng(reviewUrl) {
  const enc = encodeURIComponent(reviewUrl);
  const u = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=6&data=${enc}`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`QR fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function loadFooterLogoPng() {
  const candidates = [
    path.join(process.cwd(), "public", "images", "bg-logo.png"),
    path.join(process.cwd(), "public", "images", "limbuailogo.png"),
  ];
  for (const p of candidates) {
    try {
      const buf = await fs.readFile(p);
      return await sharp(buf)
        .resize({ width: 88, height: 88, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch {
      /* try next */
    }
  }
  return null;
}

/** All vertical positions derived in one place so height matches paint. */
function layout(lineCount) {
  const cx = W / 2;
  let y = FRAME + 40;
  const googleY = y + 62;
  y += 84;
  const starsY = y + 22;
  y += 44;
  const scanY = y + 15;
  y += 34;
  const bizStartY = y;
  y += lineCount * 36 + 20;
  y += 8;
  const qrSize = 400;
  const qrX = cx - qrSize / 2;
  const qrY = y;
  y += qrSize + 24;
  const urlY = y + 6;
  y += 28;
  const dividerY = y;
  y += 24;
  const footY = y + 18;
  const height = Math.ceil(footY + FRAME + 36);
  return {
    cx,
    height,
    googleY,
    starsY,
    scanY,
    bizStartY,
    qrX,
    qrY,
    qrSize,
    urlY,
    dividerY,
    footY,
  };
}

function buildCardSvg(layoutPos, businessLines, urlText, qrBase64, logoPngBuf, embeddedFontStyle) {
  const {
    cx,
    height,
    googleY,
    starsY,
    scanY,
    bizStartY,
    qrX,
    qrY,
    qrSize,
    urlY,
    dividerY,
    footY,
  } = layoutPos;

  const logoB64 = logoPngBuf ? logoPngBuf.toString("base64") : null;

  const bizText = businessLines
    .map((line, i) => {
      const yy = bizStartY + (i + 1) * 34;
      return `<text x="${cx}" y="${yy}" text-anchor="middle" font-size="32" font-weight="700" fill="#111827" font-family="${FF}">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const qrShadow = `
    <filter id="qrShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/>
    </filter>`;

  const pad = 16;
  const whiteQrBg = `
    <rect x="${qrX - pad}" y="${qrY - pad}" width="${qrSize + pad * 2}" height="${qrSize + pad * 2}" rx="20" ry="20"
      fill="#ffffff" filter="url(#qrShadow)"/>`;

  const corner = 6;
  const arm = 28;
  const tl = { x: qrX - pad, y: qrY - pad, c: QR_CORNER.tl };
  const tr = { x: qrX + qrSize + pad - corner, y: qrY - pad, c: QR_CORNER.tr };
  const bl = { x: qrX - pad, y: qrY + qrSize + pad - corner, c: QR_CORNER.bl };
  const br = { x: qrX + qrSize + pad - corner, y: qrY + qrSize + pad - corner, c: QR_CORNER.br };

  const lShapes = [
    `<rect x="${tl.x}" y="${tl.y}" width="${arm}" height="${corner}" fill="${tl.c}"/><rect x="${tl.x}" y="${tl.y}" width="${corner}" height="${arm}" fill="${tl.c}"/>`,
    `<rect x="${tr.x - arm + corner}" y="${tr.y}" width="${arm}" height="${corner}" fill="${tr.c}"/><rect x="${tr.x}" y="${tr.y}" width="${corner}" height="${arm}" fill="${tr.c}"/>`,
    `<rect x="${bl.x}" y="${bl.y}" width="${arm}" height="${corner}" fill="${bl.c}"/><rect x="${bl.x}" y="${bl.y + corner - arm}" width="${corner}" height="${arm}" fill="${bl.c}"/>`,
    `<rect x="${br.x - arm + corner}" y="${br.y}" width="${arm}" height="${corner}" fill="${br.c}"/><rect x="${br.x}" y="${br.y + corner - arm}" width="${corner}" height="${arm}" fill="${br.c}"/>`,
  ].join("\n");

  const qrImg = `<image href="data:image/png;base64,${qrBase64}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" preserveAspectRatio="xMidYMid meet"/>`;

  const footer = logoB64
    ? `<g transform="translate(${cx}, ${footY})">
  <text x="-30" y="4" text-anchor="end" font-size="22" fill="#6B7280" font-family="${FF}" font-weight="500">Powered by</text>
  <image href="data:image/png;base64,${logoB64}" x="-22" y="-22" width="44" height="44" preserveAspectRatio="xMidYMid meet"/>
  <text x="30" y="4" text-anchor="start" font-size="24" font-weight="700" fill="#0f172a" font-family="${FF}">LimbuAI</text>
</g>`
    : `<text x="${cx}" y="${footY}" text-anchor="middle" font-size="22" font-family="${FF}">
  <tspan fill="#6B7280" font-weight="500">Powered by </tspan><tspan font-weight="700" fill="#0f172a">LimbuAI</tspan>
</text>`;

  const H = height;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${embeddedFontStyle}${qrShadow}</defs>
  <clipPath id="outerClip"><rect x="0" y="0" width="${W}" height="${H}" rx="${OUTER_RX}" ry="${OUTER_RX}"/></clipPath>
  <g clip-path="url(#outerClip)">
    <rect x="0" y="0" width="${W / 2}" height="${H / 2}" fill="${G.yellow}"/>
    <rect x="${W / 2}" y="0" width="${W / 2}" height="${H / 2}" fill="${G.red}"/>
    <rect x="0" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${G.green}"/>
    <rect x="${W / 2}" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${G.blue}"/>
  </g>
  <rect x="${FRAME}" y="${FRAME}" width="${W - FRAME * 2}" height="${H - FRAME * 2}" rx="${INNER_RX}" ry="${INNER_RX}" fill="#ffffff"/>
  <text x="${cx}" y="${googleY}" text-anchor="middle" font-size="84" font-weight="900" font-family="${FF}" letter-spacing="-2">
    <tspan fill="${G.blue}">G</tspan><tspan fill="${G.red}">o</tspan><tspan fill="${G.yellow}">o</tspan><tspan fill="${G.blue}">g</tspan><tspan fill="${G.green}">l</tspan><tspan fill="${G.red}">e</tspan>
  </text>
  ${goldStarsRowGroup(cx, starsY)}
  <text x="${cx}" y="${scanY}" text-anchor="middle" font-size="26" fill="#374151" font-family="${FF}">
    <tspan font-weight="400">Scan to Rate Us on </tspan><tspan font-weight="700" fill="#111827">Google</tspan>
  </text>
  ${bizText}
  ${whiteQrBg}
  ${lShapes}
  ${qrImg}
  <text x="${cx}" y="${urlY}" text-anchor="middle" font-size="20" fill="#9CA3AF" font-family="${FF}">${escapeXml(urlText)}</text>
  <rect x="${FRAME + 32}" y="${dividerY}" width="${W - (FRAME + 32) * 2}" height="2" fill="#E5E7EB"/>
  ${footer}
</svg>`;
}

/**
 * @param {string} businessName
 * @param {string} reviewUrl
 * @returns {Promise<Buffer>} PNG bytes
 */
export async function generateMagicQrCard(businessName, reviewUrl) {
  const [qrBuf, logoBuf, embeddedFontStyle] = await Promise.all([
    fetchQrPng(reviewUrl),
    loadFooterLogoPng(),
    getEmbeddedNotoSansFontDefs(),
  ]);

  const businessLines = wrapLines(businessName || "Business", 24);
  const urlText = truncUrl(reviewUrl, 52);
  const pos = layout(businessLines.length);
  const qrBase64 = qrBuf.toString("base64");
  const svg = buildCardSvg(pos, businessLines, urlText, qrBase64, logoBuf, embeddedFontStyle);

  return sharp(Buffer.from(svg), { density: 192 })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
}
