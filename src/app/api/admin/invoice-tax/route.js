// app/api/admin/invoice-tax/route.js

import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import connectDB from "@/lib/dbConnect";
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

// Helper function to convert Amount to Words
function amountToWords(amount) {
  const num = Math.floor(amount);
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };
  return inWords(num) + " Only";
}

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const revenue = await FranchiseRevenue.findById(id).lean();
    if (!revenue) {
      return NextResponse.json({ success: false, message: "Revenue record not found" }, { status: 404 });
    }

    const userDetails = await User.findOne({ userId: revenue.leadId }).lean();
    const user = { ...revenue, ...userDetails };

    // Smart Date Logic
    const startDate = revenue.packageStartDate ? new Date(revenue.packageStartDate) : new Date(revenue.createdAt);
    const expiryDate = revenue.packageExpiryDate ? new Date(revenue.packageExpiryDate) : null;
    let displayDuration = "1 Month";
    if (startDate && expiryDate && !isNaN(expiryDate)) {
      const months = (expiryDate.getFullYear() - startDate.getFullYear()) * 12 + (expiryDate.getMonth() - startDate.getMonth());
      displayDuration = `${months} ${months > 1 ? 'Months' : 'Month'}`;
    }

    const formattedStart = startDate.toLocaleDateString("en-IN");
    const formattedEnd = (expiryDate && !isNaN(expiryDate)) ? expiryDate.toLocaleDateString("en-IN") : "-";

    const amount = Number(revenue.amount || 0);
    const taxable = amount / 1.18;
    const gst = amount - taxable;

    const invoiceNo = `LIM/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
    const invoiceDate = new Date(revenue.createdAt).toLocaleDateString("en-IN");

    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    const pdfPromise = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(buffers))));

    const primaryColor = "#333333";
    const borderColor = "#CCCCCC";
    const tableHeaderBg = "#F5F5F5";
    const margin = 40;
    const contentWidth = 515;

    // 1. Header
    doc.rect(margin, margin, contentWidth, 30).fill(tableHeaderBg);
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("TAX INVOICE", margin, margin + 8, { align: "center", width: contentWidth });

    let currentY = margin + 50;

    // 2. Seller Info
    doc.fontSize(11).font("Helvetica-Bold").text("LIMBU AI TECHNOLOGIES", margin, currentY);
    doc.fontSize(8).font("Helvetica").fillColor("#666666")
       .text("8th Floor, Unit No. 831, JMD Megapolis, Sector 48, Sohna Road,", margin, currentY + 15)
       .text("Gurugram, Haryana, 122018 | GSTIN: 06XXXXXXXXXXXX", margin, currentY + 25)
       .text("Email: info@limbu.ai | Web: www.limbu.ai", margin, currentY + 35);

    // 3. Invoice Info Box
    doc.roundedRect(350, currentY, 205, 75, 4).lineWidth(0.5).strokeColor(borderColor).stroke();
    doc.fillColor(primaryColor).fontSize(8)
       .font("Helvetica-Bold").text("Invoice No:", 360, currentY + 10).font("Helvetica").text(invoiceNo, 435, currentY + 10)
       .font("Helvetica-Bold").text("Invoice Date:", 360, currentY + 25).font("Helvetica").text(invoiceDate, 435, currentY + 25)
       .font("Helvetica-Bold").text("Terms:", 360, currentY + 40).font("Helvetica").text("Due on Receipt", 435, currentY + 40)
       .font("Helvetica-Bold").text("Status:", 360, currentY + 55).fillColor("green").text("PAID", 435, currentY + 55).fillColor(primaryColor);

    currentY += 95;

    // 4. Billed To Section
    doc.roundedRect(margin, currentY, contentWidth, 120, 4).strokeColor(borderColor).stroke();
    doc.rect(margin, currentY, contentWidth, 20).fillAndStroke(tableHeaderBg, borderColor);
    doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text("Billed To & Subscription Details", margin + 10, currentY + 6);

    const leftCol = margin + 10;
    const rightCol = margin + 270;
    let detailY = currentY + 28;

    const addDetail = (label, value, x, y) => {
      doc.font("Helvetica-Bold").fontSize(8).text(label, x, y, { continued: true }).font("Helvetica").text(value || "-");
    };

    addDetail("Name: ", revenue.leadName, leftCol, detailY);
    addDetail("Email: ", revenue.email || user.email, leftCol, detailY + 15);
    addDetail("Mobile: ", revenue.phone || user.phone, leftCol, detailY + 30);
    addDetail("GSTIN: ", revenue.gstNumber || "N/A", leftCol, detailY + 45);
    addDetail("Address: ", user.address || "-", leftCol, detailY + 60);
    addDetail("Place of Supply: ", "India (Haryana)", leftCol, detailY + 75);

    addDetail("Plan Name: ", revenue.plan, rightCol, detailY);
    addDetail("Plan Duration: ", displayDuration, rightCol, detailY + 15);
    addDetail("Start Date: ", formattedStart, rightCol, detailY + 30);
    addDetail("Expiry Date: ", formattedEnd, rightCol, detailY + 45);
    addDetail("Payment Status: ", "Paid (Online)", rightCol, detailY + 60);
    addDetail("UTR No: ", revenue.utrNumber || "-", rightCol, detailY + 75);

    currentY += 135;

    // 5. SERVICES TABLE (FIXED LINES & ALIGNMENT)
    const cols = { sl: 40, desc: 70, hsn: 300, qty: 360, rate: 405, amt: 475 };
    const tableTop = currentY;
    const tableHeight = 120; // Entire table height

    // Header Background
    doc.rect(margin, tableTop, contentWidth, 20).fillAndStroke(tableHeaderBg, borderColor);
    
    // Header Text
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(8);
    doc.text("#", cols.sl + 5, tableTop + 6);
    doc.text("Description of Services", cols.desc + 5, tableTop + 6);
    doc.text("HSN/SAC", cols.hsn + 5, tableTop + 6);
    doc.text("Qty", cols.qty + 5, tableTop + 6);
    doc.text("Rate", cols.rate, tableTop + 6, { width: 60, align: "right" });
    doc.text("Amount", cols.amt, tableTop + 6, { width: 75, align: "right" });

    // Table Body (Outer Box)
    doc.rect(margin, tableTop, contentWidth, tableHeight).strokeColor(borderColor).stroke();

    // Vertical Column Lines
    const lineBottom = tableTop + tableHeight;
    doc.moveTo(cols.desc, tableTop).lineTo(cols.desc, lineBottom).stroke();
    doc.moveTo(cols.hsn, tableTop).lineTo(cols.hsn, lineBottom).stroke();
    doc.moveTo(cols.qty, tableTop).lineTo(cols.qty, lineBottom).stroke();
    doc.moveTo(cols.rate, tableTop).lineTo(cols.rate, lineBottom).stroke();
    doc.moveTo(cols.amt, tableTop).lineTo(cols.amt, lineBottom).stroke();

    // Row Data
    const rowY = tableTop + 25;
    doc.font("Helvetica").fontSize(8).fillColor(primaryColor);
    doc.text("1", cols.sl + 5, rowY);
    doc.text(`Service Subscription: ${revenue.plan}`, cols.desc + 5, rowY, { width: 220 });
    doc.text("9983", cols.hsn + 5, rowY);
    doc.text("1.00", cols.qty + 5, rowY);
    doc.text(formatCurrency(taxable), cols.rate, rowY, { width: 60, align: "right" });
    doc.text(formatCurrency(taxable), cols.amt, rowY, { width: 75, align: "right" });

    // Tax Row
    doc.fontSize(7).fillColor("#666666").font("Helvetica-Oblique")
       .text(`Output IGST @ 18% (on INR ${formatCurrency(taxable)})`, cols.desc + 5, rowY + 15);
    doc.fontSize(8).fillColor(primaryColor).font("Helvetica")
       .text(formatCurrency(gst), cols.amt, rowY + 15, { width: 75, align: "right" });

    currentY = lineBottom;

    // 6. TOTAL SECTION (FIXED OVERFLOW)
    doc.rect(margin, currentY, contentWidth, 30).strokeColor(borderColor).stroke();
    doc.font("Helvetica-Bold").fontSize(9).text("Total Amount Payable (Inclusive of GST)", margin + 10, currentY + 10);
    
    // Increased width for price to prevent overflow
    doc.fontSize(10).text(`INR ${formatCurrency(amount)}`, 440, currentY + 10, { width: 110, align: "right" });

    // 7. Amount in Words
    doc.fontSize(8).font("Helvetica-Bold").text(`Amount in Words: INR ${amountToWords(amount)}`, margin, currentY + 45);

    // 8. Bank Details
    currentY += 75;
    doc.roundedRect(margin, currentY, contentWidth, 75, 4).strokeColor(borderColor).stroke();
    doc.font("Helvetica-Bold").text("Company's Bank Details:", margin + 10, currentY + 10);
    doc.font("Helvetica").fontSize(8)
       .text("Bank Name: IDFC FIRST BANK | A/c Name: LIMBU AI TECHNOLOGIES", margin + 10, currentY + 25)
       .text(`Account No: 10259083115 | IFSC: IDFB0080175`, margin + 10, currentY + 37)
       .text(`UTR No: ${revenue.utrNumber || "N/A"}`, margin + 10, currentY + 50);

    // 9. Sign & Declaration
    currentY += 95;
    doc.font("Helvetica-Bold").fontSize(8).text("Declaration:", margin, currentY);
    doc.font("Helvetica").fontSize(7).fillColor("#666666")
       .text("We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.", margin, currentY + 12, { width: 280 });

    doc.font("Helvetica-Bold").fontSize(8).fillColor(primaryColor).text("For LIMBU AI TECHNOLOGIES", 380, currentY);
    doc.font("Helvetica").text("Authorised Signatory", 415, currentY + 55);

    // Footer
    doc.fontSize(6).fillColor("#999999").text("8th Floor, Unit No. 831, JMD Megapolis, Sohna Road, Gurugram, Haryana - 122018", margin, 790, { align: "center", width: contentWidth });

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-invoice-${invoiceNo.replace(/\//g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}