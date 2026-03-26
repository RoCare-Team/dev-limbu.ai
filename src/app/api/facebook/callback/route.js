
// HTTP request bhejne ki library. || kya kaam Facebook Graph API ko call karne ke liye.|| agr hata de Facebook se token ya pages fetch nahi kar paoge.
import axios from "axios";

// ye Redirect ya JSON response bhejne ke liye.
import { NextResponse } from "next/server";

// ye MongoDB connect karta hai.
import dbConnect from "@/lib/dbConnect";

// Mongoose model — jisme page info save hogi.
import FacebookPage from "@/models/FacebookPage";

// Facebook OAuth ke baad callback GET request aati hai. || Facebook redirect karta hai:
export async function GET(req) {
  try {
    await dbConnect(); // ye DB connect kar raha hai.

    const url = new URL(req.url); // ye Request URL ko parse kar raha hai.
    const code = url.searchParams.get("code"); // ye Facebook se authorization code
    const userId = url.searchParams.get("state"); // ye Custom value jo humne bheja tha (userId) || agr code mising ho Token exchange nahi ho paayega.

    if (!code || !userId) { // ye Agar parameters missing hain → error redirect.
      return NextResponse.redirect(
        `${process.env.BASE_URL}/dashboard?fb=missing_params`
      ); // User ko dashboard pe bhej raha hai error ke saath.
    }

    /* ---------------------------------------------
       1️⃣ SHORT-LIVED USER TOKEN
    --------------------------------------------- */
    const shortTokenRes = await axios.get( // Authorization code ko short-lived access token me convert kar raha hai.
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID, // ye client_id Facebook app ID
          client_secret: process.env.META_APP_SECRET, // ye client_secret Facebook app secret
          redirect_uri: `${process.env.BASE_URL}/api/facebook/callback`, // ye redirect_uri Same hona chahiye jo login time pe diya
          code,
        },
      }
    );

    const shortToken = shortTokenRes.data.access_token;

    /* ---------------------------------------------
       2️⃣ LONG-LIVED USER TOKEN (60 days)
    --------------------------------------------- */
    const longTokenRes = await axios.get( // ye Short-lived token mil gaya (1-2 hours valid).
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token", // ye Facebook ka special method jo short token ko long token me convert karta hai.
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortToken, // ye Short token ko exchange kar raha hai.
        },
      }
    );

    // ye Seconds me validity (usually ~5184000 seconds = 60 days)
    const userAccessToken = longTokenRes.data.access_token;
    const expiresIn = longTokenRes.data.expires_in; // seconds

    const tokenExpiryDate = new Date(
      Date.now() + expiresIn * 1000
    ); // ye Expiry date calculate kar raha hai. || Agar multiply by 1000 na kare: || Milliseconds galat ho jayenge.

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
        `${process.env.BASE_URL}/dashboard?fb=no_pages`
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

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?fb=connected`
    ); // ye User ko success ke saath dashboard bhej diya.

  } catch (err) {
    console.error("FB CALLBACK ERROR:", err.response?.data || err.message); // Error log karega.

    return NextResponse.redirect(
      `https://www.facebook.com/v24.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.BASE_URL}/api/facebook/callback&scope=pages_show_list,pages_manage_posts,pages_read_engagement&state=RECONNECT`
    ); // ye Agar error aaye → dobara Facebook login page pe bhej dega (reconnect flow).
  }
}
