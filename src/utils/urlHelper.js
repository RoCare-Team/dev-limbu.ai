// Helper to safely get the base URL based on the environment
export function getBaseUrl(req) {
  if (process.env.NODE_ENV === "development") {
    // If a request object is provided, try to extract the host dynamically (useful for local network testing)
    if (req && req.headers && req.headers.get("host")) {
       const protocol = req.headers.get("x-forwarded-proto") || "http";
       return `${protocol}://${req.headers.get("host")}`;
    }
    return "http://localhost:3000";
  }
  
  // Production fallback
  return process.env.BASE_URL || "https://limbu.ai";
}