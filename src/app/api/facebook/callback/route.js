// api/facebook/callback/route.js
import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FacebookPage from "@/models/FacebookPage";

import {
  parseMetaOAuthState,
  facebookSuccessRedirect,
  facebookErrorRedirect,
} from "@/lib/metaOAuthState";

import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  // ✅ LOG 1: Callback hit hua
  console.log("🔔 [FB CALLBACK] ==================== CALLBACK HIT ====================");
  console.log("🔔 [FB CALLBACK] Full URL:", req.url);

  const baseUrl = resolveOAuthRedirectOrigin(req);
  const reqUrl = new URL(req.url);

  const rawState = reqUrl.searchParams.get("state");
  const code = reqUrl.searchParams.get("code");
  const errorParam = reqUrl.searchParams.get("error");
  const errorDesc = reqUrl.searchParams.get("error_description");

  console.log("🔔 [FB CALLBACK] baseUrl:", baseUrl);
  console.log("🔔 [FB CALLBACK] code exists:", !!code);
  console.log("🔔 [FB CALLBACK] rawState:", rawState);
  console.log("🔔 [FB CALLBACK] Facebook error (if any):", errorParam, errorDesc);

  // Facebook ne khud error bheja? (user ne deny kiya etc.)
  if (errorParam) {
    console.error("❌ [FB CALLBACK] Facebook returned error:", errorParam, errorDesc);
  }

  const parsed = parseMetaOAuthState(rawState);
  const userId = parsed.userId;

  // ✅ FIX: string "true" aur boolean true dono handle
  const isMobile = parsed.mobile === true || parsed.mobile === "true";

  console.log("📦 [FB CALLBACK] Parsed state:", JSON.stringify(parsed));
  console.log("📱 [FB CALLBACK] isMobile:", isMobile, "| type of parsed.mobile:", typeof parsed.mobile, "| value:", parsed.mobile);
  console.log("👤 [FB CALLBACK] userId:", userId);

  /* --------------------------------------------------
     VALIDATION
  -------------------------------------------------- */

  if (!code || !userId) {
    console.error("❌ [FB CALLBACK] Validation failed — code:", !!code, "| userId:", userId);
    if (isMobile) {
      return NextResponse.redirect(`limbuai://facebook-error?error=missing_params`);
    }
    return NextResponse.redirect(facebookErrorRedirect(parsed, "missing_params", baseUrl));
  }

  try {
    await dbConnect();
    console.log("✅ [FB CALLBACK] DB connected");

    /* --------------------------------------------------
       1️⃣ SHORT-LIVED TOKEN
    -------------------------------------------------- */

    console.log("🔄 [FB CALLBACK] Fetching short-lived token...");
    const shortTokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${baseUrl}/api/facebook/callback`,
          code,
        },
      }
    );

    const shortToken = shortTokenRes.data.access_token;
    console.log("✅ [FB CALLBACK] Short-lived token obtained");

    /* --------------------------------------------------
       2️⃣ LONG-LIVED TOKEN
    -------------------------------------------------- */

    let userAccessToken = shortToken;
    let tokenExpiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

    try {
      console.log("🔄 [FB CALLBACK] Exchanging for long-lived token...");
      const longTokenRes = await axios.get(
        "https://graph.facebook.com/v24.0/oauth/access_token",
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            fb_exchange_token: shortToken,
          },
        }
      );

      userAccessToken = longTokenRes.data.access_token;
      const expiresIn = longTokenRes.data.expires_in;
      if (expiresIn) {
        tokenExpiryDate = new Date(Date.now() + expiresIn * 1000);
      }
      console.log("✅ [FB CALLBACK] Long-lived token obtained, expires:", tokenExpiryDate);
    } catch (longErr) {
      console.warn(
        "⚠️ [FB CALLBACK] Long-lived token exchange failed, using short-lived:",
        longErr.response?.data || longErr.message
      );
    }

    /* --------------------------------------------------
       3️⃣ FETCH PAGES
    -------------------------------------------------- */

    console.log("🔄 [FB CALLBACK] Fetching pages from /me/accounts...");
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      { params: { access_token: userAccessToken } }
    );

    const pages = pagesRes.data.data;
    console.log(`📄 [FB CALLBACK] Pages fetched: ${pages?.length ?? 0}`, pages?.map((p) => ({ id: p.id, name: p.name })));

    /* --------------------------------------------------
       NO PAGES
    -------------------------------------------------- */

    if (!pages || pages.length === 0) {
      console.warn("⚠️ [FB CALLBACK] No Facebook Pages found for this account. userId:", userId);
      if (isMobile) {
        return NextResponse.redirect(`limbuai://facebook-error?error=no_pages`);
      }
      return NextResponse.redirect(facebookErrorRedirect(parsed, "no_pages", baseUrl));
    }

    /* --------------------------------------------------
       4️⃣ SAVE PAGES
    -------------------------------------------------- */

    const chatbotFields =
      parsed.phone && parsed.source === "chatbot"
        ? { phone: parsed.phone, type: "facebook", connectionSource: "chatbot" }
        : {};

    console.log(`💾 [FB CALLBACK] About to save ${pages.length} page(s) — userId: ${userId} | isMobile: ${isMobile}`);

    for (const page of pages) {
      // ✅ Pehle check — exist karta hai?
      const existingPage = await FacebookPage.findOne({ userId, pageId: page.id });
      console.log(`🔍 [FB CALLBACK] Check existing — pageId: ${page.id} | name: "${page.name}" | exists: ${!!existingPage} | existingId: ${existingPage?._id}`);

      const docToSave = {
        userId,
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        pageTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        userAccessToken,
        userTokenExpiresAt: tokenExpiryDate,
        platform: "facebook",
        ...chatbotFields,
      };

      console.log(`📝 [FB CALLBACK] Saving doc for pageId: ${page.id}`, {
        userId: docToSave.userId,
        pageId: docToSave.pageId,
        pageName: docToSave.pageName,
        platform: docToSave.platform,
      });

      const savedPage = await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id },
        { $set: docToSave },
        { upsert: true, new: true }
      );

      console.log(`✅ [FB CALLBACK] Page saved to DB — _id: ${savedPage._id} | pageId: ${savedPage.pageId} | pageName: ${savedPage.pageName} | userId: ${savedPage.userId}`);
    }

    /* --------------------------------------------------
       CHATBOT TAGGING
    -------------------------------------------------- */

    if (parsed.phone && parsed.source === "chatbot") {
      try {
        await FacebookPage.updateMany(
          { userId, pageId: { $in: pages.map((p) => p.id) } },
          { $set: { phone: parsed.phone, type: "facebook", connectionSource: "chatbot" } }
        );
        console.log("✅ [FB CALLBACK] Chatbot tagging done");
      } catch (tagErr) {
        console.error("⚠️ [FB CALLBACK] Chatbot tagging error:", tagErr?.message || tagErr);
      }
    }

    /* --------------------------------------------------
       SUCCESS REDIRECT
    -------------------------------------------------- */

    console.log(`🎉 [FB CALLBACK] All done! isMobile: ${isMobile} | userId: ${userId} | pages saved: ${pages.length}`);

    if (isMobile) {
      const mobileUrl = `limbuai://facebook-success?status=connected&userId=${encodeURIComponent(userId)}`;
      console.log("📱 [FB CALLBACK] Mobile redirect to:", mobileUrl);
      return NextResponse.redirect(mobileUrl);
    }

    return NextResponse.redirect(facebookSuccessRedirect(parsed, baseUrl));

  } catch (err) {
    console.error("💥 [FB CALLBACK] UNHANDLED ERROR:", err.response?.data || err.message);
    console.error("💥 [FB CALLBACK] Stack:", err.stack);

    if (isMobile) {
      return NextResponse.redirect(`limbuai://facebook-error?error=oauth_failed`);
    }

    return NextResponse.redirect(facebookErrorRedirect(parsed, "oauth_failed", baseUrl));
  }
}