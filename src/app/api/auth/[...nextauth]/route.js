import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

/** OAuth state/PKCE live in cookies — never cache these handlers (avoids stale state vs callback). */
export const dynamic = "force-dynamic"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
