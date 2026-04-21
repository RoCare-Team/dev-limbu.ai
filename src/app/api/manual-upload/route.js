import { NextResponse } from "next/server";
import { uploadToS3 } from "@/utils/s3Config";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Image is required" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";
    const fileName = file.name || `manual-upload-${Date.now()}`;

    const s3Result = await uploadToS3(buffer, fileName, contentType);

    if (s3Result.success) {
      return NextResponse.json({
        success: true,
        url: s3Result.url,
        public_id: s3Result.key,
        storage: "s3",
      });
    } else {
       throw new Error(s3Result.error || "Failed to upload to S3");
    }

  } catch (error) {
    console.error("manual-upload:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
