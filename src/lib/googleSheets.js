

import { google } from "googleapis";

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || "";

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return {
    sheets: google.sheets({
      version: "v4",
      auth,
    }),
  };
}

export async function getSheetData(spreadsheetId, sheetName) {
  const { sheets } = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return response.data.values || [];
}

export async function getAllSheetNames(spreadsheetId) {
  const { sheets } = getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return response.data.sheets.map(
    (sheet) => sheet.properties.title
  );
}


export async function appendToSheet(spreadsheetId, sheetName, rows) {
  const { sheets } = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: rows,
    },
  });
}