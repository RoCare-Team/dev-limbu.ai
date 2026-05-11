import axios from "axios";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import InstagramPage from "@/models/InstagramPage";
import {
  parseMetaOAuthState,
  instagramSuccessRedirect,
  instagramErrorRedirect,
} from "@/lib/metaOAuthState";
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

// `state` is either plain userId (dashboard) or `m.…` (phone/chatbot); DB key is always parsed.userId.
export async function GET(req) {
  const baseUrl = resolveOAuthRedirectOrigin(req);
  const reqUrl = new URL(req.url);
  const parsed = parseMetaOAuthState(reqUrl.searchParams.get("state"));
  const code = reqUrl.searchParams.get("code");
  const userId = parsed.userId;

  if (!code || !userId) {
    return NextResponse.redirect(
      instagramErrorRedirect(parsed, "missing_params", baseUrl)
    );
  }

  try {
    await dbConnect();

    // 1️⃣ Exchange Code → Short-Lived Token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${baseUrl}/api/instagram/callback`,
          code,
        },
      }
    );

    const shortToken = tokenRes.data.access_token;

    // 2️⃣ Short → Long-Lived Token (continue with short if exchange fails)
    let userToken = shortToken;
    let tokenExpiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    try {
      const longRes = await axios.get(
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
      userToken = longRes.data.access_token;
      const expiresIn = longRes.data.expires_in;
      if (expiresIn) {
        tokenExpiryDate = new Date(Date.now() + expiresIn * 1000);
      }
    } catch (longErr) {
      console.warn(
        "IG long-lived token exchange failed, using short-lived token:",
        longErr.response?.data || longErr.message
      );
    }

    // 3️⃣ Get Facebook Pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      {
        params: { access_token: userToken },
      }
    );

    if (!pagesRes.data.data.length) {
      return NextResponse.redirect(
        instagramErrorRedirect(parsed, "no_pages", baseUrl)
      );
    }

    // 4️⃣ Get ALL Instagram Accounts
    let igAccounts = [];

    for (const page of pagesRes.data.data) {
      try {
        const igRes = await axios.get(
          `https://graph.facebook.com/v24.0/${page.id}`,
          {
            params: {
              fields: "instagram_business_account{id,username,name}",
              access_token: page.access_token,
            },
          }
        );

        if (igRes.data.instagram_business_account) {
          igAccounts.push({
            userId,
            igId: igRes.data.instagram_business_account.id,
            igUsername: igRes.data.instagram_business_account.username,
            pageId: page.id,
            pageAccessToken: page.access_token,
            userAccessToken: userToken,
            ...(tokenExpiryDate ? { userTokenExpiresAt: tokenExpiryDate } : {}),
            platform: "instagram",
          });
        }
      } catch (err) {
        console.error(`Page ${page.id} IG fetch failed`);
      }
    }

    if (!igAccounts.length) {
      return NextResponse.redirect(
        instagramErrorRedirect(parsed, "no_instagram", baseUrl)
      );
    }

    // 5️⃣ Save All Accounts
    if (parsed.source === "chatbot" && parsed.phone) {
      await InstagramPage.deleteMany({
        userId,
        phone: parsed.phone,
        connectionSource: "chatbot",
      });
    } else {
      await InstagramPage.deleteMany({
        userId,
        $or: [
          { connectionSource: { $exists: false } },
          { connectionSource: "manual" },
          { connectionSource: "" },
        ],
      });
    }
    await InstagramPage.insertMany(igAccounts);

    // Keep chatbot tagging as best-effort so manual-equivalent OAuth never fails.
    if (parsed.phone && parsed.source === "chatbot") {
      try {
        await InstagramPage.updateMany(
          { userId, igId: { $in: igAccounts.map((a) => a.igId) } },
          {
            $set: {
              phone: parsed.phone,
              type: "instagram",
              connectionSource: "chatbot",
            },
          }
        );
      } catch (tagErr) {
        console.error("IG chatbot tagging warning:", tagErr?.message || tagErr);
      }
    }

    return NextResponse.redirect(
      instagramSuccessRedirect(parsed, igAccounts.length, baseUrl)
    );
  } catch (err) {
    console.error("IG CALLBACK ERROR:", err.response?.data || err.message);

    return NextResponse.redirect(
      instagramErrorRedirect(parsed, "oauth_failed", baseUrl)
    );
  }
}
