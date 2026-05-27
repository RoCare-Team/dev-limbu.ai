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
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const reqUrl = new URL(req.url);

  const parsed = parseMetaOAuthState(reqUrl.searchParams.get("state"));
  const code = reqUrl.searchParams.get("code");
  const userId = parsed.userId;
  const isMobile = parsed.mobile === true; // ✅ ab sahi kaam karega

  /* --------------------------------------------------
     VALIDATION
  -------------------------------------------------- */

  if (!code || !userId) {
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-error?error=missing_params`
      );
    }
    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "missing_params", baseUrl)
    );
  }

  try {
    await dbConnect();

    /* --------------------------------------------------
       1️⃣ SHORT-LIVED TOKEN
    -------------------------------------------------- */

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

    /* --------------------------------------------------
       2️⃣ LONG-LIVED TOKEN
    -------------------------------------------------- */

    let userAccessToken = shortToken;
    let tokenExpiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

    try {
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
    } catch (longErr) {
      console.warn(
        "FB long-lived token exchange failed, using short-lived token:",
        longErr.response?.data || longErr.message
      );
    }

    /* --------------------------------------------------
       3️⃣ FETCH PAGES
    -------------------------------------------------- */

    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userAccessToken },
      }
    );

    const pages = pagesRes.data.data;

    /* --------------------------------------------------
       NO PAGES
    -------------------------------------------------- */

    if (!pages || pages.length === 0) {
      if (isMobile) {
        return NextResponse.redirect(
          `limbuai://facebook-error?error=no_pages`
        );
      }
      return NextResponse.redirect(
        facebookErrorRedirect(parsed, "no_pages", baseUrl)
      );
    }

    /* --------------------------------------------------
       4️⃣ SAVE PAGES
    -------------------------------------------------- */

    for (const page of pages) {
      await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id },
        {
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          pageTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          userAccessToken,
          userTokenExpiresAt: tokenExpiryDate,
          platform: "facebook",
        },
        { upsert: true, new: true }
      );
    }

    /* --------------------------------------------------
       CHATBOT TAGGING
    -------------------------------------------------- */

    if (parsed.phone && parsed.source === "chatbot") {
      try {
        await FacebookPage.updateMany(
          {
            userId,
            pageId: { $in: pages.map((p) => p.id) },
          },
          {
            $set: {
              phone: parsed.phone,
              type: "facebook",
              connectionSource: "chatbot",
            },
          }
        );
      } catch (tagErr) {
        console.error("FB chatbot tagging warning:", tagErr?.message || tagErr);
      }
    }

    /* --------------------------------------------------
       SUCCESS REDIRECT
    -------------------------------------------------- */

    // ✅ userId bhi bhej rahe hain mobile ko
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-success?status=connected&userId=${encodeURIComponent(userId)}`
      );
    }

    return NextResponse.redirect(facebookSuccessRedirect(parsed, baseUrl));

  } catch (err) {
    console.error(
      "FB CALLBACK ERROR:",
      err.response?.data || err.response || err.message
    );

    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-error?error=oauth_failed`
      );
    }

    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "oauth_failed", baseUrl)
    );
  }
}