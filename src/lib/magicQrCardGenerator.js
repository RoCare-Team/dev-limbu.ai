/**
 * Server-side Magic QR review card PNG.
 *
 * Important: this file intentionally does not use SVG <text>. In some server
 * environments sharp/librsvg cannot resolve fonts and renders text as square
 * missing-glyph boxes. All labels below are drawn with tiny vector rectangles.
 */

import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

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

const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

function sanitizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .toUpperCase();
}

function glyphFor(char) {
  return GLYPHS[char] || GLYPHS["?"];
}

function glyphWidth(char) {
  return glyphFor(char)[0].length;
}

function measurePixelText(text, scale, gap = 1) {
  const chars = sanitizeText(text).split("");
  if (chars.length === 0) return 0;
  const units = chars.reduce((sum, char) => sum + glyphWidth(char), 0) + gap * (chars.length - 1);
  return units * scale;
}

function drawPixelText({ text, x, y, scale, fill, align = "left", gap = 1, maxWidth = null }) {
  const sanitized = sanitizeText(text);
  if (!sanitized) return "";

  let finalScale = scale;
  const measured = measurePixelText(sanitized, finalScale, gap);
  if (maxWidth && measured > maxWidth) {
    finalScale = Math.max(1, Math.floor((finalScale * maxWidth) / measured));
  }

  const width = measurePixelText(sanitized, finalScale, gap);
  let cursorX = align === "center" ? x - width / 2 : align === "right" ? x - width : x;

  const rects = [];
  for (const char of sanitized) {
    const glyph = glyphFor(char);
    glyph.forEach((row, rowIndex) => {
      row.split("").forEach((cell, colIndex) => {
        if (cell !== "1") return;
        rects.push(
          `<rect x="${cursorX + colIndex * finalScale}" y="${y + rowIndex * finalScale}" width="${finalScale}" height="${finalScale}" fill="${fill}"/>`,
        );
      });
    });
    cursorX += (glyph[0].length + gap) * finalScale;
  }

  return rects.join("\n");
}

function drawGoogleWord(cx, y) {
  const letters = [
    ["G", G.blue],
    ["O", G.red],
    ["O", G.yellow],
    ["G", G.blue],
    ["L", G.green],
    ["E", G.red],
  ];
  const scale = 8;
  const gap = 2;
  const totalWidth = letters.reduce(
    (sum, [letter], index) =>
      sum + glyphWidth(letter) * scale + (index === letters.length - 1 ? 0 : gap * scale),
    0,
  );
  let cursorX = cx - totalWidth / 2;

  return letters
    .map(([letter, color], index) => {
      const out = drawPixelText({ text: letter, x: cursorX, y, scale, fill: color });
      cursorX += glyphWidth(letter) * scale + (index === letters.length - 1 ? 0 : gap * scale);
      return out;
    })
    .join("\n");
}

function wrapLines(text, maxChars) {
  const words = sanitizeText(text)
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
    current = word.length > maxChars ? `${word.slice(0, maxChars - 3)}...` : word;
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function truncUrl(url, maxLen) {
  const value = sanitizeText(url);
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 3)}...`;
}

async function fetchQrPng(reviewUrl) {
  const encodedUrl = encodeURIComponent(reviewUrl);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=6&data=${encodedUrl}`;
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
          width: 88,
          height: 88,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    } catch {
      /* try next */
    }
  }

  return null;
}

function layout(lineCount) {
  const cx = W / 2;
  let y = FRAME + 42;
  const googleY = y;
  y += 78;
  const starsY = y + 20;
  y += 44;
  const scanY = y;
  y += 32;
  const bizStartY = y;
  y += lineCount * 34 + 20;
  const qrSize = 400;
  const qrX = cx - qrSize / 2;
  const qrY = y;
  y += qrSize + 24;
  const urlY = y;
  y += 22;
  const dividerY = y;
  y += 28;
  const footY = y;
  const height = Math.ceil(footY + FRAME + 40);

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

function buildStars(cx, y) {
  const pointsForStar = (centerX, centerY, outerRadius = 17, innerRadius = 7) => {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push(
        `${centerX + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`,
      );
    }
    return points.join(" ");
  };

  return Array.from({ length: 5 }, (_, index) => {
    const x = cx - 56 + index * 28;
    return `<polygon points="${pointsForStar(x, y)}" fill="#FBBF24"/>`;
  }).join("\n");
}

function buildCardSvg(layoutPos, businessLines, urlText, qrBase64, logoPngBuf) {
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

  const logoBase64 = logoPngBuf ? logoPngBuf.toString("base64") : null;

  const businessText = businessLines
    .map((line, index) =>
      drawPixelText({
        text: line,
        x: cx,
        y: bizStartY + index * 34,
        scale: 4,
        fill: "#111827",
        align: "center",
        maxWidth: W - FRAME * 4,
      }),
    )
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

  const cornerShapes = [
    `<rect x="${tl.x}" y="${tl.y}" width="${arm}" height="${corner}" fill="${tl.c}"/><rect x="${tl.x}" y="${tl.y}" width="${corner}" height="${arm}" fill="${tl.c}"/>`,
    `<rect x="${tr.x - arm + corner}" y="${tr.y}" width="${arm}" height="${corner}" fill="${tr.c}"/><rect x="${tr.x}" y="${tr.y}" width="${corner}" height="${arm}" fill="${tr.c}"/>`,
    `<rect x="${bl.x}" y="${bl.y}" width="${arm}" height="${corner}" fill="${bl.c}"/><rect x="${bl.x}" y="${bl.y + corner - arm}" width="${corner}" height="${arm}" fill="${bl.c}"/>`,
    `<rect x="${br.x - arm + corner}" y="${br.y}" width="${arm}" height="${corner}" fill="${br.c}"/><rect x="${br.x}" y="${br.y + corner - arm}" width="${corner}" height="${arm}" fill="${br.c}"/>`,
  ].join("\n");

  const qrImage = `<image href="data:image/png;base64,${qrBase64}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" preserveAspectRatio="xMidYMid meet"/>`;

  const footer = logoBase64
    ? `<g>
  ${drawPixelText({ text: "POWERED BY", x: cx - 34, y: footY + 4, scale: 2, fill: "#6B7280", align: "right" })}
  <image href="data:image/png;base64,${logoBase64}" x="${cx - 20}" y="${footY - 6}" width="40" height="40" preserveAspectRatio="xMidYMid meet"/>
  ${drawPixelText({ text: "LIMBUAI", x: cx + 34, y: footY + 4, scale: 2, fill: "#0f172a", align: "left" })}
</g>`
    : drawPixelText({
        text: "POWERED BY LIMBUAI",
        x: cx,
        y: footY + 4,
        scale: 2,
        fill: "#0f172a",
        align: "center",
      });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}">
  <defs>${qrShadow}</defs>
  <clipPath id="outerClip"><rect x="0" y="0" width="${W}" height="${height}" rx="${OUTER_RX}" ry="${OUTER_RX}"/></clipPath>
  <g clip-path="url(#outerClip)">
    <rect x="0" y="0" width="${W / 2}" height="${height / 2}" fill="${G.yellow}"/>
    <rect x="${W / 2}" y="0" width="${W / 2}" height="${height / 2}" fill="${G.red}"/>
    <rect x="0" y="${height / 2}" width="${W / 2}" height="${height / 2}" fill="${G.green}"/>
    <rect x="${W / 2}" y="${height / 2}" width="${W / 2}" height="${height / 2}" fill="${G.blue}"/>
  </g>
  <rect x="${FRAME}" y="${FRAME}" width="${W - FRAME * 2}" height="${height - FRAME * 2}" rx="${INNER_RX}" ry="${INNER_RX}" fill="#ffffff"/>
  ${drawGoogleWord(cx, googleY)}
  ${buildStars(cx, starsY)}
  ${drawPixelText({ text: "SCAN TO RATE US ON GOOGLE", x: cx, y: scanY, scale: 3, fill: "#374151", align: "center" })}
  ${businessText}
  ${whiteQrBg}
  ${cornerShapes}
  ${qrImage}
  ${drawPixelText({ text: urlText, x: cx, y: urlY, scale: 1, fill: "#9CA3AF", align: "center", maxWidth: W - FRAME * 3 })}
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
  const [qrBuffer, logoBuffer] = await Promise.all([
    fetchQrPng(reviewUrl),
    loadFooterLogoPng(),
  ]);

  const businessLines = wrapLines(businessName || "Business", 24);
  const urlText = truncUrl(reviewUrl, 52);
  const positions = layout(businessLines.length);
  const qrBase64 = qrBuffer.toString("base64");
  const svg = buildCardSvg(positions, businessLines, urlText, qrBase64, logoBuffer);

  return sharp(Buffer.from(svg), { density: 192 })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
}
