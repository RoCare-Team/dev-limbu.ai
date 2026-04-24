import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Determines the S3 folder based on file type/mime type
 * @param {string} mimeType - The mime type of the file
 * @returns {string} - The folder name
 */
const getFolderName = (mimeType) => {
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType.startsWith("video/")) return "videos";
  if (mimeType.startsWith("audio/")) return "audio";
  return "others";
};

/**
 * Uploads a file to S3.
 *
 * @param {Buffer|ReadableStream} file          - File content
 * @param {string}                fileName      - Original file name
 * @param {string}                mimeType      - MIME type of the file
 * @param {string}                [customFolder] - Optional S3 folder prefix
 * @returns {Promise<{ success: boolean, url?: string, key?: string, bucket?: string, error?: string }>}
 */
export const uploadToS3 = async (file, fileName, mimeType, customFolder = null) => {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";
  const folder = customFolder || getFolderName(mimeType);
  const key    = `${folder}/${Date.now()}-${fileName}`;

  // Extra headers for PDFs: open inline in browser, not as a download attachment
  const extraHeaders = mimeType === "application/pdf"
    ? { ContentDisposition: "inline" }
    : {};

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket:      bucket,
        Key:         key,
        Body:        file,
        ContentType: mimeType,
        ...extraHeaders,
      },
    });

    const result = await upload.done();

    // AWS SDK v3 Upload.done() returns Location only when the bucket is accessible.
    // Construct the URL explicitly so it's always available regardless of bucket ACL config.
    const url =
      result.Location ||
      `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key:    result.Key    || key,
      bucket: result.Bucket || bucket,
    };
  } catch (error) {
    console.error("[S3] Upload Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "S3 upload failed",
    };
  }
};

/**
 * Deletes a file from S3
 * @param {string} key - The S3 object key
 * @returns {Promise<Object>}
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("S3 Delete Error:", error);
    return { success: false, error: error.message };
  }
};

export { s3Client };
