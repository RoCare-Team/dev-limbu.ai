// Next.js ka response helper. || Client ko JSON response bhejne ke liye. || Agar ye hata do → NextResponse.json() error dega.
import { NextResponse } from "next/server";

// MongoDB se connect karne wala function.|| Database se data lene ke liye connection zaroori hai. || Agar hata do → DB query fail ho jayegi.
import dbConnect from "@/lib/dbConnect";

// Mongoose model (YouTube channels collection ka structure). || Database me saved YouTube channels ko read karne ke liye.
import YouTubeChannel from "@/models/YouTubeChannel";

// Ye API GET request handle karegi. || Jab frontend call kare:
export async function GET(req) {
  try { // Error handle karne ke liye wrapper.|| Agar andar koi error aaye → catch block chalega.
    await dbConnect(); // Database connection ensure kar raha hai. || agr hata de YouTubeChannel.find() error dega.

    const { searchParams } = new URL(req.url); //  Request URL ko tod raha hai.
    const userId = searchParams.get("userId"); //  URL se userId nikaal raha hai.

    if (!userId) { // 👉 Check kar raha hai userId mila ya nahi. ||   Agar nahi mila || Error return karega.
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      ); // Matlab client ne galat request bheji. || YouTubeChannel.find({ userId }) undefined ke saath chalega.
    }

    // Iska matlab: Database me jao || Un records ko lao jinka userId match karta hai || Aur unhe newest pehle order me laao
    const channels = await YouTubeChannel.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, channels }); //  Client ko channels bhej raha hai.
  } catch (error) { // Agar koi error aaye (DB down, query fail, etc.)
    console.error("GET channels error:", error); // Server me error log karega.
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}