import dbConnect from "@/lib/dbConnect";
import ApiRequestLog from "@/models/ApiRequestLog";

export async function logApiRequest({
  path,
  method,
  status,
  durationMs = 0,
  errorMessage = "",
}) {
  try {
    await dbConnect();
    await ApiRequestLog.create({
      path,
      method,
      status,
      success: status >= 200 && status < 400,
      durationMs,
      errorMessage,
    });
  } catch (err) {
    console.error("API log write failed:", err?.message || err);
  }
}
