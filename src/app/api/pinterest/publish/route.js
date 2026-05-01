import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PinterestProfile from "@/models/PinterestProfile";

export async function POST(req) {
  try {
    await dbConnect();
    
    // Parse the incoming request body
    const body = await req.json();
    const { userId, title, description, board_id, media_url, link } = body;

    if (!userId || !board_id || !media_url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, board_id, and media_url are required." },
        { status: 400 }
      );
    }

    // Find the Pinterest profile for this user that contains the target board
    const profile = await PinterestProfile.findOne({
      userId,
      "boards.boardId": board_id
    });

    if (!profile || !profile.accessToken) {
      return NextResponse.json(
        { success: false, error: "Pinterest account not connected or board not found." },
        { status: 404 }
      );
    }

    // Construct the payload for Pinterest v5 API
    const pinterestPayload = {
      board_id: board_id,
      media_source: {
        source_type: "image_url",
        url: media_url
      },
      title: title || "",
      description: description || "",
    };

    // Add optional link if provided
    if (link) {
      pinterestPayload.link = link;
    }

    // Make the request to Pinterest to create the Pin
    const response = await axios.post(
      "https://api.pinterest.com/v5/pins",
      pinterestPayload,
      {
        headers: {
          "Authorization": `Bearer ${profile.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Pin published successfully",
      pin: response.data
    });

  } catch (error) {
    console.error("Pinterest Publish Error:", error.response?.data || error.message);
    
    // Check if it's an auth error (token expired)
    if (error.response?.status === 401) {
       return NextResponse.json(
         { success: false, error: "Pinterest session expired. Please reconnect your account." },
         { status: 401 }
       );
    }

    return NextResponse.json(
      { success: false, error: error.response?.data?.message || "Failed to publish pin." },
      { status: 500 }
    );
  }
}
