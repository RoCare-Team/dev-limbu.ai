import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      ...token,
      accessToken: response.data.access_token,
      accessTokenExpires: Date.now() + response.data.expires_in * 1000,
      refreshToken: response.data.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Refresh Error:", error.response?.data || error.message);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db("gmb_dashboard");

          if (!user?.email) return false;

          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
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
          console.error("Database Error during Sign-In:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, account, user }) {
      if (account && user) {
        token.id = user.id;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires =
          Date.now() + (account.expires_in || 3600) * 1000;
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
    error: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };