import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "./mongodb";
import axios from "axios";

// Helper: refresh Google access token
async function refreshAccessToken(token) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
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
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent", // ensure refresh_token returned
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // JWT callback
    async jwt({ token, account }) {
      // first sign in
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000, // in ms
        };
      }

      // return previous token if not expired
      if (Date.now() < token.accessTokenExpires) return token;

      // access token expired -> refresh
      return await refreshAccessToken(token);
    },

    // session callback
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      session.expires = new Date(token.accessTokenExpires).toISOString();
      return session;
    },

    // signIn callback -> MongoDB user/projects
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db("gmb_dashboard");

          // Upsert user info & append project
          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
                email: user.email,
                image: user.image,
                updatedAt: new Date(),
              },
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

          return true;
        } catch (error) {
          console.error("Error saving user/project:", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(authOptions);
