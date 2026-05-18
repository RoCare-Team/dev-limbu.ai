// app/api/admin/invoice-tax/route.js

import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import connectDB from "@/lib/dbConnect"; // apne project ke actual DB path ke hisab se adjust karein
import FranchiseRevenue from "@/models/FranchiseRevenue";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // ✅ REPLACE with this
    const revenue = await FranchiseRevenue.findById(id).lean();

    if (!revenue) {
      return NextResponse.json(
        { success: false, message: "Revenue record not found" },
        { status: 404 },
      );
    }

    // ✅ Import User model at the top of the file:
    // import User from "@/models/User";

    // ✅ Fetch actual user details from User collection using leadId
    const userDetails = await User.findOne({
      userId: revenue.leadId,
    }).lean();

    // ✅ Merge both objects
    const user = {
      ...revenue,
      userEmail: userDetails?.email || "",
      userPhone: userDetails?.phone || "",
    };

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // =========================
    // Invoice Data
    // =========================
    const amount = Number(user.amount || 0);
    const taxable = (amount / 1.18).toFixed(2);
    const gst = (amount - taxable).toFixed(2);

    const invoiceNo = `LIM/${new Date().getFullYear()}/${String(
      Math.floor(Math.random() * 9999),
    ).padStart(4, "0")}`;

    const invoiceDate = new Date(
      user.createdAt || Date.now(),
    ).toLocaleDateString("en-IN");

    const customerName =
      user.leadName || user.name || user.fullName || "Customer";

    const planName = user.plan || "Subscription Plan";

    // =========================
    // PDF Setup
    // =========================
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));

    const pdfPromise = new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // =========================
    // Header
    // =========================
    doc.fontSize(20).font("Helvetica-Bold").text("TAX INVOICE", 0, 30, {
      align: "center",
    });

    // Outer Border
    doc.rect(30, 20, 535, 780).stroke();

    // =========================
    // Seller Information (Limbu.ai)
    // =========================
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("LIMBU AI TECHNOLOGIES", 40, 60);

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("8th Floor, B 32, JMD Megapolis,", 40, 78)
      .text("Sector 48, Sohna Road,", 40, 90)
      .text("Gurugram, Haryana, 122018", 40, 102)
      .text("GSTIN/UIN: 06XXXXXXXXXXXX", 40, 114)
      .text("State Name: Haryana, Code: 06", 40, 126)
      .text("E-Mail: info@limbu.ai", 40, 138)
      .text("Website: www.limbu.ai", 40, 150);

    // =========================
    // Invoice Info Box
    // =========================
    doc.rect(320, 60, 225, 110).stroke();

    const rightX = 330;
    let y = 70;

    const addInfoRow = (label, value) => {
      doc.font("Helvetica-Bold").fontSize(8).text(label, rightX, y);
      doc.font("Helvetica").text(value, rightX + 85, y);
      y += 16;
    };

    addInfoRow("Invoice No.", invoiceNo);
    addInfoRow("Dated", invoiceDate);

    addInfoRow("Payment Terms", "Due on Receipt");
    addInfoRow("Reference", "-");
    addInfoRow("Other References", "-");

    
    // =========================
    // REPLACE COMPLETE "Bill To" SECTION WITH THIS
    // =========================

    const customerEmail =
      user.userEmail || // ✅ exact field saved in FranchiseRevenue
      user.email || // fallback
      user.contactEmail ||
      user.leadEmail ||
      "-";

    const customerPhone =
      user.userPhone || // ✅ exact field saved in FranchiseRevenue
      user.phone || // fallback
      user.mobile ||
      user.contactNumber ||
      user.whatsappNumber ||
      user.leadPhone ||
      "-";

    const customerAddress =
      user.address || user.fullAddress || user.location || user.city || "-";

    const customerGST =
  user.gstNumber ||   // ✅ modal se save kiya gaya GST number
  user.gstin ||
  user.customerGST ||
  user.gst ||
  user.GSTIN ||
  user.companyGST ||
  user.businessGST ||
  user.userGST ||
  "-";

    const packageStartDate = user.userPackageStartDate
      ? new Date(user.userPackageStartDate).toLocaleDateString("en-IN")
      : user.packageStartDate
        ? new Date(user.packageStartDate).toLocaleDateString("en-IN")
        : user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-IN")
          : "-";

    // EXPIRY DATE
    // Replace ONLY the packageExpiryDate block with this

    const packageExpiryDate = user.userPackageExpiryDate
      ? new Date(user.userPackageExpiryDate).toLocaleDateString("en-IN")
      : user.packageExpiryDate
        ? new Date(user.packageExpiryDate).toLocaleDateString("en-IN")
        : user.expiryDate
          ? new Date(user.expiryDate).toLocaleDateString("en-IN")
          : user.userPackageStartDate
            ? (() => {
                // Start date + plan duration months (fallback)
                const start = new Date(user.userPackageStartDate);

                // Extract months from values like:
                // "1 Month", "3 Months", "6", etc.
                const rawDuration =
                  user.planDuration ||
                  user.packageDuration ||
                  user.planMonths ||
                  user.duration ||
                  "1";

                const monthsMatch = String(rawDuration).match(/\d+/);
                const months = monthsMatch ? parseInt(monthsMatch[0], 10) : 1;

                const expiry = new Date(start);
                expiry.setMonth(expiry.getMonth() + months);

                return expiry.toLocaleDateString("en-IN");
              })()
            : user.packageStartDate
              ? (() => {
                  const start = new Date(user.packageStartDate);

                  const rawDuration =
                    user.planDuration ||
                    user.packageDuration ||
                    user.planMonths ||
                    user.duration ||
                    "1";

                  const monthsMatch = String(rawDuration).match(/\d+/);
                  const months = monthsMatch ? parseInt(monthsMatch[0], 10) : 1;

                  const expiry = new Date(start);
                  expiry.setMonth(expiry.getMonth() + months);

                  return expiry.toLocaleDateString("en-IN");
                })()
              : "-";

    // PLAN DURATION (same fields as package/service data)
    const planDuration =
      user.planDuration ||
      user.packageDuration ||
      user.duration ||
      (user.planMonths
        ? `${user.planMonths} ${
            Number(user.planMonths) === 1 ? "Month" : "Months"
          }`
        : user.selectedPlanDuration) ||
      (() => {
        if (packageStartDate !== "-" && packageExpiryDate !== "-") {
          const start = new Date(
            user.userPackageStartDate ||
              user.packageStartDate ||
              user.createdAt,
          );

          const expiry = new Date(
            user.userPackageExpiryDate ||
              user.packageExpiryDate ||
              user.expiryDate,
          );

          const months =
            (expiry.getFullYear() - start.getFullYear()) * 12 +
            (expiry.getMonth() - start.getMonth());

          if (months > 0) {
            return `${months} ${months === 1 ? "Month" : "Months"}`;
          }
        }

        return "1 Month";
      })();

    // Increase Bill To box height to fit all rows
    doc.rect(40, 185, 505, 190).stroke();

    // REPLACE ONLY THE BILL TO TEXT SECTION WITH THIS

    // Helper function:
    // Label bold hoga, value normal rahegi
    const drawLabelValue = (label, value, x, y) => {
      // Label (bold)
      doc.font("Helvetica-Bold").fontSize(9).text(label, x, y, {
        continued: true,
      });

      // Value (normal)
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(value || "-");
    };

    doc.font("Helvetica-Bold").fontSize(9).text("Bill To", 50, 195);

    // LEFT COLUMN DETAILS
    drawLabelValue("Name: ", customerName, 50, 215);
    drawLabelValue("Email: ", customerEmail, 50, 230);
    drawLabelValue("Mobile: ", customerPhone, 50, 245);
    drawLabelValue("Address: ", customerAddress, 50, 260);
    drawLabelValue("Plan: ", planName, 50, 290);
    drawLabelValue("Plan Duration: ", planDuration, 50, 305);
    drawLabelValue("Start Date: ", packageStartDate, 50, 320);
    drawLabelValue("Expiry Date: ", packageExpiryDate, 50, 335);

    // RIGHT COLUMN DETAILS
    drawLabelValue("Place of Supply: ", "India", 300, 215);
    drawLabelValue("GSTIN/UIN: ", customerGST, 300, 230);
    drawLabelValue("Invoice Date: ", invoiceDate, 300, 245);
    drawLabelValue("Invoice No.: ", invoiceNo, 300, 260);
    drawLabelValue("Payment Status: ", "Paid", 300, 275);
    drawLabelValue("Amount Paid: ", `₹${amount.toFixed(2)}`, 300, 290);
    drawLabelValue("Taxable Value: ", `₹${taxable}`, 300, 305);
    drawLabelValue("IGST (18%): ", `₹${gst}`, 300, 320);
    drawLabelValue("Total Amount: ", `₹${amount.toFixed(2)}`, 300, 335);

    // =========================
    // Table Header
    // =========================
    const tableTop = 385;

    doc.rect(40, tableTop, 505, 25).stroke();

    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("Sl.", 45, tableTop + 8);
    doc.text("Description of Services", 80, tableTop + 8);
    doc.text("HSN/SAC", 320, tableTop + 8);
    doc.text("Qty", 390, tableTop + 8);
    doc.text("Rate", 430, tableTop + 8);
    doc.text("Amount", 490, tableTop + 8);

    // Vertical Lines
    doc
      .moveTo(75, tableTop)
      .lineTo(75, tableTop + 120)
      .stroke();
    doc
      .moveTo(315, tableTop)
      .lineTo(315, tableTop + 120)
      .stroke();
    doc
      .moveTo(385, tableTop)
      .lineTo(385, tableTop + 120)
      .stroke();
    doc
      .moveTo(425, tableTop)
      .lineTo(425, tableTop + 120)
      .stroke();
    doc
      .moveTo(485, tableTop)
      .lineTo(485, tableTop + 120)
      .stroke();

    // =========================
    // Table Data
    // =========================
    const rowY = tableTop + 30;

    doc.font("Helvetica").fontSize(8);
    doc.text("1", 50, rowY);
    doc.text(planName, 85, rowY);
    doc.text("9983", 330, rowY);
    doc.text("1", 400, rowY);
    doc.text(amount.toFixed(2), 430, rowY);
    doc.text(amount.toFixed(2), 490, rowY);

    // GST Details
    doc
      .font("Helvetica-Oblique")
      .text(`Taxable Amount: ₹${taxable}`, 85, rowY + 18)
      .text(`IGST @ 18%: ₹${gst}`, 85, rowY + 32);

    // Total Section

    // =========================
    // Table Height + Total Section
    // =========================
    const tableHeight = 120;
    const totalY = tableTop + tableHeight;

    // Left border of table body
    doc
      .moveTo(40, tableTop)
      .lineTo(40, tableTop + tableHeight)
      .stroke();

    // Right border of table body
    doc
      .moveTo(545, tableTop)
      .lineTo(545, tableTop + tableHeight)
      .stroke();

    // Column separators
    doc
      .moveTo(75, tableTop)
      .lineTo(75, tableTop + tableHeight)
      .stroke();
    doc
      .moveTo(315, tableTop)
      .lineTo(315, tableTop + tableHeight)
      .stroke();
    doc
      .moveTo(385, tableTop)
      .lineTo(385, tableTop + tableHeight)
      .stroke();
    doc
      .moveTo(425, tableTop)
      .lineTo(425, tableTop + tableHeight)
      .stroke();
    doc
      .moveTo(485, tableTop)
      .lineTo(485, tableTop + tableHeight)
      .stroke();

    // Bottom horizontal line of table body
    doc
      .moveTo(40, tableTop + tableHeight)
      .lineTo(545, tableTop + tableHeight)
      .stroke();

    // =========================
    // Grand Total
    // =========================
    doc.rect(40, totalY, 505, 25).stroke();

    // Amount column separator
    doc
      .moveTo(485, totalY)
      .lineTo(485, totalY + 25)
      .stroke();

    // Amount Chargeable text in the LEFT side of the same row
    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .text(
        `Amount Chargeable (in words): INR ${amount.toFixed(2)} Only`,
        70,
        totalY + 9,
        {
          width: 330, // left side area
          lineBreak: false,
        },
      );

    // Grand Total label
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Grand Total", 390, totalY + 7, {
        width: 85,
        align: "right",
      });

    // Grand Total amount
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`₹ ${amount.toFixed(2)}`, 480, totalY + 7, {
        width: 50,
        align: "right",
      });

   

    // =========================
    // Tax Summary
    // =========================
    doc.rect(40, totalY + 65, 505, 65).stroke();

    // Header row
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Taxable Value", 60, totalY + 75)
      .text("IGST 18%", 200, totalY + 75)
      .text("Total Tax", 310, totalY + 75)
      .text("Total Amount", 430, totalY + 75);

    // Values row
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(taxable, 60, totalY + 95)
      .text(gst, 200, totalY + 95)
      .text(gst, 310, totalY + 95)
      .text(amount.toFixed(2), 430, totalY + 95);

    // Remarks + Bank Details
    doc.rect(40, totalY + 130, 505, 95).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("Remarks:", 60, totalY + 140);

    doc
      .font("Helvetica")
      .text(`Subscription fees paid for ${planName}.`, 60, totalY + 155);

    doc
      .font("Helvetica-Bold")
      .text("Company's Bank Details", 380, totalY + 140);

    doc
      .font("Helvetica")
      .text("A/c Holder: LIMBU AI TECHNOLOGIES", 380, totalY + 155)
      .text("Bank Name: IDFC FIRST BANK", 380, totalY + 170)
      .text("A/c No.: 10259083115", 380, totalY + 185)
      .text("IFSC Code: IDFB0080175", 380, totalY + 200);

    // Declaration
    doc.rect(40, totalY + 225, 505, 65).stroke();

    doc.font("Helvetica-Bold").text("Declaration", 60, totalY + 235);

    doc
      .font("Helvetica")
      .fontSize(7)
      .text(
        "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
        60,
        totalY + 250,
        { width: 250 },
      );

    // Signature
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("for LIMBU AI TECHNOLOGIES", 380, totalY + 235);

    doc.font("Helvetica").text("Authorised Signatory", 420, totalY + 275);

    // Finish PDF
    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tax-invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate invoice",
      },
      { status: 500 },
    );
  }
}
