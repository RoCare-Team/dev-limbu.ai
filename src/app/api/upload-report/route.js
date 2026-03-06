import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/dbConnect";

// Upload PDF to Cloudinary and optionally send WhatsApp
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

    // Upload to Cloudinary
    return new Promise((resolve) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "gmb-reports",
          public_id: `GMB_Report_${userId}_${Date.now()}`,
          format: file.name.split(".").pop(),
        },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(
              NextResponse.json(
                { success: false, message: "Failed to upload file" },
                { status: 500 }
              )
            );
            return;
          }

          const fileUrl = result.secure_url;
          console.log("File uploaded:", fileUrl);

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

              resolve(
                NextResponse.json({
                  success: true,
                  message: "File uploaded and WhatsApp sent!",
                  fileUrl,
                  monthLabel,
                  whatsappSent: waData.success,
                })
              );
            } catch (waError) {
              console.error("WhatsApp error:", waError);
              resolve(
                NextResponse.json({
                  success: true,
                  message: "File uploaded but WhatsApp failed",
                  fileUrl,
                })
              );
            }
          } else {
            resolve(
              NextResponse.json({
                success: true,
                message: "File uploaded successfully",
                fileUrl,
              })
            );
          }
        }
      ).end(buffer);
    });

  } catch (error) {
    console.error("[Upload Report Error]:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
