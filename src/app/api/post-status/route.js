import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";
import mongoose from "mongoose";

// Helper to return JSON response
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * GET -> Fetch posts by userId (e.g., MB-02) and optional status
 * Query: ?userId=MB-02&status=pending&id=123
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId"); // ✅ now passed in query

    if (!userId) return json({ success: false, error: "userId required" }, 400);

    // ✅ Single post fetch
    if (id) {
      const post = await Post.findOne({ _id: id, userId }).lean();
      if (!post) return json({ success: false, error: "Post not found" }, 404);
      return json({ success: true, data: post });
    }

    // ✅ Multiple posts fetch
    const query = { userId };
    if (status) query.status = status;

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
    return json({ success: true, data: posts });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // Check if it's a request for bulk post counts
    if (Array.isArray(body.userIds)) {
      const { userIds } = body;
      if (userIds.length === 0) {
        return json({ success: true, data: {} });
      }

      const counts = await Post.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: "$userId",
            total: { $sum: 1 },
            posted: { $sum: { $cond: [{ $eq: ["$status", "posted"] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          },
        },
      ]);

      const countsMap = counts.reduce((acc, item) => {
        acc[item._id] = item;
        delete item._id;
        return acc;
      }, {});

      return json({ success: true, data: countsMap });
    }

    // Original logic to create a new post
    const { userId, status, aiOutput, description, promat,gmbDescription,fbDescription,igDescription } = body;
    if (!userId || !aiOutput || !description) {
      return json(
        { success: false, error: "userId, aiOutput, and description are required" },
        400
      );
    }
    const newPost = await Post.create({
      userId,
      aiOutput,
      description,
      gmbDescription,
      fbDescription,
      igDescription,
      promat,
      status: status || "pending",
    });
    return json({ success: true, data: newPost }, 201);
  } catch (err) {
    console.error("Error saving post:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * PUT -> Update post (status, scheduledDate)
 * Body: { id, userId: "MB-02", status, scheduledDate? }
 */
export async function PUT(req) {
  try {
    await dbConnect();

    const {
      id,
      status,
      scheduledDate,
      userId,
      description,
      reason,
      locations,
      checkmark,
      refreshToken,
    } = await req.json();
 
    console.log("📦 PUT /api/post-status Payload:", { id, status, locationsCount: locations?.length, checkmark, hasRefreshToken: !!refreshToken });

    if (!id || !status || !userId) {
      return json(
        { success: false, error: "id, status & userId required" },
        400
      );
    }

    const updateData = { status };

    /* -------------------- SCHEDULED -------------------- */
    if (status === "scheduled") {
      if (!scheduledDate) {
        return json(
          { success: false, error: "scheduledDate required when scheduling" },
          400
        );
      }

      const parsedDate = new Date(scheduledDate);
      if (isNaN(parsedDate.getTime())) {
        return json(
          { success: false, error: "Invalid scheduledDate" },
          400
        );
      }

      updateData.scheduledDate = parsedDate;

      // ✅ Save refreshToken if provided (critical for auto-posting)
      if (refreshToken) {
        updateData.refreshToken = refreshToken;
        console.log(`🔄 RefreshToken saved for scheduled post ${id}`);
      }

      // ✅ Save locations only if provided
      if (Array.isArray(locations) && locations.length > 0) {
        console.log(`📍 Saving ${locations.length} locations for scheduled post ${id}`);
        // Explicitly map to schema fields to avoid strict mode issues with extra fields
        updateData.locations = locations.map(loc => ({
          locationId: loc.locationId,
          accountId: loc.accountId,
          name: loc.name,
          address: loc.address,
          city: loc.city || "",
          locality: loc.locality || "",
          websiteUrl: loc.websiteUrl || "",
          isPosted: false, // Reset posted status for new schedule
          error: ""
        }));
      } else {
        console.warn(`⚠ No locations provided for scheduled post ${id}`);
      }
    }

    /* -------------------- REJECTED -------------------- */
    if (status === "rejected") {
      if (!reason || reason.trim() === "") {
        return json(
          { success: false, error: "Reject reason is required" },
          400
        );
      }
      updateData.rejectReason = reason;
    }

    /* -------------------- OPTIONAL FIELDS -------------------- */
    if (typeof description === "string") {
      updateData.description = description;
    }

    if (checkmark !== undefined && checkmark !== null) {
      updateData.checkmark = checkmark;
    }

    console.log("🛠 Updating Post with:", JSON.stringify(updateData, null, 2));

    /* -------------------- UPDATE -------------------- */
    const updated = await Post.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return json(
        { success: false, error: "Post not found" },
        404
      );
    }

    return json({ success: true, data: updated });

  } catch (err) {
    console.error("Update Post Error:", err);
    return json(
      { success: false, error: err.message },
      500
    );
  }
}

/**
 * DELETE -> Delete post by ID
 * Query: ?id=POST_ID&userId=MB-02
 */
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return json({ success: false, error: "id & userId required" }, 400);
    }

    // ✅ Set status to rejected instead of deleting
    const updatedPost = await Post.findOneAndUpdate(
      { _id: id, userId },
      { status: "rejected" },
      { new: true }
    );

    if (!updatedPost) {
      return json({ success: false, error: "Post not found" }, 404);
    }

    return json({ 
      success: true, 
      message: "Post rejected successfully",
      post: updatedPost 
    });

  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}
