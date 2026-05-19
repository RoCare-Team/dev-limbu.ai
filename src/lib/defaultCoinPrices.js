// lib/defaultCoinPrices.js

import CoinPrice from "../models/CoinPrice";

export const seedCoinPrices = async () => {
  const count = await CoinPrice.countDocuments();

  if (count > 0) return;

  await CoinPrice.insertMany([
    {
      price: 200,
      coins: 200,
      gst_percentage: 18,
    },
    {
      price: 500,
      coins: 500,
      gst_percentage: 18,
    },
    {
      price: 1000,
      coins: 1000,
      gst_percentage: 18,
    },
    {
      price: 5000,
      coins: 6000,
      bonus_coins: 1000,
      popular: true,
      gst_percentage: 18,
    },
    {
      price: 10000,
      coins: 12000,
      bonus_coins: 2000,
      gst_percentage: 18,
    },
    {
      price: 20000,
      coins: 24000,
      bonus_coins: 4000,
      gst_percentage: 18,
    },
    {
      price: 50000,
      coins: 60000,
      bonus_coins: 10000,
      gst_percentage: 18,
    },
  ]);

  console.log("Default Coin Prices Seeded");
};