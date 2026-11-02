import { NextResponse } from "next/server";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.limbu.ai.limbu";
const APP_STORE_URL = "https://apps.apple.com/in/app/limbu-ai/id6757781138";

/**
 * One shareable app link (limbu.ai/appUrl): Apple devices go to the App
 * Store, everything else to the Play Store. iPadOS reports itself as
 * "Macintosh", so Mac is matched as Apple too.
 */
export function GET(request) {
  const ua = request.headers.get("user-agent") || "";
  const isApple = /iPhone|iPad|iPod|Macintosh/i.test(ua) && !/Android/i.test(ua);

  const response = NextResponse.redirect(
    isApple ? APP_STORE_URL : PLAY_STORE_URL,
    302,
  );
  // Same URL, different target per device — never cache the redirect.
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "User-Agent");
  return response;
}
