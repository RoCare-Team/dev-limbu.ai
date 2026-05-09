import { uploadToS3 } from "@/utils/s3Config";
import mongoose from "mongoose";
import { MAGIC_QR_CLIENT_UPLOAD_VERSION } from "@/lib/magicQrServerVersion";

// Use the same connection logic as the other admin APIs
let magicQrConn = null;
async function getMagicQrConnection() {
  if (magicQrConn && magicQrConn.readyState === 1) return magicQrConn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  magicQrConn = mongoose.createConnection(uri);
  await magicQrConn.asPromise();
  return magicQrConn;
}

// Define/Get Model on this specific connection
async function getMagicQrModel() {
  const conn = await getMagicQrConnection();
  const schema = new mongoose.Schema(
    {
      userEmail: { type: String, required: true, index: true },
      businessTitle: { type: String, required: true },
      locality: { type: String, default: "" },
      locationId: { type: String, required: true, unique: true },
      s3ImageUrl: { type: String, required: true },
      reviewUrl: { type: String, default: "" },
      cardGeneratorVersion: { type: Number, default: 0 },
      status: { type: String, enum: ["generated", "failed", "pending"], default: "generated" },
      whatsappSent: { type: Boolean, default: false },
    },
    { timestamps: true }
  );
  return conn.models.MagicQR || conn.model("MagicQR", schema);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userEmail, businessTitle, locality, locationId, base64Image, reviewUrl = "" } = body;

    if (!userEmail || !businessTitle || !locationId || !base64Image) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const MagicQR = await getMagicQrModel();

    // 1. Process the base64 string
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return Response.json({ success: false, error: "Invalid base64 string" }, { status: 400 });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // 2. Generate custom folder name based on business title
    const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const folderSlug = slugify(businessTitle);
    const customFolder = `magic-qrs/${folderSlug}`;
    const locSlug = slugify(locality || 'hq');
    const fileName = `${locSlug}-qr.png`;

    // 3. Upload to S3
    const s3Result = await uploadToS3(buffer, fileName, mimeType, customFolder);

    if (!s3Result.success) {
      return Response.json({ success: false, error: s3Result.error }, { status: 500 });
    }

    // 4. Save to Database
    const qrRecord = await MagicQR.findOneAndUpdate(
      { locationId }, 
      {
        userEmail,
        businessTitle,
        locality,
        locationId, // Explicitly include in case of upsert
        s3ImageUrl: s3Result.url,
        status: "generated",
        reviewUrl,
        cardGeneratorVersion: MAGIC_QR_CLIENT_UPLOAD_VERSION,
      },
      { upsert: true, new: true }
    );

    return Response.json({ 
      success: true, 
      url: s3Result.url,
      record: qrRecord 
    });

  } catch (error) {
    console.error("Magic QR Upload API Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
