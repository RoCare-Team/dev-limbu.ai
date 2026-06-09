import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

const PINTEREST_API = "https://api-sandbox.pinterest.com/v5";
const SPECIAL_EMAIL = "rocare7@gmail.com";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAllowedEmail(email) {
  return normalizeEmail(email) === SPECIAL_EMAIL;
}

function fillCity(value, city) {
  return String(value || "").replaceAll("{city}", city || "");
}

async function createImagePin(accessToken, payload) {
  const response = await axios.post(`${PINTEREST_API}/pins`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const userId = String(body.userId || "").trim();
    const email = normalizeEmail(body.email);
    const selectedBoards = Array.isArray(body.boards) ? body.boards : [];
    const mediaUrl = String(body.media_url || body.mediaUrl || "").trim();
    const titleTemplate = String(body.title || "").trim();
    const descriptionTemplate = String(body.description || "").trim();
    const hashtags = Array.isArray(body.hashtags) ? body.hashtags : [];

    if (!userId || !isAllowedEmail(email)) {
      return NextResponse.json(
        { success: false, error: "This in-house Pinterest feature is not allowed for this user." },
        { status: 403 },
      );
    }

    if (!mediaUrl || !selectedBoards.length) {
      return NextResponse.json(
        { success: false, error: "media_url and selected boards are required." },
        { status: 400 },
      );
    }

    const results = [];

    for (const targetBoard of selectedBoards) {
      try {
        const boardId = String(targetBoard.boardId || "").trim();
        const boardName = String(targetBoard.boardName || targetBoard.name || "").trim();
        const profileId = String(targetBoard.profileId || targetBoard.pinterestProfileId || "").trim();
        const visitUri = String(targetBoard.visitUri || "").trim();

        // city = boardName directly (no mapping needed)
        const city = boardName;

        const profile = await PinterestProfile.findOne({
          userId,
          ...(profileId ? { pinterestUserId: profileId } : {}),
          "boards.boardId": boardId,
        });

        if (!profile?.accessToken) {
          throw new Error("Pinterest account or board not found.");
        }

        const title = fillCity(titleTemplate, city);
        const description = [
          fillCity(descriptionTemplate, city),
          hashtags.join(" "),
        ]
          .filter(Boolean)
          .join("\n\n");

        const pin = await createImagePin(profile.accessToken, {
          board_id: boardId,
          title,
          description,
          ...(visitUri ? { link: visitUri } : {}),
          media_source: {
            source_type: "image_url",
            url: mediaUrl,
          },
        });

        results.push({ success: true, boardId, boardName, city, pin });
      } catch (error) {
        results.push({
          success: false,
          boardId: targetBoard.boardId,
          boardName: targetBoard.boardName || targetBoard.name,
          city: "",
          error:
            error.response?.data?.message ||
            error.response?.data?.error?.message ||
            error.message ||
            "Failed to publish pin.",
        });
      }
    }

    const successCount = results.filter((item) => item.success).length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      successCount,
      failedCount: results.length - successCount,
    });
  } catch (error) {
    console.error("Inhouse Pinterest publish error:", error.response?.data || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish pins." },
      { status: 500 },
    );
  }
}