import dbConnect from "@/lib/dbConnect";
import Assets from "@/models/assets";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

// Helper function to validate image size (base64)
function validateImageSize(base64String) {
  if (!base64String) return true; // Allow empty/null images
  
  // Calculate approximate file size from base64 string
  const fileSize = Math.ceil((base64String.length * 3) / 4);
  return fileSize <= MAX_IMAGE_SIZE;
}

/* --------------------------------
   POST → Create Asset (Base64)
--------------------------------- */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      userId,
      colourPalette,
      size,
      characterImage,
      uniformImage,
      productImage,
      backgroundImage,
      logoImage,
    } = body;

    if (!userId) {
      return Response.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate image sizes (max 2 MB each)
    const imageFields = [
      "characterImage",
      "uniformImage",
      "productImage",
      "backgroundImage",
      "logoImage",
    ];

    for (const field of imageFields) {
      if (body[field] && !validateImageSize(body[field])) {
        return Response.json(
          {
            success: false,
            error: `${field} exceeds 2 MB size limit`,
          },
          { status: 400 }
        );
      }
    }

    const saved = await Assets.create({
      userId,
      colourPalette,
      size,
      characterImage,     // base64
      uniformImage,       // base64
      productImage,       // base64
      backgroundImage,    // base64
      logoImage,          // base64
    });

    return Response.json(
      { success: true, message: "Asset created", data: saved },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* --------------------------------
   GET → Fetch Assets
--------------------------------- */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const query = userId ? { userId } : {};
    const results = await Assets.find(query).sort({ createdAt: -1 });

    return Response.json(
      { success: true, data: results },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* --------------------------------
   PUT → Update Asset (Base64)
--------------------------------- */
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      id,
      colourPalette,
      size,
      characterImage,
      uniformImage,
      productImage,
      backgroundImage,
      logoImage,
      fieldName,
      value,
    } = body;

    if (!id) {
      return Response.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    // Validate image sizes (max 2 MB each)
    const imageFields = [
      "characterImage",
      "uniformImage",
      "productImage",
      "backgroundImage",
      "logoImage",
    ];

    for (const field of imageFields) {
      if (body[field] && !validateImageSize(body[field])) {
        return Response.json(
          {
            success: false,
            error: `${field} exceeds 2 MB size limit`,
          },
          { status: 400 }
        );
      }
    }
  
    const existing = await Assets.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "colourPalette",
      "size",
      "characterImage",
      "uniformImage",
      "productImage",
      "backgroundImage",
      "logoImage",
    ];

    const updatePayload = {};

    // Support dynamic frontend payload: { id, fieldName, value }
    if (typeof fieldName === "string") {
      if (!allowedFields.includes(fieldName)) {
        return Response.json(
          { success: false, error: "Invalid fieldName" },
          { status: 400 }
        );
      }
      updatePayload[fieldName] = value ?? "";
    }

    // Support normal payload updates: { id, logoImage, size, ... }
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return Response.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await Assets.findByIdAndUpdate(
      id,
      {
        ...updatePayload,
        updatedAt: new Date(),
      },
      { new: true }
    );

    return Response.json(
      { success: true, message: "Asset updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT Error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* --------------------------------
   DELETE → Clear One Field
--------------------------------- */
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const field = searchParams.get("field");

    if (!id || !field) {
      return Response.json(
        { success: false, error: "id & field are required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "characterImage",
      "uniformImage",
      "productImage",
      "backgroundImage",
      "logoImage",
      "size",
      "colourPalette",
    ];

    if (!allowedFields.includes(field)) {
      return Response.json(
        { success: false, error: "Invalid field" },
        { status: 400 }
      );
    }

    const updated = await Assets.findByIdAndUpdate(
      id,
      { $set: { [field]: "" } },
      { new: true }
    );

    if (!updated) {
      return Response.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: `${field} removed successfully`,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
