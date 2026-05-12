import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import YouTubeChannel from "@/models/YouTubeChannel";

const getChannelId = (channel = {}) =>
  channel.channelId || channel.id || channel.channel?.id || channel.snippet?.channelId;

const getChannelTitle = (channel = {}) =>
  channel.channelTitle ||
  channel.title ||
  channel.name ||
  channel.channel?.title ||
  channel.snippet?.title ||
  channel.snippet?.channelTitle ||
  "YouTube Channel";

const getTokenExpiresAt = (channel = {}, fallback = {}) => {
  const rawDate =
    channel.tokenExpiresAt ||
    channel.expiresAt ||
    channel.expiryDate ||
    channel.expires_at ||
    fallback.tokenExpiresAt ||
    fallback.expiresAt ||
    fallback.expiryDate ||
    fallback.expires_at;

  if (rawDate) {
    const dateValue =
      rawDate && typeof rawDate === "object" && "$date" in rawDate
        ? rawDate.$date
        : rawDate;
    const date = new Date(dateValue);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const expiresIn = Number(
    channel.expiresIn ||
      channel.expires_in ||
      fallback.expiresIn ||
      fallback.expires_in,
  );

  if (Number.isFinite(expiresIn) && expiresIn > 0) {
    return new Date(Date.now() + expiresIn * 1000);
  }

  return undefined;
};

const buildUpdate = (channel = {}, fallback = {}) => {
  const update = {
    channelTitle: getChannelTitle(channel),
    platform: "youtube",
  };

  const accessToken =
    channel.accessToken ||
    channel.access_token ||
    fallback.accessToken ||
    fallback.access_token;
  const refreshToken =
    channel.refreshToken ||
    channel.refresh_token ||
    fallback.refreshToken ||
    fallback.refresh_token;
  const tokenExpiresAt = getTokenExpiresAt(channel, fallback);

  if (accessToken) update.accessToken = accessToken;
  if (refreshToken) update.refreshToken = refreshToken;
  if (tokenExpiresAt) update.tokenExpiresAt = tokenExpiresAt;

  return update;
};

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const userId = body.userId;
    const channels = Array.isArray(body.channels)
      ? body.channels
      : [body.channel || body];

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }

    const savedChannels = [];
    const invalidChannels = [];

    for (const channel of channels) {
      const channelId = getChannelId(channel);

      if (!channelId) {
        invalidChannels.push(channel);
        continue;
      }

      const savedChannel = await YouTubeChannel.findOneAndUpdate(
        { userId, channelId },
        {
          $set: buildUpdate(channel, body),
          $setOnInsert: {
            userId,
            channelId,
            connectionSource: "manual",
            phone: "",
          },
        },
        { upsert: true, new: true },
      );

      savedChannels.push(savedChannel);
    }

    if (savedChannels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "channelId is required",
          invalidChannels,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "YouTube channel saved successfully",
      channel: savedChannels[0],
      channels: savedChannels,
      invalidChannels,
    });
  } catch (error) {
    console.error("YouTube save-channel error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
