// HTTP request bhejne ki library.
import axios from "axios";

// Redirect ya JSON response bhejne ke liye.
import { NextResponse } from "next/server";

// MongoDB connect karta hai.
import dbConnect from "@/lib/dbConnect";

// Mongoose model
import FacebookPage from "@/models/FacebookPage";

import {
  parseMetaOAuthState,
  facebookSuccessRedirect,
  facebookErrorRedirect,
} from "@/lib/metaOAuthState";

import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

// Facebook OAuth callback
export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);

  const reqUrl = new URL(req.url);

  // Parse OAuth state
  const parsed = parseMetaOAuthState(
    reqUrl.searchParams.get("state")
  );

  // Facebook authorization code
  const code = reqUrl.searchParams.get("code");

  // Parsed userId
  const userId = parsed.userId;

  // Mobile app request?
  const isMobile = parsed.mobile === true;

  /* --------------------------------------------------
     VALIDATION
  -------------------------------------------------- */

  if (!code || !userId) {

    // Mobile deep link error
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-error?error=missing_params`
      );
    }

    // Web dashboard error
    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "missing_params", baseUrl)
    );
  }

  try {
    /* --------------------------------------------------
       DB CONNECT
    -------------------------------------------------- */

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

    let tokenExpiryDate = new Date(
      Date.now() + 2 * 60 * 60 * 1000
    );

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
        tokenExpiryDate = new Date(
          Date.now() + expiresIn * 1000
        );
      }
    } catch (longErr) {
      console.warn(
        "FB long-lived token exchange failed, using short-lived token:",
        longErr.response?.data || longErr.message
      );
    }

    /* --------------------------------------------------
       3️⃣ FETCH FACEBOOK PAGES
    -------------------------------------------------- */

    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: {
          access_token: userAccessToken,
        },
      }
    );

    const pages = pagesRes.data.data;

    /* --------------------------------------------------
       NO PAGES
    -------------------------------------------------- */

    if (!pages || pages.length === 0) {

      // Mobile app error deep link
      if (isMobile) {
        return NextResponse.redirect(
          `limbuai://facebook-error?error=no_pages`
        );
      }

      // Web dashboard error
      return NextResponse.redirect(
        facebookErrorRedirect(parsed, "no_pages", baseUrl)
      );
    }

    /* --------------------------------------------------
       4️⃣ SAVE PAGES
    -------------------------------------------------- */

    for (const page of pages) {

      await FacebookPage.findOneAndUpdate(
        {
          userId,
          pageId: page.id,
        },
        {
          userId,

          pageId: page.id,

          pageName: page.name,

          // Page access token
          pageAccessToken: page.access_token,

          // Page token expiry
          pageTokenExpiresAt: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000
          ),

          // User long-lived token
          userAccessToken,

          // User token expiry
          userTokenExpiresAt: tokenExpiryDate,

          platform: "facebook",
        },
        {
          upsert: true,
          new: true,
        }
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
            pageId: {
              $in: pages.map((p) => p.id),
            },
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
        console.error(
          "FB chatbot tagging warning:",
          tagErr?.message || tagErr
        );
      }
    }

    /* --------------------------------------------------
       SUCCESS REDIRECT
    -------------------------------------------------- */

    // Mobile app success
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-success?status=connected`
      );
    }

    // Web dashboard success
    return NextResponse.redirect(
      facebookSuccessRedirect(parsed, baseUrl)
    );

  } catch (err) {

    console.error(
      "FB CALLBACK ERROR:",
      err.response?.data ||
      err.response ||
      err.message
    );

    /* --------------------------------------------------
       MOBILE ERROR
    -------------------------------------------------- */

    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://facebook-error?error=oauth_failed`
      );
    }

    /* --------------------------------------------------
       WEB ERROR
    -------------------------------------------------- */

    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "oauth_failed", baseUrl)
    );
  }
}