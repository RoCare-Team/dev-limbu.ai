
// HTTP request bhejne ki library. \\ Facebook Graph API ko call karne ke liye.|| Agar ye hata dein → Facebook se baat nahi kar paoge.
import axios from "axios";

// Client ko JSON response bhejne ke liye.
import { NextResponse } from "next/server";

// MongoDB connect karta hai. || Agar hata diya → DB operations fail.
import dbConnect from "@/lib/dbConnect";

// Mongoose model jisme page data save hoga.
import FacebookPage from "@/models/FacebookPage";

// Ye API POST request handle karegi. || Mobile app yaha request bhejegi.
export async function POST(req) {
  try {
    await dbConnect(); // Database connection ensure karta hai.

    const { short_token, userId } = await req.json(); // Client se data read kar raha hai.

    if (!short_token || !userId) { // Check kar raha hai dono values aaye ya nahi.
      return NextResponse.json(
        { success: false, error: "short_token and userId required" },
        { status: 400 }
      );
    }

    // 🔁 Convert short token to long token
    // Facebook API ko call kar raha hai. || Short-lived token ko long-lived token me convert karna.
    const longRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token", // Facebook ko bata raha: || "Main token exchange karna chahta hoon."
          client_id: process.env.META_APP_ID, // App ID aur secret verify karne ke liye.
          client_secret: process.env.META_APP_SECRET, // Agar secret galat → error aayega.
          fb_exchange_token: short_token, // Short token bhej raha hai convert karne ke liye.
        },
      }
    );

    const longToken = longRes.data.access_token; // Long token mil gaya (60 days valid).
    console.log("Long Token:", longToken); // Production me token log nahi karna chahiye (security risk).

    // 👤 Get user profile
    const profileRes = await axios.get(
      "https://graph.facebook.com/me",
      { // User ka profile data fetch kar raha hai.
        params: {
          access_token: longToken,
          fields: "name,id",
        }, // User ka profile data fetch kar raha hai. || Agar fields remove kar do || Default fields milenge (kam data).
      }
    );

    // 📄 Get user pages
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/accounts",
      { params: { access_token: longToken } }
    ); // User ke saare Facebook pages fetch kar raha hai.

    const pages = pagesRes.data.data; // Pages array extract kar raha hai.
    console.log("User Pages:", pages); // Debugging ke liye.

    // 💾 Save pages to DB (User-wise)
    for (const page of pages) { // Har page ke liye loop chala raha hai.
      await FacebookPage.findOneAndUpdate(
        { userId, pageId: page.id }, // Check karo || Kya ye page already user ke liye exist karta hai?
        {
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          platform: "facebook",
        }, // Ye fields DB me save ho rahi hain.
        { upsert: true, new: true } // upsert: true Agar record nahi mila → create karo.|| new: true Updated document return karo. || Agar upsert hata dein: New page save nahi hoga.
      );
    }

    return NextResponse.json({ // Client ko kya bhej raha?
      success: true, // success status
      accountId: profileRes.data.id, // Facebook account id
      accountName: profileRes.data.name, // account name
      pages, // pages list
      long_access_token: longToken, // long token
      expires_in: longRes.data.expires_in, // expiry time
    }); // Production me long_access_token client ko nahi bhejna chahiye.

  } catch (error) {// Agar kuch error aata hai to handle karega.
    console.error("Mobile connect error:", error.response?.data || error.message); //Error log karega.

    return NextResponse.json(
      { success: false, error: "Token conversion failed" },
      { status: 500 }
    ); // 500 = Server error.
  }
}
