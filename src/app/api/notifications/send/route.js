// App push notification bhejne ki API
// Token 3 tarikon se resolve hota hai: direct token, userId, ya phone
// userId/phone case me User document se fcmToken uthaya jata hai (login pe save hota hai)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { messaging } from "@/lib/firebaseAdmin";
import User from "@/models/User";

export const dynamic = "force-dynamic"; // build-time prerender skip karega

// FCM data payload me sirf string values ja sakti hain, isliye allowed keys ko String() karke bhejo
function buildDataPayload(body) {
  const allowedKeys = [
    "type",
    "screen",
    "action",
    "title",
    "message",
    "body",
    "image",
    "sound",
  ];

  const data = {};

  for (const key of allowedKeys) {
    if (body[key] !== undefined && body[key] !== null) {
      data[key] = String(body[key]);
    }
  }

  // Flutter apps ko foreground/background notification tap handle karne ke liye chahiye
  data.click_action = "FLUTTER_NOTIFICATION_CLICK";

  return data;
}

// Notification sound: custom > lead-type default > system default
function getSoundConfig(type, sound) {
  if (sound) {
    return {
      androidSound: sound,
      iosSound: `${sound}.caf`,
    };
  }

  if (type === "lead") {
    return {
      androidSound: "notification_sound",
      iosSound: "notification_sound.caf",
    };
  }

  return {
    androidSound: "default",
    iosSound: "default",
  };
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      userId = "",
      phone = "",
      token = "",
      title = "",
      message = "",
      type = "",
      screen = "",
      action = "",
      image = "",
      sound = "",
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "title and message are required",
        },
        { status: 400 },
      );
    }

    // Token resolve karo: direct > userId > phone
    let tokens = [];

    if (token) {
      tokens = [token];
    } else if (userId) {
      // userId field User model me `userId` (e.g. USR123) hai, _id nahi
      const user = await User.findOne({ userId }).select("fcmToken").lean();
      if (user?.fcmToken) tokens = [user.fcmToken];
    } else if (phone) {
      const user = await User.findOne({ phone }).select("fcmToken").lean();
      if (user?.fcmToken) tokens = [user.fcmToken];
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Either token or userId or phone is required",
        },
        { status: 400 },
      );
    }

    // Duplicate/empty tokens hata do
    tokens = [...new Set(tokens.filter(Boolean))];

    if (!tokens.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No active FCM token found for this user",
        },
        { status: 404 },
      );
    }

    const dataPayload = buildDataPayload(body);
    const soundConfig = getSoundConfig(type, sound);

    const multicastMessage = {
      tokens,
      notification: {
        title,
        body: message,
        ...(image ? { imageUrl: image } : {}),
      },
      data: {
        ...dataPayload,
        type: type || "",
        screen: screen || "",
        action: action || "",
        image: image || "",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "limbu_push_channel",
          sound: soundConfig.androidSound,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          ...(image ? { imageUrl: image } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: soundConfig.iosSound,
          },
        },
      },
    };

    // messaging ab lazy-init function hai (firebaseAdmin.js me), isliye () lagakar call karo
    const response = await messaging().sendEachForMulticast(multicastMessage);

    const failedTokens = [];

    response.responses.forEach((r, index) => {
      if (!r.success) {
        failedTokens.push({
          token: tokens[index],
          error: r.error ? r.error.message : "Unknown error",
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Notification send attempt completed",
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
      responses: response.responses.map((r, index) => ({
        token: tokens[index],
        success: r.success,
        messageId: r.messageId || null,
        error: r.error ? r.error.message : null,
      })),
    });
  } catch (error) {
    console.error("Send notification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send notification",
      },
      { status: 500 },
    );
  }
}