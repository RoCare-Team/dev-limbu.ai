import NextAuth from "next-auth";

/**
 * ⚠️ GOOGLE PROVIDER JAAN-BOOJHKAR HATAYA GAYA HAI.
 *
 * Pehle yahan ek GoogleProvider tha jo wahi `GOOGLE_CLIENT_ID` +
 * `business.manage` scope + `prompt: "consent"` maangta tha jo naya GMB connect
 * flow (src/app/api/gmb/connect + callback) maangta hai.
 *
 * Do OAuth grant surfaces ek hi Google account ke liye = token churn: ek flow ka
 * naya consent doosre flow ke refresh token ko revoke karwa sakta tha, jisse
 * user ko 1-2 din me "session expired" (invalid_grant) milta tha aur scheduled
 * post fail hote the.
 *
 * Ab GMB ka poora OAuth sirf naye flow se hota hai (ek hi grant surface). App
 * login phone/OTP se hota hai — NextAuth ki yahan koi zaroorat nahi. Ye config
 * provider-less hai: `/api/auth/session` khaali session lautata hai, koi Google
 * grant issue ya refresh NAHI karta.
 *
 * Purana Google-login DB upsert ab GMB callback me hota hai — dekho
 * src/app/api/gmb/callback/route.js (syncLegacyGmbUser).
 */
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [],
  session: { strategy: "jwt" },
};

export default NextAuth(authOptions);
