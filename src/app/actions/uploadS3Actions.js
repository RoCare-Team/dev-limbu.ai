"use server";

import { uploadToS3 } from "@/utils/s3Config";

/**
 * Uploads a file to S3 via Server Action
 * @param {FormData} formData - The form data containing the file under the key "file"
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadToS3Action(formData) {
  try {
    const file = formData.get("file");

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || `upload-${Date.now()}`;
    const mimeType = file.type || "application/octet-stream";

    const result = await uploadToS3(buffer, fileName, mimeType);

    if (result.success) {
      return { success: true, url: result.url };
    } else {
      return { success: false, error: result.error || "Failed to upload to S3" };
    }
  } catch (error) {
    console.error("Upload to S3 Action Error:", error);
    return { success: false, error: error.message || "Internal Server Error during upload" };
  }
}
