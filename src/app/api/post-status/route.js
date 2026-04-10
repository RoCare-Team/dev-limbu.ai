import dbConnect from "@/lib/dbConnect";
import Post from "@/models/PostStatus";

// Helper to return JSON response
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * GET -> Fetch posts by userId (e.g., MB-02) and optional status
 * Query: ?userId=MB-02&status=pending&id=123&page=1&limit=10
 */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Pagination parameters
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 0; // 0 means all for backward compatibility
    const skip = (page - 1) * limit;

    // Date filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build the query object dynamically
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (status) {
      query.status = status;
    }

    // Date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    // Single post
    if (id) {
      const findOneQuery = { _id: id };
      if (userId) {
        findOneQuery.userId = userId;
      }
      const post = await Post.findOne(findOneQuery)
        .select("-accessToken -refreshToken") // Exclude sensitive fields
        .lean();

      if (!post) return json({ success: false, error: "Post not found" }, 404);
      return json({ success: true, data: post });
    }

    // Total count for frontend pagination UI
    const totalCount = await Post.countDocuments(query);

    // Multiple posts (paginated)
    let queryBuilder = Post.find(query).sort({ createdAt: -1 });

    if (limit > 0) {
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const posts = await queryBuilder
      .select("-accessToken -refreshToken") // Exclude sensitive fields
      .lean();

    return json({
      success: true,
      data: posts,
      count: posts.length,
      pagination: {
        totalItems: totalCount,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        limit: limit
      }
    });
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * POST -> Create post OR bulk counts
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // Bulk counts
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

    // Create new post
    const {
      userId,
      status,
      aiOutput,
      description,
      promat,
      gmbDescription,
      fbDescription,
      igDescription,
      whenPosted,   // 👈 OPTIONAL
      mediaType,
      videoOutput,
      videoPrompt,
    } = body;

    if (!userId || !aiOutput || !description) {
      return json(
        { success: false, error: "userId, aiOutput, and description are required" },
        400
      );
    }

    const mt =
      mediaType === "video" || mediaType === "image" ? mediaType : "image";

    const newPost = await Post.create({
      userId,
      aiOutput,
      mediaType: mt,
      description,
      gmbDescription,
      fbDescription,
      igDescription,
      promat,
      whenPosted: whenPosted || {}, // 👈 Default to empty object instead of null
      status: status || "pending",
      ...(typeof videoOutput === "string" && videoOutput.trim()
        ? { videoOutput: videoOutput.trim() }
        : {}),
      ...(typeof videoPrompt === "string" && videoPrompt.trim()
        ? { videoPrompt: videoPrompt.trim() }
        : {}),
    });

    return json({ success: true, data: newPost }, 201);

  } catch (err) {
    console.error("Error saving post:", err);
    return json({ success: false, error: err.message }, 500);
  }
}

/**
 * PUT -> Update post (status, scheduledDate, whenPosted)
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
      gmbDescription,
      fbDescription,
      igDescription,
      reason,
      locations,
      checkmark,
      refreshToken,
      whenPosted,
      scheduledDateSource,
      fbPages,
      igPages,
      videoOutput,
      videoPrompt,
      facebookPostId,
      facebookPageAccessToken,
      error: postError,
    } = await req.json();

    console.log("📦 PUT Payload:", {
      id,
      status,
      locationsCount: locations?.length,
      checkmark,
      hasRefreshToken: !!refreshToken,
      whenPosted,
      scheduledDateSource
    });

    if (!id || !status || !userId) {
      return json(
        { success: false, error: "id, status & userId required" },
        400
      );
    }

    const updateData = { status };

    /* ---------- SCHEDULED ---------- */
    if (status === "scheduled") {
      if (!scheduledDate) {
        return json(
          { success: false, error: "scheduledDate required" },
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

      if (scheduledDateSource) {
        updateData.scheduledDateSource = scheduledDateSource;
      }

      if (refreshToken) {
        updateData.refreshToken = refreshToken;
      }

      if (Array.isArray(locations) && locations.length > 0) {
        updateData.locations = locations.map(loc => ({
          locationId: loc.locationId,
          accountId: loc.accountId,
          name: loc.name,
          address: loc.address,
          city: loc.city || "",
          locality: loc.locality || "",
          websiteUrl: loc.websiteUrl || "",
          isPosted: false,
          error: ""
        }));
      }

      if (Array.isArray(fbPages)) {
        updateData.fbPages = fbPages;
      }
      if (Array.isArray(igPages)) {
        updateData.igPages = igPages;
      }
    }

    /* ---------- REJECTED ---------- */
    if (status === "rejected") {
      if (!reason || reason.trim() === "") {
        return json(
          { success: false, error: "Reject reason is required" },
          400
        );
      }
      updateData.rejectReason = reason;
    }

    /* ---------- OPTIONAL FIELDS ---------- */
    if (typeof description === "string") {
      updateData.description = description;
    }
    if (typeof gmbDescription === "string") {
      updateData.gmbDescription = gmbDescription;
    }
    if (typeof fbDescription === "string") {
      updateData.fbDescription = fbDescription;
    }
    if (typeof igDescription === "string") {
      updateData.igDescription = igDescription;
    }

    if (checkmark !== undefined && checkmark !== null) {
      updateData.checkmark = checkmark;
    }

    if (typeof videoOutput === "string" && videoOutput.trim()) {
      updateData.videoOutput = videoOutput.trim();
    }
    if (typeof videoPrompt === "string") {
      updateData.videoPrompt = videoPrompt.trim();
    }
    if (typeof facebookPostId === "string" && facebookPostId.trim()) {
      updateData.facebookPostId = facebookPostId.trim();
    }
    if (typeof facebookPageAccessToken === "string" && facebookPageAccessToken.trim()) {
      updateData.facebookPageAccessToken = facebookPageAccessToken.trim();
    }
    if (typeof postError === "string") {
      updateData.error = postError;
    }

    if (whenPosted !== undefined && whenPosted !== null) {
      // Handle partial updates for whenPosted object (e.g. { facebook: "..." })
      if (typeof whenPosted === 'object' && !Array.isArray(whenPosted)) {
        // First, ensure whenPosted is initialized as an object if it's null
        // Get the current post to check if whenPosted is null
        const currentPost = await Post.findOne({ _id: id, userId });

        if (currentPost && (currentPost.whenPosted === null || currentPost.whenPosted === undefined)) {
          // Initialize whenPosted as an empty object first
          updateData.whenPosted = {};
        }

        // Now set the nested properties
        for (const key in whenPosted) {
          updateData[`whenPosted.${key}`] = whenPosted[key];
        }
      } else {
        updateData.whenPosted = whenPosted;
      }
    }

    console.log("🛠 Updating Post:", updateData);

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
 * DELETE -> Soft reject post
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
