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
 * Validates and converts file input to a valid Buffer or Stream
 * Handles: Buffer, Stream, Blob, Response, File, base64 string
 * @param {Buffer|Stream|Blob|Response|File|string} file - The file input
 * @param {string} fileName - Original file name (for debugging)
 * @returns {Promise<{buffer: Buffer|Stream, isValid: boolean, error?: string}>}
 */
const validateAndConvertFile = async (file, fileName) => {
  try {
    // ✅ Case 1: Already a valid Buffer
    if (Buffer.isBuffer(file)) {
      console.log(`[S3] ✅ File is already a Buffer (${file.length} bytes) for: ${fileName}`);
      return { buffer: file, isValid: true };
    }

    // ✅ Case 2: Stream (ReadableStream, Node.js Stream)
    if (file && typeof file.pipe === "function") {
      console.log(`[S3] ✅ File is a Stream for: ${fileName}`);
      return { buffer: file, isValid: true };
    }

    // ✅ Case 3: Web Stream (ReadableStream from fetch)
    if (file && typeof file.getReader === "function") {
      console.log(`[S3] ⚙️ Converting Web ReadableStream to Buffer for: ${fileName}`);
      const reader = file.getReader();
      const chunks = [];
      let result = await reader.read();
      while (!result.done) {
        chunks.push(Buffer.from(result.value));
        result = await reader.read();
      }
      const buffer = Buffer.concat(chunks);
      console.log(`[S3] ✅ Converted Web Stream to Buffer (${buffer.length} bytes)`);
      return { buffer, isValid: true };
    }

    // ✅ Case 4: fetch Response object
    if (file && typeof file.arrayBuffer === "function" && file.body) {
      console.log(`[S3] ⚙️ Converting fetch Response to Buffer for: ${fileName}`);
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      console.log(`[S3] ✅ Converted Response to Buffer (${buffer.length} bytes)`);
      return { buffer, isValid: true };
    }

    // ✅ Case 5: Blob object
    if (file && typeof file.arrayBuffer === "function" && file.type) {
      console.log(`[S3] ⚙️ Converting Blob to Buffer for: ${fileName}`);
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      console.log(`[S3] ✅ Converted Blob to Buffer (${buffer.length} bytes)`);
      return { buffer, isValid: true };
    }

    // ✅ Case 6: File object (from HTML input)
    if (file && typeof file.slice === "function" && file.name) {
      console.log(`[S3] ⚙️ Converting File object to Buffer for: ${file.name}`);
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      console.log(`[S3] ✅ Converted File to Buffer (${buffer.length} bytes)`);
      return { buffer, isValid: true };
    }

    // ✅ Case 7: Base64 string (data:image/png;base64,...)
    if (typeof file === "string") {
      let base64Str = file;
      
      // Remove data URI prefix if present
      if (file.includes("base64,")) {
        base64Str = file.split("base64,")[1];
      }

      // Check if it looks like base64 (rough validation)
      if (/^[A-Za-z0-9+/=]+$/.test(base64Str.trim())) {
        console.log(`[S3] ⚙️ Converting base64 string to Buffer for: ${fileName}`);
        const buffer = Buffer.from(base64Str, "base64");
        console.log(`[S3] ✅ Converted base64 to Buffer (${buffer.length} bytes)`);
        return { buffer, isValid: true };
      }

      // If it's a regular string (logs/text), reject it
      console.error(`[S3] ❌ Received string that is not valid base64. First 100 chars:`, file.substring(0, 100));
      return {
        isValid: false,
        error: "File must be a Buffer, Stream, or valid base64 string. Received plain text instead.",
      };
    }

    // ❌ Invalid type
    console.error(`[S3] ❌ Invalid file type: ${typeof file}. Expected Buffer, Stream, Response, Blob, File, or base64.`);
    return {
      isValid: false,
      error: `Invalid file type: ${typeof file}. Expected Buffer, Stream, Response, Blob, File, or base64.`,
    };
  } catch (error) {
    console.error(`[S3] ❌ Error validating file:`, error.message);
    return {
      isValid: false,
      error: `File validation error: ${error.message}`,
    };
  }
};

/**
 * Uploads a file to S3.
 *
 * @param {Buffer|Stream|Response|Blob|File|string} file          - File content (Buffer, Stream, Response, Blob, File, or base64)
 * @param {string}                fileName      - Original file name
 * @param {string}                mimeType      - MIME type of the file
 * @param {string}                [customFolder] - Optional S3 folder prefix
 * @returns {Promise<{ success: boolean, url?: string, key?: string, bucket?: string, error?: string }>}
 */
export const uploadToS3 = async (file, fileName, mimeType, customFolder = null) => {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";

  // ✅ Debug: Log input details
  console.log(`[S3] 📤 Upload initiated for: ${fileName}`);
  console.log(`[S3] Type of file:`, typeof file);
  console.log(`[S3] Is Buffer:`, Buffer.isBuffer(file));
  if (typeof file === "string") {
    console.log(`[S3] String length: ${file.length}, First 50 chars:`, file.substring(0, 50));
  }

  // ✅ Step 1: Validate and convert file
  const { buffer, isValid, error: conversionError } = await validateAndConvertFile(file, fileName);

  if (!isValid) {
    console.error(`[S3] ❌ File validation failed:`, conversionError);
    return {
      success: false,
      error: conversionError || "Invalid file format",
    };
  }

  // ✅ Step 2: Validate that bucket name is configured
  if (!bucket) {
    console.error("[S3] ❌ AWS_S3_BUCKET_NAME not configured in environment");
    return {
      success: false,
      error: "S3 bucket not configured",
    };
  }

  const folder = customFolder || getFolderName(mimeType);
  const key = `${folder}/${Date.now()}-${fileName}`;

  // Extra headers for PDFs: open inline in browser, not as a download attachment
  const extraHeaders = mimeType === "application/pdf"
    ? { ContentDisposition: "inline" }
    : {};

  try {
    console.log(`[S3] 📝 Uploading to S3: s3://${bucket}/${key}`);
    console.log(`[S3] Content-Type: ${mimeType}`);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: buffer,
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

    console.log(`[S3] ✅ Upload successful: ${url}`);

    return {
      success: true,
      url,
      key: result.Key || key,
      bucket: result.Bucket || bucket,
    };
  } catch (error) {
    console.error("[S3] ❌ Upload Error:", error?.message || error);
    console.error("[S3] Full error:", error);
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
