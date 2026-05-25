


import { NextResponse } from "next/server";

import { getAllSheetNames } from "@/lib/googleSheets";

import businessSheets from "@/data/businessSheets";

export async function GET() {
  try {
    const firstBusiness = businessSheets[0];

    const sheets = await getAllSheetNames(
      firstBusiness.sheetId
    );

    return NextResponse.json({
      success: true,
      sheets,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}