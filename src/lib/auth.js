import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "./dbConnect";
import axios from "axios";

const GMB_USER_COLLECTION = "gmb_user";

const isProduction = process.env.NODE_ENV === "production";

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
    console.error("RefreshAccessToken Error:", error.response?.data || error.message);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  useSecureCookies: isProduction,

  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: isProduction
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        maxAge: 900,
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
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
          scope:
            "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // ✅ signIn callback — localStorage userId URL se read karke gmb_user mein save karo
    async signIn({ user, account, profile, req }) {
      if (account.provider === "google") {
        try {
          const mongoose = await dbConnect();
          const db = mongoose.connection.db;

          if (!db) {
            console.error("SignIn Error: DB not available after dbConnect()");
            return false;
          }

          if (!user.email) {
            console.error("SignIn Error: user.email is missing");
            return false;
          }

          const googleId = profile?.sub;
          if (!googleId) {
            console.error("SignIn Error: profile.sub (Google ID) is missing");
            return false;
          }

          // ✅ localStorage se aaya userId — callbackUrl param se read karo
          let localStorageUserId = null;
          try {
            // callbackUrl mein userId pass hota hai GMBColumn se
            const callbackUrl = req?.query?.callbackUrl || "";
            const callbackUrlObj = new URL(callbackUrl, "http://localhost");
            localStorageUserId = callbackUrlObj.searchParams.get("userId");

            // Fallback: referer se try karo
            if (!localStorageUserId) {
              const referer = req?.headers?.referer || "";
              if (referer) {
                const refererObj = new URL(referer, "http://localhost");
                localStorageUserId = refererObj.searchParams.get("userId");
              }
            }
          } catch (_) {
            console.warn("Could not parse userId from URL");
          }

          const col = db.collection(GMB_USER_COLLECTION);
          const now = new Date();

          // ✅ Existing user find karo by email
          const existing = await col.findOne({
            email: {
              $regex: `^${user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              $options: "i",
            },
          });

          const prevProjects = Array.isArray(existing?.projects)
            ? existing.projects
            : [];

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

          // ✅ Priority: DB userId > localStorage userId > fallback GGL-googleId
          const userId =
            existing?.userId ||
            localStorageUserId ||
            `GGL-${googleId}`;

          const writeResult = await col.updateOne(
            { email: existing?.email ?? user.email },
            {
              $set: {
                email: user.email,
                name: user.name,
                fullName: user.name,
                image: user.image,
                projects,
                userId, // ✅ localStorage wala userId save hoga
                updatedAt: now,
              },
              $setOnInsert: {
                createdAt: now,
              },
            },
            { upsert: true }
          );

          if (!writeResult.acknowledged) {
            console.error("SignIn Error: MongoDB write not acknowledged.");
            return false;
          }

          // ✅ JWT ke liye user object pe attach karo
          user.userId = userId;

          console.log(`✅ User saved to gmb_user: ${user.email} | userId: ${userId}`);
          return true;
        } catch (error) {
          console.error("SignIn DB Error:", error);
          return false;
        }
      }

      return true;
    },

    // ✅ JWT callback — userId token mein store karo
    async jwt({ token, account, user, profile }) {
      if (account && user) {
        const googleId = profile?.sub;
        return {
          ...token,
          id: user.id,
          userId: user.userId ?? `GGL-${googleId}`, // ✅ signIn se aaya userId
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + (account.expires_in || 3600) * 1000,
        };
      }

      // Token still valid
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Token expired — refresh karo
      console.log("🔄 Access token expired, refreshing...");
      return refreshAccessToken(token);
    },

    // ✅ Session callback — client ko userId expose karo
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.userId = token.userId; // ✅ Client pe session.user.userId se milega
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