/**
 * magicQrCardGenerator.js
 *
 * Server-side generator of the exact same styled QR card shown in
 * the get-magic-qr dashboard page (QRPreviewCard.jsx).
 *
 * Card structure (400 x 520 px):
 *  ┌─────────────────────────────────────┐
 *  │  YELLOW │ RED                        │ ← Google color quadrants (peeking out)
 *  │         │                            │
 *  │  ┌──────────────────────────────┐   │
 *  │  │    G o o g l e (multicolor)  │   │
 *  │  │    ★ ★ ★ ★ ★                │   │
 *  │  │  Scan to Rate Us on Google   │   │
 *  │  │      < Business Name >       │   │
 *  │  │  ┌────────────────────────┐  │   │
 *  │  │  │   QR Code (200×200)    │  │   │
 *  │  │  └────────────────────────┘  │   │
 *  │  │   Powered by ■ LimbuAI      │   │
 *  │  └──────────────────────────────┘   │
 *  │  GREEN  │ BLUE                       │
 *  └─────────────────────────────────────┘
 *
 * Uses:  sharp  (server-side image processing, no browser needed)
 *        api.qrserver.com  (same QR source as the dashboard)
 */

import sharp from "sharp";

// Card dimensions
const W = 400;
const H = 520;
const MARGIN = 16;      // gap between card edge and white panel
const CARD_RADIUS = 20; // white panel corner radius
const OUTER_RADIUS = 32;// full card corner radius

// ── Google brand colours ────────────────────────────────────────────────────
const G = { blue: "#4285F4", red: "#DB4437", yellow: "#F4B400", green: "#0F9D58" };

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Wrap a long business name into at most 2 lines (≤22 chars each).
 */
function wrapBusinessName(name, maxChars = 22) {
  if (name.length <= maxChars) return [name];
  const words = name.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + (line ? " " : "") + word).length <= maxChars) {
      line += (line ? " " : "") + word;
    } else {
      if (line) lines.push(line);
      line = word;
    }
    if (lines.length === 2) { line = ""; break; }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

// ── SVG builder ──────────────────────────────────────────────────────────────

/**
 * Build an SVG string that represents the styled Magic QR card.
 *
 * @param {string}  businessName  - e.g. "DoctorFresh Water Technologies - Ahmedabad"
 * @param {string}  qrBase64      - "data:image/png;base64,..."  (the QR code image)
 * @returns {string} SVG markup
 */
function buildSvg(businessName, qrBase64) {
  const nameLines  = wrapBusinessName(businessName);
  const nameY1     = nameLines.length > 1 ? 162 : 170;
  const nameY2     = nameY1 + 22;

  // White card occupies the area inside the MARGIN
  const cx = MARGIN;
  const cy = MARGIN;
  const cw = W - MARGIN * 2;
  const ch = H - MARGIN * 2;

  // QR image box: centred, 200×200, placed below the name text
  const qrSize  = 200;
  const qrX     = (W - qrSize) / 2;
  const qrY     = nameLines.length > 1 ? 196 : 192;

  // Footer elements
  const hrY     = qrY + qrSize + 24;
  const footerY = hrY + 22;

  // ── SVG ────────────────────────────────────────────────────────────────────
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Clip entire graphic to rounded rect so corners look like the dashboard -->
    <clipPath id="outer">
      <rect width="${W}" height="${H}" rx="${OUTER_RADIUS}" ry="${OUTER_RADIUS}"/>
    </clipPath>
    <!-- Clip white card to rounded rect -->
    <clipPath id="card">
      <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${CARD_RADIUS}" ry="${CARD_RADIUS}"/>
    </clipPath>
  </defs>

  <!-- ── Outer rounded container ──────────────────────────────────────────── -->
  <g clip-path="url(#outer)">

    <!-- Google colour quadrants (peeking behind the white card) -->
    <rect x="0"   y="0"   width="${W/2}" height="${H/2}" fill="#FBBF24"/>
    <rect x="${W/2}" y="0"   width="${W/2}" height="${H/2}" fill="#EF4444"/>
    <rect x="0"   y="${H/2}" width="${W/2}" height="${H/2}" fill="#22C55E"/>
    <rect x="${W/2}" y="${H/2}" width="${W/2}" height="${H/2}" fill="#3B82F6"/>

    <!-- ── White card ──────────────────────────────────────────────────────── -->
    <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}"
          rx="${CARD_RADIUS}" ry="${CARD_RADIUS}" fill="white"/>

    <g clip-path="url(#card)">

      <!-- Coloured "Google" text (matches dashboard CSS colour per letter) -->
      <text x="${W/2}" y="78" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="800"
            letter-spacing="-1">
        <tspan fill="${G.blue}">G</tspan><tspan fill="${G.red}">o</tspan><tspan fill="${G.yellow}">o</tspan><tspan fill="${G.blue}">g</tspan><tspan fill="${G.green}">l</tspan><tspan fill="${G.red}">e</tspan>
      </text>

      <!-- Stars -->
      <text x="${W/2}" y="108" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#FBBF24"
            letter-spacing="4">&#9733;&#9733;&#9733;&#9733;&#9733;</text>

      <!-- "Scan to Rate Us on Google" — normal + bold "Google" -->
      <text x="${W/2}" y="134" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#374151">
        Scan to Rate Us on <tspan font-weight="700" fill="#111827">Google</tspan>
      </text>

      <!-- Business name (up to 2 lines) -->
      <text x="${W/2}" y="${nameY1}" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700"
            fill="#111827">
        ${esc(nameLines[0])}${nameLines[1] ? `<tspan x="${W/2}" dy="22">${esc(nameLines[1])}</tspan>` : ""}
      </text>

      <!-- QR Code image -->
      <image xlink:href="${qrBase64}"
             x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"
             preserveAspectRatio="xMidYMid meet"/>

      <!-- Coloured corner accents on the QR box (matching QRPreviewCard.jsx) -->
      <!-- top-left  red -->
      <rect x="${qrX}" y="${qrY}" width="12" height="3" fill="#EF4444"/>
      <rect x="${qrX}" y="${qrY}" width="3" height="12" fill="#EF4444"/>
      <!-- top-right  blue -->
      <rect x="${qrX+qrSize-12}" y="${qrY}" width="12" height="3" fill="#3B82F6"/>
      <rect x="${qrX+qrSize-3}" y="${qrY}" width="3" height="12" fill="#3B82F6"/>
      <!-- bottom-left  yellow -->
      <rect x="${qrX}" y="${qrY+qrSize-3}" width="12" height="3" fill="#FBBF24"/>
      <rect x="${qrX}" y="${qrY+qrSize-12}" width="3" height="12" fill="#FBBF24"/>
      <!-- bottom-right  green -->
      <rect x="${qrX+qrSize-12}" y="${qrY+qrSize-3}" width="12" height="3" fill="#22C55E"/>
      <rect x="${qrX+qrSize-3}" y="${qrY+qrSize-12}" width="3" height="12" fill="#22C55E"/>

      <!-- Footer separator -->
      <line x1="${cx+16}" y1="${hrY}" x2="${cx+cw-16}" y2="${hrY}"
            stroke="#E5E7EB" stroke-width="1"/>

      <!-- "Powered by  LimbuAI" -->
      <text x="${W/2}" y="${footerY}" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#6B7280">
        Powered by&#160;<tspan font-weight="700" fill="#0B0F19" font-size="12">LimbuAI</tspan>
      </text>

    </g><!-- /card clip -->
  </g><!-- /outer clip -->
</svg>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Download the QR code from api.qrserver.com, composite it onto the styled
 * card SVG, and return a PNG Buffer.
 *
 * @param {string} businessName  - display name shown on the card
 * @param {string} reviewUrl     - URL encoded into the QR (the review link)
 * @returns {Promise<Buffer>}    - PNG image buffer ready to upload to S3
 */
export async function generateMagicQrCard(businessName, reviewUrl) {
  // ── 1. Fetch QR from api.qrserver.com ─────────────────────────────────────
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=6&data=${encodeURIComponent(reviewUrl)}`;
  const qrRes    = await fetch(qrApiUrl);
  if (!qrRes.ok) {
    throw new Error(`QR server responded with status ${qrRes.status}`);
  }
  const qrArrayBuf = await qrRes.arrayBuffer();
  const qrBase64   = `data:image/png;base64,${Buffer.from(qrArrayBuf).toString("base64")}`;

  // ── 2. Build SVG string ────────────────────────────────────────────────────
  const svg = buildSvg(businessName, qrBase64);

  // ── 3. Render SVG → PNG using sharp ───────────────────────────────────────
  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toBuffer();

  return pngBuffer;
}
