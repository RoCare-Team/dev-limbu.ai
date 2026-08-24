import { NextResponse } from "next/server";

/* ----------------------------------------------------
   LANGUAGES API — text-to-video language options served
   dynamically instead of being hardcoded in the frontend.
   Grouped for the UI's language picker.
---------------------------------------------------- */
const LANGUAGE_GROUPS = [
  {
    title: "Most Used",
    languages: ["Hindi", "English", "Hinglish"],
  },
  {
    title: "Major Regional",
    languages: [
      "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Bengali",
      "Punjabi", "Malayalam", "Urdu", "Odia", "Assamese", "Konkani",
      "Nepali", "Sindhi", "Kashmiri", "Dogri", "Manipuri",
    ],
  },
  {
    title: "Regional Dialects",
    languages: [
      "Haryanvi", "Bhojpuri", "Rajasthani", "Marwari", "Awadhi",
      "Chhattisgarhi", "Maithili", "Magahi", "Bundeli", "Bagheli",
      "Garhwali", "Kumaoni", "Tulu", "Santali",
    ],
  },
  {
    title: "International",
    languages: ["Spanish", "French", "Arabic"],
  },
];

const DEFAULT_LANGUAGE = "Hinglish";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      groups: LANGUAGE_GROUPS,
      default: DEFAULT_LANGUAGE,
    },
  });
}
