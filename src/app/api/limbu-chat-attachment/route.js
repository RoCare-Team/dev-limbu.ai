import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "File uploads are not configured on this server." },
        { status: 503 }
      );
    }

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

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "limbu_chat",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
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
