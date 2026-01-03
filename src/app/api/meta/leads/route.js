import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const formId = searchParams.get("formId"); // 👈 DYNAMIC
    const before = searchParams.get("before");
    const after = searchParams.get("after");
    const limit = searchParams.get("limit") || 1140;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "formId is required" },
        { status: 400 }
      );
    }

    const accessToken = "EAAWOiqBorGUBQQD5h0FAtsmhyrdTCG0JiO6YqenXR1IInaUh6Wa7WqfvGc6D6bcqSHUcyRLcUa22JZAs4oKcAxJHqSfwXAqsMVSptToi8oIRmzZAXMAIWDQWuaR3rReSifeGDGLaiorT28OMiF2t54CbEqBdwpBSjJfcCVBZBIJ9qyq7Ht8d3sZCXVw0";

    let url = `https://graph.facebook.com/v24.0/${formId}/leads?limit=${limit}&access_token=${accessToken}`;

    if (before) url += `&before=${before}`;
    if (after) url += `&after=${after}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error?.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: data.data,
      paging: data.paging,
      formId, // 👈 useful for UI
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
