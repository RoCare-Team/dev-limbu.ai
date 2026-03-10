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
    console.error("Refresh Error:", error.response?.data || error.message);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // debug: true, // Troubleshooting ke liye isko enable kar sakte hain
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent", // Pehli baar mein refresh_token lene ke liye zaroori hai
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          // 1. Database connection check
          const client = await clientPromise;
          const db = client.db("gmb_dashboard");

          // 2. Data save logic with basic validation
          if (!user.email) return false;

          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
                image: user.image,
                updatedAt: new Date(),
              },
              // $addToSet tabhi kaam karega jab 'projects' ek array field ho
              $addToSet: {
                projects: {
                  googleId: profile.sub,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  createdAt: new Date(),
                },
              },
            },
            { upsert: true }
          );
          return true; // Success
        } catch (error) {
          console.error("Database Error during Sign-In:", error);
          // Agar database error aaye toh bhi sign in allow karein (optional) 
          // ya false return karein agar DB zaroori hai
          return true; 
        }
      }
      return true;
    },

    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + (account.expires_in || 3600) * 1000,
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Error hone par wapis signin page par bhejega
  },
};

export default NextAuth(authOptions);