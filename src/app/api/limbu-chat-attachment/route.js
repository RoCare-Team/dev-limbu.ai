import { NextResponse } from "next/server";
import { uploadToS3 } from "@/utils/s3Config";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 5 MB per file)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/octet-stream";
    const resourceType = mime.startsWith("image/") ? "image" : "raw";
    const fileName = file.name || `chat-attachment-${Date.now()}`;

    const uploadResult = await uploadToS3(buffer, fileName, mime);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload to S3");
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      name: file.name || "attachment",
      resourceType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
