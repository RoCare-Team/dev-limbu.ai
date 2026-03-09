import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "./mongodb";
import axios from "axios";

async function refreshAccessToken(token) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await axios.post(url, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return {
      ...token,
      accessToken: response.data.access_token,
      accessTokenExpires: Date.now() + response.data.expires_in * 1000,
      refreshToken: response.data.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error.response?.data ?? error.message);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // IMPORTANT: Yahan scope sahi hona chahiye listings fetch karne ke liye
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, user }) {
      // First sign-in
      if (account && user) {
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + (account.expires_in || 3600) * 1000,
          user,
        };
      }

      // Return previous token if not expired
      if (Date.now() < token.accessTokenExpires) return token;

      // Access token expired -> refresh it
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      session.user = token.user;
      return session;
    },

    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db("gmb_dashboard");

          // User aur unka token MongoDB mein update/save karna
          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
                email: user.email,
                image: user.image,
                lastLogin: new Date(),
              },
              $addToSet: {
                // Taaki multiple business accounts link ho sakein
                accounts: {
                  provider: "google",
                  googleId: profile.sub,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  updatedAt: new Date(),
                },
              },
            },
            { upsert: true }
          );
          return true;
        } catch (error) {
          console.error("MongoDB Save Error:", error);
          // Return true hi rakhein taaki login na ruke, 
          // par error log zaroor check karein
          return true; 
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // Yahan error handle hota hai
  },
};

export default NextAuth(authOptions);