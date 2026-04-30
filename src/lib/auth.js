import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { clientPromise } from "./mongodb";
import axios from "axios";

const GMB_DASHBOARD_DB = "gmb_dashboard";
const USERS_COLLECTION = "users";

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
  trustHost: true, // ✅ Added
  useSecureCookies: process.env.NODE_ENV === "production",

  // ✅ State mismatch fix
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
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
          if (!client || typeof client.db !== "function") {
            console.error(
              "Sign-In DB: MongoDB client unavailable (check MONGODB_URI and lib/mongodb clientPromise)."
            );
            return false;
          }

          if (!user.email) return false;

          const db = client.db(GMB_DASHBOARD_DB);
          const col = db.collection(USERS_COLLECTION);
          const googleId = profile?.sub;
          if (!googleId) return false;

          const now = new Date();
          const existing = await col.findOne({
            email: { $regex: `^${user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
          });

          const prevProjects = Array.isArray(existing?.projects) ? existing.projects : [];
          const prev = prevProjects.find((p) => p.googleId === googleId);
          const mergedProject = {
            googleId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token ?? prev?.refreshToken ?? null,
            createdAt: prev?.createdAt ?? now,
            updatedAt: now,
          };
          const projects = [
            ...prevProjects.filter((p) => p.googleId !== googleId),
            mergedProject,
          ];

          const writeResult = await col.updateOne(
            { email: existing?.email ?? user.email },
            {
              $set: {
                email: user.email,
                name: user.name,
                fullName: user.name,
                image: user.image,
                projects,
                updatedAt: now,
              },
              $setOnInsert: {
                userId: `GGL-${googleId}`,
                createdAt: now,
              },
            },
            { upsert: true }
          );
          if (!writeResult.acknowledged) {
            console.error("Sign-In DB: users write not acknowledged (check MONGODB_URI / connection).");
            return false;
          }
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
    error: "/auth/signin",
  },
};

export default NextAuth(authOptions);