    // src/app/api/admin/invoice-generator/route.js
    // Is file ko poora replace kar do.

    import { NextResponse } from "next/server";
    import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

    export async function POST(req) {
    try {
        const data = await req.json();

        const {
        invoiceNumber = "INV-001",
        customerName = "Customer",
        customerPhone = "",
        customerEmail = "",
        customerAddress = "",
        gstNumber = "",
        serviceName = "Service",
        amount = 0,
        date = new Date().toLocaleDateString("en-IN"),

        // Optional fields
        paymentTerms = "Due on Receipt",
        planName = "",
        planDuration = "",
        startDate = "",
        expiryDate = "",
        } = data;

        const finalAmount = Number(amount || 0);

        // GST Calculation (18%)
        const taxableValue = +(finalAmount / 1.18).toFixed(2);
        const gstAmount = +(finalAmount - taxableValue).toFixed(2);
        const cgst = +(gstAmount / 2).toFixed(2);
        const sgst = +(gstAmount / 2).toFixed(2);

        // =========================
        // PDF Create
        // =========================
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 Size

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = page.getWidth();

        // Helper function
    

const drawText = (
  text,
  x,
  y,
  size = 9,
  useBold = false,
  color = rgb(0, 0, 0)
) => {
  const str = String(text || "");

  // Agar manually bold chahiye to pura text bold
  if (useBold || !str.includes(":")) {
    page.drawText(str, {
      x,
      y,
      size,
      font: useBold ? boldFont : font,
      color,
    });
    return;
  }

  // ":" ke pehle wala label bold
  const colonIndex = str.indexOf(":");
  const label = str.substring(0, colonIndex + 1); // "Name:"
  const value = str.substring(colonIndex + 1).trim(); // "asim"

  // Label draw (Bold)
  page.drawText(label, {
    x,
    y,
    size,
    font: boldFont,
    color,
  });

  // Label width nikaalo
  const labelWidth = boldFont.widthOfTextAtSize(label, size);

  // Value draw (Normal)
  page.drawText(` ${value}`, {
    x: x + labelWidth,
    y,
    size,
    font,
    color,
  });
};

        // Helper: Box
        const drawBox = (x, y, width, height, fill = null) => {
        page.drawRectangle({
            x,
            y,
            width,
            height,
            borderWidth: 1,
            borderColor: rgb(0, 0, 0),
            ...(fill ? { color: fill } : {}),
        });
        };

        // Helper: Currency
    const formatRs = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

        // =========================
        // Outer Border
        // =========================
        drawBox(20, 20, 555, 802);

        // =========================
        // Header Title
        // =========================
        drawText("TAX INVOICE", 230, 795, 22, true);

        // =========================
        // Company Details (Left)
        // =========================
        drawText("LIMBU AI TECHNOLOGIES", 35, 760, 10, true);
        drawText("8th Floor, B 32, JMD Megapolis,", 35, 745, 8);
        drawText("Sector 48, Sohna Road,", 35, 733, 8);
        drawText("Gurugram, Haryana, 12201,", 35, 721, 8);
        drawText("GSTIN/UIN: 06XXXXXXXXXXXX", 35, 709, 8);
        drawText("State Name: Haryana, Code: 06 : 18", 35, 697, 8);
        drawText("E-Mail: info@limbu.ai", 35, 685, 8);
        drawText("Website: www.limbu.ai", 35, 673, 8);

        // =========================
        // Invoice Info Box (Right)
        // =========================
        drawBox(320, 650, 225, 110);

        drawText("Invoice No.", 330, 742, 8, true);
        drawText(invoiceNumber, 420, 742, 8);

        drawText("Dated", 330, 726, 8, true);
        drawText(date, 420, 726, 8);

        drawText("Payment Terms", 330, 710, 8, true);
        drawText(paymentTerms, 420, 710, 8);

        drawText("Reference", 330, 694, 8, true);
        drawText("--", 420, 694, 8);

        drawText("Other References", 330, 678, 8, true);
        drawText("--", 420, 678, 8);

        
        // =========================
// Bill To Box
// IMPORTANT:

// =========================

drawBox(30, 480, 515, 170);

// Left Side (Customer Details)
drawText("Bill To", 40, 635, 11, true);

drawText(`Name: ${customerName}`, 40, 615, 8, true);
drawText(`Email: ${customerEmail || "-"}`, 40, 600, 8);
drawText(`Mobile: ${customerPhone || "-"}`, 40, 585, 8);
drawText(`Address: ${customerAddress || "-"}`, 40, 570, 8);

// Plan Details (reference invoice ke exact layout jaisa)
drawText(`Plan: ${planName || "-"}`, 40, 535, 8, true);
drawText(`Plan Duration: ${planDuration || "-"}`, 40, 520, 8);
drawText(`Start Date: ${startDate || "-"}`, 40, 505, 8);
drawText(`Expiry Date: ${expiryDate || "-"}`, 40, 490, 8);

// Right Side (Invoice Details)
// Left column ke "Name" line ke saath aligned
drawText("Place of Supply: India", 310, 615, 8, );
drawText(`GSTIN/UIN: ${gstNumber || "-"}`, 310, 600, 8,);
drawText(`Invoice No.: ${invoiceNumber}`, 310, 585, 8, );
drawText(`Invoice Date: ${date}`, 310, 570, 8, );
drawText("Payment Status: Paid", 310, 555, 8, );
drawText(`Amount Paid: ${formatRs(finalAmount)}`, 310, 540, 8, );
drawText(`Taxable Value: ${formatRs(taxableValue)}`, 310, 525, 8, );
drawText(`IGST (18%): ${formatRs(gstAmount)}`, 310, 510, 8, );
drawText(`Total Amount: ${formatRs(finalAmount)}`, 310, 495, 8, );

    
        // =========================
        // Main Service Table
        // =========================
        const tableY = 355;

        // Outer Table
        drawBox(30, tableY, 515, 95);

        // Header Row
        drawBox(30, tableY + 75, 515, 20, rgb(0.95, 0.95, 0.95));

        // Column Widths
        const colX = [30, 60, 320, 390, 430, 485, 545];

        // Vertical Lines
        for (let i = 1; i < colX.length - 1; i++) {
        page.drawLine({
            start: { x: colX[i], y: tableY },
            end: { x: colX[i], y: tableY + 95 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        }

        // Header Labels
        drawText("Sl.", 40, tableY + 82, 7, true);
        drawText("Description of Services", 70, tableY + 82, 7, true);
        drawText("HSN/SAC", 330, tableY + 82, 7, true);
        drawText("Qty", 400, tableY + 82, 7, true);
        drawText("Rate", 440, tableY + 82, 7, true);
        drawText("Amount", 495, tableY + 82, 7, true);

        // Data Row
        drawText("1", 40, tableY + 55, 8);
        drawText(serviceName, 70, tableY + 55, 8);
        drawText("9983", 330, tableY + 55, 8);
        drawText("1", 405, tableY + 55, 8);
        drawText(finalAmount.toFixed(2), 440, tableY + 55, 8);
        drawText(finalAmount.toFixed(2), 495, tableY + 55, 8);

        // Tax Details inside table
        drawText(`Taxable Amount : ${taxableValue.toFixed(2)}`, 70, tableY + 30, 7);
        drawText(`IGST @ 18% : ${gstAmount.toFixed(2)}`, 70, tableY + 18, 7);

        // Bottom Row
        drawBox(30, tableY - 20, 515, 20);

        drawText(
        `Amount Chargeable (in words): INR ${finalAmount.toFixed(
            2
        )} Only`,
        35,
        tableY - 13,
        6,
        true
        );

        drawText("Grand Total", 435, tableY - 13, 7, true);
        drawText(formatRs(finalAmount), 500, tableY - 13, 7, true);

        // =========================
        // Tax Summary Box
        // =========================
        drawBox(30, 260, 515, 70);

        drawText("Taxable Value", 50, 312, 8, true);
        drawText("IGST 18%", 170, 312, 8, true);
        drawText("Total Tax", 280, 312, 8, true);
        drawText("Total Amount", 400, 312, 8, true);

        drawText(taxableValue.toFixed(2), 60, 290, 8);
        drawText(gstAmount.toFixed(2), 180, 290, 8);
        drawText(gstAmount.toFixed(2), 290, 290, 8);
        drawText(finalAmount.toFixed(2), 410, 290, 8, true);

        // =========================
        // Remarks + Bank Details
        // =========================
        drawBox(30, 150, 515, 110);

        drawText("Remarks:", 40, 240, 8, true);
        drawText(
        `Subscription fees paid for ${serviceName}.`,
        40,
        226,
        7
        );

        drawText("Company's Bank Details", 340, 240, 8, true);
        drawText("A/c Holder: LIMBU AI TECHNOLOGIES", 340, 226, 7);
        drawText("Bank Name: HDFC BANK", 340, 214, 7);
        drawText("A/c No.: XXXXXXXXXXXX", 340, 202, 7);
        drawText("IFSC Code: HDFC000XXXX", 340, 190, 7);

        // =========================
        // Declaration
        // =========================
        drawBox(30, 60, 515, 90);

        drawText("Declaration", 40, 135, 8, true);
        drawText(
        "We declare that this invoice shows the actual price of the services described",
        40,
        120,
        6
        );
        drawText(
        "and that all particulars are true and correct.",
        40,
        110,
        6
        );

        drawText("For LIMBU AI TECHNOLOGIES", 360, 120, 8, true);
        drawText("Authorised Signatory", 400, 80, 7);

        // =========================
        // Save PDF
        // =========================
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${invoiceNumber}.pdf"`,
        },
        });
    } catch (error) {
        console.error("Invoice Generator Error:", error);

        return NextResponse.json(
        {
            success: false,
            message: error.message || "Failed to generate invoice",
        },
        { status: 500 }
        );
    }
    }