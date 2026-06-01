import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

function getPinterestErrorMessage(error) {
  const status = error.response?.status;
  const message =
    error.response?.data?.message ||
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    "";

  if (status === 401) {
    return "Pinterest session expired. Please reconnect your account.";
  }

  if (status === 403 || /scope|permission|unauthorized/i.test(message)) {
    return "Pinterest board creation permission is missing. Please reconnect Pinterest and allow board create access.";
  }

  return message || "Failed to create Pinterest board.";
}

export async function POST(req) {
  try {
    await dbConnect();

    const { userId, profileId, name, description } = await req.json();
    const boardName = typeof name === "string" ? name.trim() : "";

    if (!userId || !profileId || !boardName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, profileId, and board name are required.",
        },
        { status: 400 },
      );
    }

    const profile = await PinterestProfile.findOne({
      userId,
      pinterestUserId: profileId,
    });

    if (!profile || !profile.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Pinterest account not connected. Please reconnect Pinterest.",
        },
        { status: 404 },
      );
    }

    const payload = {
      name: boardName,
      description: description || "",
    };

    const response = await axios.post(
      "https://api.pinterest.com/v5/boards",
      payload,
      {
        headers: {
          Authorization: `Bearer ${profile.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const createdBoard = response.data || {};
    const board = {
      boardId: createdBoard.id,
      boardName: createdBoard.name || boardName,
      boardUrl: createdBoard.url,
      description: createdBoard.description || description || "",
      pins: [],
    };

    profile.boards = [...(profile.boards || []), board];
    await profile.save();

    return NextResponse.json({
      success: true,
      message: "Pinterest board created successfully",
      board,
    });
  } catch (error) {
    console.error("Pinterest Create Board Error:", error.response?.data || error.message);
    const message = getPinterestErrorMessage(error);
    const status = error.response?.status === 401 ? 401 : error.response?.status === 403 ? 403 : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}
