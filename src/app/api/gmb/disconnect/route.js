// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";

// export async function POST(req) {
//   try {
//     await dbConnect();
//     const url = new URL(req.url);
//     const userId = url.searchParams.get("userId");
//     const googleId = url.searchParams.get("googleId");

//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: "userId is required" },
//         { status: 400 },
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       deletedCount: result?.deletedCount ?? (result ? 1 : 0),
//     });
//   } catch (error) {
//     console.error("Disconnect GMB Error:", error);
//     return NextResponse.json(
//       { success: false, error: error.message || "Server error" },
//       { status: 500 },
//     );
//   }
// }
