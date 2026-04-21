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
 * Uploads a file to S3
 * @param {Buffer|ReadableStream|File} file - The file content
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type
 * @param {string} [customFolder] - Optional custom folder path
 * @returns {Promise<Object>} - S3 Upload response
 */
export const uploadToS3 = async (file, fileName, mimeType, customFolder = null) => {
  const folder = customFolder || getFolderName(mimeType);
  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: mimeType,
      },
    });

    const result = await upload.done();
    return {
      success: true,
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return {
      success: false,
      error: error.message,
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
