import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import cloudinary from "@/lib/cloudinary";

function extFromMime(contentType) {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function uploadToS3(buffer, contentType) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const publicBase = process.env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const ext = extFromMime(contentType);
  const Key = `gmb-app/manual-posts/${randomUUID()}.${ext}`;
  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: buffer,
      ContentType: contentType || "image/jpeg",
    }),
  );

  const url = publicBase
    ? `${publicBase}/${Key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${Key}`;

  return { url, public_id: Key };
}

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

    try {
      const s3Result = await uploadToS3(buffer, contentType);
      if (s3Result) {
        return NextResponse.json({
          success: true,
          url: s3Result.url,
          public_id: s3Result.public_id,
          storage: "s3",
        });
      }
    } catch (s3Err) {
      console.error("S3 upload failed, using Cloudinary:", s3Err);
    }

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "nextjs_uploads" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      storage: "cloudinary",
    });
  } catch (error) {
    console.error("manual-upload:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
