import { NextResponse } from "next/server";
import { uploadToS3 } from "@/utils/s3Config";
import dbConnect from "@/lib/dbConnect";

// Upload PDF to S3 and optionally send WhatsApp
export async function POST(req) {
  try {
    await dbConnect();
    
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");
    const phone = formData.get("phone");
    const firstName = formData.get("firstName");
    const month = formData.get("month") || "current";

    if (!file) {  
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "application/pdf";
    const extension = file.name.split(".").pop() || "pdf";
    const fileName = `GMB_Report_${userId}_${Date.now()}.${extension}`;

    // Upload to S3
    const uploadResult = await uploadToS3(buffer, fileName, mimeType);

    if (!uploadResult.success) {
       console.error("S3 upload error:", uploadResult.error);
       return NextResponse.json(
         { success: false, message: "Failed to upload file to S3" },
         { status: 500 }
       );
    }

    const fileUrl = uploadResult.url;
    console.log("File uploaded to S3:", fileUrl);

    // If phone and firstName provided, send WhatsApp
    if (phone && firstName) {
      try {
        // Calculate month label
        let reportMonth;
        if (month === "current") {
          reportMonth = new Date();
        } else {
          reportMonth = new Date();
          reportMonth.setMonth(reportMonth.getMonth() - 1);
        }
        const monthLabel = reportMonth.toLocaleString("en-IN", { 
          month: "long", 
          year: "numeric" 
        });

        // Send WhatsApp with PDF attachment
        const waPayload = {
          campaignName: "gmb_report",
          phone: `91${phone}`,
          firstName,
          reportUrl: fileUrl,
          month,
        };

        const waResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/users-whastapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(waPayload),
        });

        const waData = await waResponse.json();

        return NextResponse.json({
          success: true,
          message: "File uploaded and WhatsApp sent!",
          fileUrl,
          monthLabel,
          whatsappSent: waData.success,
        });
      } catch (waError) {
        console.error("WhatsApp error:", waError);
        return NextResponse.json({
          success: true,
          message: "File uploaded but WhatsApp failed",
          fileUrl,
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        fileUrl,
      });
    }
  } catch (error) {
    console.error("[Upload Report Error]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
