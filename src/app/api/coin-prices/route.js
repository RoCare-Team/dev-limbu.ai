// app/api/coin-prices/route.js

import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import CoinPrice from "@/models/CoinPrice";

import { seedCoinPrices } from "@/lib/defaultCoinPrices";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    // platform=iso
    const platform = searchParams.get("platform");

    const data = await CoinPrice.find({
      is_active: true,
    }).sort({ price: 1 });

    // IOS pricing
    if (platform === "iso") {
      const iosData = data.map((item) => ({
        _id: item._id,
        price: item.iso_price,
        original_price: item.price,
        coins: item.coins,
        gst_percentage: item.gst_percentage,
        gst_price: item.gst_price,
        iso_price: item.iso_price,
        bonus_coins: item.bonus_coins,
        popular: item.popular,
        is_active: item.is_active,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return NextResponse.json({
        success: true,
        platform: "ios",
        data: iosData,
      });
    }

    // Android default pricing
    return NextResponse.json({
      success: true,
      platform: "android",
      data,
    });
  } catch (error) {
    console.log("Coin Price GET Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
