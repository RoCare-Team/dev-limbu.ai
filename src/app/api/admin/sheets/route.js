

import { getSheetData } from "@/lib/googleSheets";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const sheet =
    searchParams.get("sheet") || "Sheet1";

  const data = await getSheetData(sheet);

  return NextResponse.json({ data });
}