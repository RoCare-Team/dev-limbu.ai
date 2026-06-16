// File: /app/api/admin/gmb-scraper/scrape/route.js

import { NextResponse } from "next/server";
import { getSheetData, appendToSheet } from "@/lib/googleSheets";
import businessSheets from "@/data/businessSheets";
import { google } from "googleapis"; // Google APIs ko import kiya gaya hai tab creation ke liye

const WEBHOOK_URL = "https://n8n.limbutech.in/webhook/data-gmb-scrapper";

// Google Auth Helper Function (Tab create karne ke liye zaroori hai)
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

export async function POST(req) {
  try {
    const { city, category, limit, sheet, googleApiKey } = await req.json();

    if (!city || !category || !sheet) {
      return NextResponse.json(
        { success: false, error: "city, category and sheet are required" },
        { status: 400 }
      );
    }

    const sheetId = businessSheets[0]?.sheetId;
    if (!sheetId) {
      return NextResponse.json(
        { success: false, error: "Sheet ID not configured in businessSheets.js" },
        { status: 500 }
      );
    }

    // --- PHASE 1: ACTUAL SHEET TAB CREATION (Check if tab exists, if not create it) ---
    const sheetsClient = await getSheetsClient();
    const spreadsheet = await sheetsClient.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetExists = spreadsheet.data.sheets.some(
      (s) => s.properties.title === sheet
    );

    if (!sheetExists) {
      console.log(`Sheet "${sheet}" not found. Creating new tab...`);
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: { title: sheet },
              },
            },
          ],
        },
      });
    }

    // --- PHASE 2: SCRAPE DATA FROM WEBHOOK ---
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        category,
        limit: limit || 100,
        GogleApiKey: googleApiKey,
      }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      return NextResponse.json(
        { success: false, error: `Webhook error ${webhookRes.status}: ${text}` },
        { status: 500 }
      );
    }

    const scrapedData = await webhookRes.json();

    if (!Array.isArray(scrapedData) || scrapedData.length === 0) {
      return NextResponse.json({
        success: true,
        saved: 0,
        duplicates: 0,
        message: "No data returned from scraper",
      });
    }

    // --- PHASE 3: FETCH EXISTING DATA FOR DUPLICATE CHECK ---
    let existingRows = [];
    try {
      const existingResult = await getSheetData(sheetId, sheet);
      existingRows = existingResult?.data || [];
    } catch (err) {
      // Agar sheet bilkul nayi bani hai toh data fetch error de sakta hai, isliye fallback empty array
      existingRows = [];
    }

    const existingKeys = new Set();
    const headerRow = existingRows[0] || [];

    // Find column indices dynamically
    const phoneIdx = headerRow.findIndex((h) => String(h).toLowerCase().includes("phone"));
    const nameIdx = headerRow.findIndex((h) => 
      String(h).toLowerCase().includes("name") || String(h).toLowerCase().includes("business")
    );

    existingRows.slice(1).forEach((row) => {
      const phone = String(row[phoneIdx] || "").replace(/\D/g, "").replace(/^91/, "").trim();
      const name = String(row[nameIdx] || "").trim().toLowerCase();
      if (phone) existingKeys.add(`phone:${phone}`);
      if (name && phone) existingKeys.add(`np:${name}-${phone}`);
    });

    // --- PHASE 4: FILTER DUPLICATES AND BUILD ROWS ---
    const newRows = [];
    let duplicates = 0;

    // Agar sheet empty hai (nayi bani hai), toh pehle Header Row add karein
    const needsHeader = existingRows.length === 0;
    if (needsHeader) {
      newRows.push([
        "Business Name", "Address", "Phone", "Website", "Rating", 
        "Reviews", "Maps URL", "Place ID", "City", "Category", "Scraped At"
      ]);
    }

    scrapedData.forEach((item) => {
      const rawPhone = String(item.phone || "").replace(/\D/g, "").replace(/^91/, "").trim();
      const name = String(item.name || "").trim().toLowerCase();

      // Duplicate detection
      if (rawPhone && existingKeys.has(`phone:${rawPhone}`)) {
        duplicates++;
        return;
      }
      if (rawPhone && name && existingKeys.has(`np:${name}-${rawPhone}`)) {
        duplicates++;
        return;
      }

      // Batch ke andar duplicate na aayein isliye mark as seen
      if (rawPhone) existingKeys.add(`phone:${rawPhone}`);

      newRows.push([
        item.name || "",
        item.address || "",
        rawPhone ? `+91 ${rawPhone}` : "",
        item.website || "",
        item.rating || "",
        item.reviews || "",
        item.maps_url || "",
        item.place_id || "",
        city,
        category,
        new Date().toISOString(),
      ]);
    });

    // --- PHASE 5: APPEND DATA TO SHEET ---
    if (newRows.length > 0) {
      await appendToSheet(sheetId, sheet, newRows);
    }

    const saved = newRows.length - (needsHeader ? 1 : 0);

    return NextResponse.json({
      success: true,
      saved: Math.max(saved, 0),
      duplicates,
      total: scrapedData.length,
      newSheetCreated: !sheetExists
    });

  } catch (error) {
    console.error("[GMB Scraper] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}