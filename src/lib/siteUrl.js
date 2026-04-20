/**
 * Public base URL for purchase/checkout links.
 * Prefer NEXT_PUBLIC_SITE_URL in production so API/chatbot get stable absolute URLs.
 */
export function getPublicSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  const vercel = process.env.VERCEL_URL
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`
  }
  return "https://www.limbu.ai"
}
