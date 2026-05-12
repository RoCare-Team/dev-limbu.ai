
// HTTP request bhejne ki library. || kya kaam Facebook Graph API ko call karne ke liye.|| agr hata de Facebook se token ya pages fetch nahi kar paoge.
import axios from "axios";

// ye Redirect ya JSON response bhejne ke liye.
import { NextResponse } from "next/server";

// ye MongoDB connect karta hai.
import dbConnect from "@/lib/dbConnect";

// Mongoose model — jisme page info save hogi.
import FacebookPage from "@/models/FacebookPage";

import {
  parseMetaOAuthState,
  facebookSuccessRedirect,
  facebookErrorRedirect,
} from "@/lib/metaOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

// Facebook OAuth ke baad callback GET request aati hai. || Facebook redirect karta hai:
// `state` is either plain userId (dashboard) or `m.…` (phone/chatbot); DB key is always parsed.userId.
export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const reqUrl = new URL(req.url);
  const parsed = parseMetaOAuthState(reqUrl.searchParams.get("state"));
  const code = reqUrl.searchParams.get("code");
  const userId = parsed.userId;

  if (!code || !userId) {
    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "missing_params", baseUrl)
    );
  }

  try {
    await dbConnect(); // ye DB connect kar raha hai.

    /* ---------------------------------------------
       1️⃣ SHORT-LIVED USER TOKEN
    --------------------------------------------- */
    const shortTokenRes = await axios.get( // Authorization code ko short-lived access token me convert kar raha hai.
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID, // ye client_id Facebook app ID
          client_secret: process.env.META_APP_SECRET, // ye client_secret Facebook app secret
          redirect_uri: `${baseUrl}/api/facebook/callback`, // ye redirect_uri Same hona chahiye jo login time pe diya
          code,
        },
      }
    );

    const shortToken = shortTokenRes.data.access_token;

    /* ---------------------------------------------
       2️⃣ LONG-LIVED USER TOKEN (60 days) — fall back to short if exchange fails
    --------------------------------------------- */
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

    /* ---------------------------------------------
       3️⃣ FETCH FACEBOOK PAGES
    --------------------------------------------- */
    const pagesRes = await axios.get( // ye User ke saare Facebook Pages fetch kar raha hai.
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userAccessToken }, // ye Token ke bina page data nahi milega.
      }
    );

    const pages = pagesRes.data.data; // ye Pages list extract kar raha hai.

    if (!pages || pages.length === 0) { // ye Agar user ke paas koi page nahi hai → error redirect.
      return NextResponse.redirect(
        facebookErrorRedirect(parsed, "no_pages", baseUrl)
      );
    }

    /* ---------------------------------------------
       4️⃣ SAVE LONG TOKEN + PAGE TOKENS
    --------------------------------------------- */
    for (const page of pages) { // ye Har page ke liye loop.
      await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id }, // Agar page already exist karta hai → update karo || Nahi karta → create karo
        {
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token, // ye Page manage karne ke liye
          pageTokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
          userAccessToken,                   // ye User long-lived token
          userTokenExpiresAt: tokenExpiryDate, // ye Expiry date
          platform: "facebook", // ye Identify karne ke liye
        },
        { upsert: true, new: true } // ye upsert: true Agar record nahi mila → create karo || new: true Updated document return karo
      );
    }

    // Keep chatbot tagging as best-effort so manual-equivalent OAuth never fails.
    if (parsed.phone && parsed.source === "chatbot") {
      try {
        await FacebookPage.updateMany(
          { userId, pageId: { $in: pages.map((p) => p.id) } },
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

    return NextResponse.redirect(facebookSuccessRedirect(parsed, baseUrl));

  } catch (err) {
    console.error(
      "FB CALLBACK ERROR:",
      err.response?.data || err.response || err.message
    );

    return NextResponse.redirect(
      facebookErrorRedirect(parsed, "oauth_failed", baseUrl)
    );
  }
}
