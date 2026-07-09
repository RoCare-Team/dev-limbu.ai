import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { uploadToS3 } from "@/utils/s3Config";
import { sendGmbHealthWhatsApp, normalizeIndiaPhone } from "@/lib/gmbHealthWhatsApp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { userId, businessName, monthLabel, pdfBase64, imageBase64 } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const destination = normalizeIndiaPhone(
      user.phone || user.mobile || user.whatsappNumber || user.contactNumber
    );
    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account mobile number is missing or invalid. Update it in profile settings.",
        },
        { status: 400 }
      );
    }

    const safeName = (businessName || "Business").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const fileName = `Business_Health_${safeName}.pdf`;

    // Preferred: upload the FULL report PDF to S3 and send it as a titled document.
    // Fallback: an image (older templates with an image header).
    let documentUrl = "";
    let imageUrl = "";
    if (pdfBase64) {
      const up = await uploadToS3(pdfBase64, fileName, "application/pdf", "reports");
      if (up.success && up.url) {
        documentUrl = up.url;
      } else {
        console.error("[gmb-health-send-whatsapp] PDF upload failed:", up.error);
        return NextResponse.json(
          { success: false, error: `Could not upload report PDF: ${up.error || "S3 error"}` },
          { status: 502 }
        );
      }
    } else if (imageBase64) {
      const up = await uploadToS3(imageBase64, `Health_${safeName}.png`, "image/png", "reports");
      if (up.success && up.url) imageUrl = up.url;
    }

    const customerName = (businessName || user.fullName || "Customer").trim();

    const result = await sendGmbHealthWhatsApp({
      destination,
      customerName,
      monthLabel: monthLabel || "",
      documentUrl,
      imageUrl,
      fileName,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Health report sent to your WhatsApp (${destination})`,
      data: result.data,
    });
  } catch (err) {
    console.error("[gmb-health-send-whatsapp]", err);
    return NextResponse.json(
      { success: false, error: err.message || "WhatsApp send failed" },
      { status: 500 }
    );
  }
}
