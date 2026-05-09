/**
 * Server Magic QR card — mirrors only the inner `ref={qrCardRef}` block from QRPreviewCard.jsx
 * (260px-wide design); rasterized at 3× (~780px) like manual `toPng(..., { pixelRatio: 3 })`.
 *
 * Typography: fontkit + Inter paths (server-safe). Colours: Tailwind tokens from QRPreviewCard.
 */

import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import {
  ensureInterFonts,
  interGoogleBrandWord,
  interTextPath,
  interTextPathsColored,
} from "@/lib/svgInterText";

/** Tailwind quadrant backgrounds: yellow-400, red-500, green-500, blue-500 */
const Q = {
  yellow: "#FACC15",
  red: "#EF4444",
  green: "#22C55E",
  blue: "#3B82F6",
};

/** QR corner accents: same as spans on client */
const QR_STROKE = {
  tl: "#EF4444",
  tr: "#3B82F6",
  bl: "#FACC15",
  br: "#22C55E",
};

/** Logical width = client `width: min(260px, 100%)` */
const W = 260;
const OUTER_RX = 24; // rounded-[1.5rem] sm:rounded-3xl
const INSET = 16; // m-2 sm:m-4 → use sm
const PAD = 24; // p-3 sm:p-6 → use sm p-6
const INNER_RX = 16; // rounded-xl sm:rounded-2xl

const QR_IMG = 150; // min(150px, 75%)
const QR_PAD = 12; // p-3
const QR_OUTER_RX = 12; // rounded-xl
const STROKE_W = 2; // border-2
const BRACKET = 12; // w-3 h-3

/** Export width = manual ~260 × 3 */
const EXPORT_SCALE = 3;

function wrapLines(text, maxChars) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current =
      word.length > maxChars ? `${word.slice(0, maxChars - 3)}…` : word;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function truncUrl(urlStr, maxLen) {
  const v = String(urlStr || "");
  if (v.length <= maxLen) return v;
  return `${v.slice(0, maxLen - 3)}…`;
}

async function fetchQrPng(reviewUrl) {
  const encodedUrl = encodeURIComponent(reviewUrl);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=2&data=${encodedUrl}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`QR fetch failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function loadFooterLogoPng() {
  const candidates = [
    path.join(process.cwd(), "public", "images", "bg-logo.png"),
    path.join(process.cwd(), "public", "images", "limbuailogo.png"),
  ];

  for (const filePath of candidates) {
    try {
      const buffer = await fs.readFile(filePath);
      return await sharp(buffer)
        .resize({
          width: 40,
          height: 40,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    } catch {
      /* next */
    }
  }
  return null;
}

function buildStars(cx, yCenter) {
  const outerR = 9;
  const gap = 4;
  const step = outerR * 2 + gap;
  const startX = cx - 2 * step;

  const starPoints = (sx, sy) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outerR : outerR * 0.45;
      pts.push(`${sx + Math.cos(ang) * r},${sy + Math.sin(ang) * r}`);
    }
    return pts.join(" ");
  };

  return Array.from({ length: 5 }, (_, i) => {
    const sx = startX + i * step;
    return `<polygon points="${starPoints(sx, yCenter)}" fill="#FACC15"/>`;
  }).join("\n");
}

/** L-shaped corner like `border-t-2 border-l-2` at (x0,y0) outer corner of QR image */
function qrCornerAccents(qx, qy, qSize) {
  const s = STROKE_W;
  const L = BRACKET;
  const se = (c, d) =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${s}" stroke-linecap="round" stroke-linejoin="round"/>`;

  return [
    se(QR_STROKE.tl, `M ${qx} ${qy + L} L ${qx} ${qy} L ${qx + L} ${qy}`),
    se(
      QR_STROKE.tr,
      `M ${qx + qSize - L} ${qy} L ${qx + qSize} ${qy} L ${qx + qSize} ${qy + L}`,
    ),
    se(
      QR_STROKE.bl,
      `M ${qx} ${qy + qSize - L} L ${qx} ${qy + qSize} L ${qx + L} ${qy + qSize}`,
    ),
    se(
      QR_STROKE.br,
      `M ${qx + qSize - L} ${qy + qSize} L ${qx + qSize} ${qy + qSize} L ${qx + qSize} ${qy + qSize - L}`,
    ),
  ].join("\n");
}

function layout(lineCount) {
  const cx = W / 2;
  let y = INSET + PAD;

  const googlePx = 36; // sm:text-4xl
  const googleBaseline = y + googlePx * 0.78;
  y += googlePx + 8; // mb-2

  const starsY = y + 2;
  y += 20 + 8; // star row + mb-2

  const scanPx = 14; // sm:text-sm
  const scanBaseline = y + scanPx * 0.78;
  y += scanPx + 6;

  const bizPx = 16; // sm:text-base
  const bizStartBaseline = y + 8 + bizPx * 0.78; // mt-2
  y += 8 + bizPx * lineCount + (lineCount > 1 ? (lineCount - 1) * 4 : 0) + 16; // mb-4

  const qrBox = QR_IMG + 2 * QR_PAD;
  const qrX = cx - qrBox / 2;
  const qrY = y;
  const qrIx = cx - QR_IMG / 2;
  const qrIy = qrY + QR_PAD;
  y += qrBox + 12; // mt-3

  const urlPx = 9;
  const urlBaseline = y + urlPx * 0.9;
  y += 26; // ~2 lines clamp

  const dividerY = y;
  y += 1 + 12; // border + pt-3
  const footBaseline = y + 10;

  const innerBottom = footBaseline + 22 + PAD;
  const cardH = innerBottom + INSET;

  return {
    cx,
    cardH,
    innerBottom,
    googlePx,
    googleBaseline,
    starsY,
    scanPx,
    scanBaseline,
    bizStartBaseline,
    bizPx,
    qrX,
    qrY,
    qrBox,
    qrIx,
    qrIy,
    dividerY,
    footBaseline,
    urlBaseline,
    urlPx,
  };
}

function buildCardSvg(
  layoutPos,
  businessLines,
  urlText,
  qrBase64,
  logoPngBuf,
) {
  const {
    cx,
    cardH,
    innerBottom,
    googlePx,
    googleBaseline,
    starsY,
    scanPx,
    scanBaseline,
    bizStartBaseline,
    bizPx,
    qrX,
    qrY,
    qrBox,
    qrIx,
    qrIy,
    dividerY,
    footBaseline,
    urlBaseline,
    urlPx,
  } = layoutPos;

  const logoB64 = logoPngBuf ? logoPngBuf.toString("base64") : null;
  const innerW = W - 2 * INSET;

  const bizPaths = businessLines
    .map((line, i) =>
      interTextPath({
        text: line,
        x: cx,
        y: bizStartBaseline + i * (bizPx + 4),
        size: bizPx,
        fill: "#111827",
        anchor: "center",
        weight: 700,
      }),
    )
    .join("\n");

  const qrFilter = `
  <filter id="qrSh" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
  </filter>`;

  const scanLine = interTextPathsColored(
    [
      { text: "Scan to Rate Us on ", weight: 600, fill: "#374151" },
      { text: "Google", weight: 700, fill: "#000000" },
    ],
    scanBaseline,
    scanPx,
    cx,
    "center",
  );

  const footer = logoB64
    ? `<g>
  ${interTextPath({
    text: "Powered by",
    x: cx - 34,
    y: footBaseline,
    size: 10,
    fill: "#6B7280",
    anchor: "right",
    weight: 400,
  })}
  <image href="data:image/png;base64,${logoB64}" x="${cx - 11}" y="${footBaseline - 14}" width="20" height="20" preserveAspectRatio="xMidYMid meet"/>
  ${interTextPath({
    text: "LimbuAI",
    x: cx + 34,
    y: footBaseline,
    size: 14,
    fill: "#0f172a",
    anchor: "left",
    weight: 700,
  })}
</g>`
    : interTextPathsColored(
        [
          { text: "Powered by ", weight: 400, fill: "#6B7280" },
          { text: "LimbuAI", weight: 700, fill: "#0f172a" },
        ],
        footBaseline,
        10,
        cx,
        "center",
      );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${cardH}" viewBox="0 0 ${W} ${cardH}">
  <defs>${qrFilter}</defs>
  <clipPath id="cOut"><rect x="0" y="0" width="${W}" height="${cardH}" rx="${OUTER_RX}" ry="${OUTER_RX}"/></clipPath>

  <g clip-path="url(#cOut)">
    <rect x="0" y="0" width="${W / 2}" height="${cardH / 2}" fill="${Q.yellow}"/>
    <rect x="${W / 2}" y="0" width="${W / 2}" height="${cardH / 2}" fill="${Q.red}"/>
    <rect x="0" y="${cardH / 2}" width="${W / 2}" height="${cardH / 2}" fill="${Q.green}"/>
    <rect x="${W / 2}" y="${cardH / 2}" width="${W / 2}" height="${cardH / 2}" fill="${Q.blue}"/>
  </g>

  <rect x="${INSET}" y="${INSET}" width="${innerW}" height="${innerBottom - INSET}" rx="${INNER_RX}" ry="${INNER_RX}" fill="#ffffff"/>

  ${interGoogleBrandWord(cx, googleBaseline, googlePx)}
  ${buildStars(cx, starsY)}
  ${scanLine}
  ${bizPaths}

  <rect x="${qrX}" y="${qrY}" width="${qrBox}" height="${qrBox}" rx="${QR_OUTER_RX}" ry="${QR_OUTER_RX}" fill="#ffffff" stroke="#F1F5F9" stroke-width="1" filter="url(#qrSh)"/>
  <image href="data:image/png;base64,${qrBase64}" x="${qrIx}" y="${qrIy}" width="${QR_IMG}" height="${QR_IMG}" preserveAspectRatio="xMidYMid meet"/>
  ${qrCornerAccents(qrIx, qrIy, QR_IMG)}

  ${interTextPath({
    text: urlText,
    x: cx,
    y: urlBaseline,
    size: urlPx,
    fill: "#9CA3AF",
    anchor: "center",
    weight: 400,
  })}

  <line x1="${INSET + PAD}" y1="${dividerY}" x2="${W - INSET - PAD}" y2="${dividerY}" stroke="#F3F4F6" stroke-width="1"/>
  ${footer}
</svg>`;
}

export async function generateMagicQrCard(businessName, reviewUrl) {
  await ensureInterFonts();

  const [qrBuffer, logoBuffer] = await Promise.all([
    fetchQrPng(reviewUrl),
    loadFooterLogoPng(),
  ]);

  const businessLines = wrapLines(businessName || "Business", 26);
  const urlText = truncUrl(reviewUrl, 48);
  const positions = layout(businessLines.length);
  const qrBase64 = qrBuffer.toString("base64");
  const svg = buildCardSvg(
    positions,
    businessLines,
    urlText,
    qrBase64,
    logoBuffer,
  );

  const outH = Math.round(positions.cardH * EXPORT_SCALE);
  return sharp(Buffer.from(svg))
    .resize({
      width: W * EXPORT_SCALE,
      height: outH,
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
}

// re-export layout constants for tests
export const MAGIC_QR_CARD_REF_WIDTH = W;
export const MAGIC_QR_EXPORT_SCALE = EXPORT_SCALE;
