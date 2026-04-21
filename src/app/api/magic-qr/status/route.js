import mongoose from "mongoose";

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
      status: { type: String, enum: ["generated", "failed", "pending"], default: "generated" },
      whatsappSent: { type: Boolean, default: false },
    },
    { timestamps: true }
  );
  return conn.models.MagicQR || conn.model("MagicQR", schema);
}

export async function GET() {
  try {
    const MagicQR = await getMagicQrModel();
    
    // Fetch all generated QR records
    const generatedQRs = await MagicQR.find(
      { status: "generated" },
      { locationId: 1, s3ImageUrl: 1, _id: 0 }
    ).lean();

    // Convert array to a map for O(1) lookup on the frontend
    const qrMap = generatedQRs.reduce((acc, curr) => {
      acc[curr.locationId] = curr.s3ImageUrl;
      return acc;
    }, {});

    return Response.json({ success: true, data: qrMap, totalGenerated: generatedQRs.length });
  } catch (error) {
    console.error("Magic QR Status API Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
