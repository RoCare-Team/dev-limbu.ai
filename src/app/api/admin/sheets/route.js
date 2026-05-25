

import { NextResponse } from "next/server";

import { getSheetData } from "@/lib/googleSheets";

import businessSheets from "@/data/businessSheets";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const sheet = searchParams.get("sheet");

    const firstBusiness = businessSheets[0];

    const data = await getSheetData(
      firstBusiness.sheetId,
      sheet
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}