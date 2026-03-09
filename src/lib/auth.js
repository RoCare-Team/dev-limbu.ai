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
  debug: true, // Temporarily enable for production debugging
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
          const client = await clientPromise;
          const db = client.db("gmb_dashboard");
          const usersCollection = db.collection("users");

          if (!user.email || !profile.sub) return false;

          // Attempt to update the tokens for an existing project
          const result = await usersCollection.updateOne(
            { email: user.email, "projects.googleId": profile.sub },
            {
              $set: {
                "projects.$.accessToken": account.access_token,
                // Only update the refresh token if a new one is provided
                ...(account.refresh_token && { "projects.$.refreshToken": account.refresh_token }),
              },
            }
          );

          // If no document was matched, the project doesn't exist for this user.
          // So, we add it using $push, and create the user if they don't exist.
          if (result.matchedCount === 0) {
            await usersCollection.updateOne(
              { email: user.email },
              {
                $set: { name: user.name, image: user.image, updatedAt: new Date() },
                $push: {
                  projects: {
                    googleId: profile.sub,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    createdAt: new Date(),
                  },
                },
              },
              { upsert: true } // Creates the user document if it doesn't exist
            );
          }
          return true;
        } catch (error) {
          console.error("Database Error during Sign-In:", error);
          // On database error, prevent sign-in to ensure data integrity.
          return false;
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
          // Persist the refresh token from the first login
          refreshToken: account.refresh_token ?? token.refreshToken,
          accessTokenExpires: Date.now() + (account.expires_in || 3600) * 1000,
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // The access token has expired, try to refresh it.
      if (!token.refreshToken) {
        console.error("Error refreshing access token: No refresh token found.");
        return { ...token, error: "RefreshAccessTokenError" };
      }

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.accessToken = token.accessToken;
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