/**
 * keywordResearchPdfGenerator.js
 * Server-side PDF for AI Keyword Research reports (pdfkit).
 */

import PDFDocument from "pdfkit";

const C = {
  yellow: "#EAB308",
  black: "#0B0F19",
  slate6: "#475569",
  slate4: "#94A3B8",
  slate2: "#E2E8F0",
  slate0: "#F8FAFC",
  white: "#FFFFFF",
  green: "#16A34A",
  orange: "#D97706",
  red: "#DC2626",
};

const TYPE_LABELS = {
  primary: "Primary",
  "long-tail": "Long-tail",
  local: "Local",
  commercial: "Commercial",
  gbp: "GBP",
};

function competitionColor(level) {
  if (level === "LOW") return C.green;
  if (level === "HIGH") return C.red;
  return C.orange;
}

function addFooter(doc) {
  const pw = doc.page.width;
  const ph = doc.page.height;
  doc
    .moveTo(40, ph - 42)
    .lineTo(pw - 40, ph - 42)
    .lineWidth(0.5)
    .strokeColor(C.slate2)
    .stroke();
  doc
    .fontSize(8)
    .fillColor(C.slate4)
    .font("Helvetica")
    .text("Powered by Limbu.ai  •  limbu.ai", 40, ph - 32, {
      width: pw - 80,
      align: "center",
    });
}

/**
 * @param {object} data
 * @param {string} data.businessName
 * @param {string} data.aiSummary
 * @param {string} [data.inferredCategory]
 * @param {string[]} [data.inferredServices]
 * @param {string} [data.locationName]
 * @param {Array<{keyword:string,type?:string,volume?:number,competition?:string,intent?:string}>} data.keywords
 * @returns {Promise<Buffer>}
 */
export async function generateKeywordResearchPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pw = doc.page.width - 80;
      const genDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Header bar
      doc.rect(40, 40, pw, 72).fill(C.black);
      doc
        .fontSize(20)
        .fillColor(C.yellow)
        .font("Helvetica-Bold")
        .text("AI KEYWORD RESEARCH", 56, 58);
      doc
        .fontSize(9)
        .fillColor(C.slate4)
        .font("Helvetica")
        .text("Professional SEO Keyword Report", 56, 84);

      let y = 130;

      // Business info card
      doc.roundedRect(40, y, pw, 90, 8).fill(C.slate0);
      doc.roundedRect(40, y, pw, 90, 8).strokeColor(C.slate2).lineWidth(1).stroke();

      doc
        .fontSize(8)
        .fillColor(C.slate4)
        .font("Helvetica-Bold")
        .text("BUSINESS", 56, y + 14);
      doc
        .fontSize(16)
        .fillColor(C.black)
        .font("Helvetica-Bold")
        .text(data.businessName || "—", 56, y + 28, { width: pw - 32 });

      doc
        .fontSize(8)
        .fillColor(C.slate4)
        .font("Helvetica-Bold")
        .text("GENERATED ON", 56, y + 58);
      doc
        .fontSize(10)
        .fillColor(C.black)
        .font("Helvetica")
        .text(genDate, 140, y + 57);

      if (data.locationName) {
        doc
          .fontSize(8)
          .fillColor(C.slate4)
          .font("Helvetica-Bold")
          .text("LOCATION", 300, y + 58);
        doc
          .fontSize(10)
          .fillColor(C.black)
          .font("Helvetica")
          .text(data.locationName, 370, y + 57, { width: pw - 340 });
      }

      y += 108;

      // AI analysis
      if (data.inferredCategory || data.aiSummary) {
        doc
          .fontSize(10)
          .fillColor(C.black)
          .font("Helvetica-Bold")
          .text("AI ANALYSIS", 40, y);
        y += 16;

        if (data.inferredCategory) {
          doc
            .fontSize(8)
            .fillColor(C.slate4)
            .font("Helvetica")
            .text(`Category: ${data.inferredCategory}`, 40, y);
          y += 14;
        }
        if (data.inferredServices?.length) {
          doc
            .fontSize(8)
            .fillColor(C.slate4)
            .font("Helvetica")
            .text(`Services: ${data.inferredServices.slice(0, 5).join(", ")}`, 40, y, {
              width: pw,
            });
          y += 14;
        }
        if (data.aiSummary) {
          doc
            .fontSize(9)
            .fillColor(C.slate6)
            .font("Helvetica")
            .text(data.aiSummary, 40, y, { width: pw, lineGap: 3 });
          y += doc.heightOfString(data.aiSummary, { width: pw, lineGap: 3 }) + 20;
        } else {
          y += 8;
        }
      }

      // Keywords table header
      doc
        .fontSize(10)
        .fillColor(C.black)
        .font("Helvetica-Bold")
        .text(`KEYWORDS (${data.keywords?.length || 0})`, 40, y);
      y += 18;

      const cols = { kw: 40, type: 260, vol: 340, comp: 400, intent: 460 };
      const rowH = 22;

      doc.rect(40, y, pw, rowH).fill(C.black);
      doc.fontSize(7).fillColor(C.yellow).font("Helvetica-Bold");
      doc.text("KEYWORD", cols.kw, y + 7);
      doc.text("TYPE", cols.type, y + 7);
      doc.text("VOLUME", cols.vol, y + 7);
      doc.text("DIFF.", cols.comp, y + 7);
      doc.text("INTENT", cols.intent, y + 7);
      y += rowH;

      const keywords = data.keywords || [];
      keywords.forEach((kw, i) => {
        if (y > doc.page.height - 80) {
          addFooter(doc);
          doc.addPage();
          y = 50;
        }

        if (i % 2 === 0) {
          doc.rect(40, y, pw, rowH).fill(C.slate0);
        }

        doc.fontSize(8).fillColor(C.black).font("Helvetica-Bold");
        doc.text(kw.keyword || "—", cols.kw, y + 7, { width: 210, ellipsis: true });

        doc.fontSize(7).fillColor(C.slate6).font("Helvetica");
        doc.text(TYPE_LABELS[kw.type] || kw.type || "—", cols.type, y + 7);

        doc.text(
          kw.volume ? Number(kw.volume).toLocaleString("en-IN") : "—",
          cols.vol,
          y + 7
        );

        doc
          .fillColor(competitionColor(kw.competition))
          .font("Helvetica-Bold")
          .text(kw.competition || "—", cols.comp, y + 7);

        doc.fillColor(C.slate4).font("Helvetica").text(kw.intent || "—", cols.intent, y + 7, {
          width: 90,
          ellipsis: true,
        });

        y += rowH;
      });

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * PDF for saved keywords from Keyword Planner (non-AI).
 */
export async function generateSavedKeywordsPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pw = doc.page.width - 80;
      const genDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      doc.rect(40, 40, pw, 72).fill(C.black);
      doc
        .fontSize(20)
        .fillColor(C.yellow)
        .font("Helvetica-Bold")
        .text("KEYWORD RESEARCH REPORT", 56, 58);
      doc
        .fontSize(9)
        .fillColor(C.slate4)
        .font("Helvetica")
        .text("Saved Keywords — Keyword Planner", 56, 84);

      let y = 130;

      doc.roundedRect(40, y, pw, 70, 8).fill(C.slate0);
      doc.roundedRect(40, y, pw, 70, 8).strokeColor(C.slate2).lineWidth(1).stroke();

      doc.fontSize(8).fillColor(C.slate4).font("Helvetica-Bold").text("BUSINESS", 56, y + 14);
      doc
        .fontSize(16)
        .fillColor(C.black)
        .font("Helvetica-Bold")
        .text(data.businessName || "—", 56, y + 28, { width: pw - 32 });

      doc.fontSize(8).fillColor(C.slate4).font("Helvetica-Bold").text("GENERATED ON", 56, y + 50);
      doc.fontSize(10).fillColor(C.black).font("Helvetica").text(genDate, 140, y + 49);

      if (data.locationName) {
        doc.fontSize(8).fillColor(C.slate4).font("Helvetica-Bold").text("LOCATION", 300, y + 50);
        doc
          .fontSize(10)
          .fillColor(C.black)
          .font("Helvetica")
          .text(data.locationName, 370, y + 49, { width: pw - 340 });
      }

      y += 88;

      doc
        .fontSize(10)
        .fillColor(C.black)
        .font("Helvetica-Bold")
        .text(`SAVED KEYWORDS (${data.keywords?.length || 0})`, 40, y);
      y += 18;

      const cols = { kw: 40, vol: 340, comp: 420 };
      const rowH = 22;

      doc.rect(40, y, pw, rowH).fill(C.black);
      doc.fontSize(7).fillColor(C.yellow).font("Helvetica-Bold");
      doc.text("KEYWORD", cols.kw, y + 7);
      doc.text("POPULARITY", cols.vol, y + 7);
      doc.text("DIFFICULTY", cols.comp, y + 7);
      y += rowH;

      (data.keywords || []).forEach((kw, i) => {
        if (y > doc.page.height - 80) {
          addFooter(doc);
          doc.addPage();
          y = 50;
        }
        if (i % 2 === 0) doc.rect(40, y, pw, rowH).fill(C.slate0);

        doc.fontSize(8).fillColor(C.black).font("Helvetica-Bold");
        doc.text(kw.keyword || "—", cols.kw, y + 7, { width: 280, ellipsis: true });
        doc.fontSize(8).fillColor(C.black).font("Helvetica");
        doc.text(kw.volume ? Number(kw.volume).toLocaleString("en-IN") : "—", cols.vol, y + 7);
        doc
          .fillColor(competitionColor(kw.competition))
          .font("Helvetica-Bold")
          .text(kw.competition || "—", cols.comp, y + 7);
        y += rowH;
      });

      addFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
