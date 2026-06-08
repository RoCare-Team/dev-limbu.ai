import jwt from "jsonwebtoken";
import { canAccessBookings } from "@/lib/franchiseAuth";

export function decodeFranchiseToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function assertFranchiseBookingAccess(req) {
  const decoded = decodeFranchiseToken(req);

  if (!decoded) {
    return {
      ok: false,
      status: 401,
      message: "Authentication required",
    };
  }

  if (!canAccessBookings(decoded.role)) {
    return {
      ok: false,
      status: 403,
      message: "Agents cannot access this data",
    };
  }

  const requestedCode = new URL(req.url).searchParams.get("franchiseCode");
  const tokenCode = decoded.franchiseCode;

  if (requestedCode && tokenCode && requestedCode !== tokenCode) {
    return {
      ok: false,
      status: 403,
      message: "Franchise code mismatch",
    };
  }

  return { ok: true, decoded };
}

export function assertFranchiseBookingWriteAccess(req, body = {}) {
  const isFranchiseBooking =
    body.franchiseId ||
    body.type === "service" ||
    body.type === "plan";

  if (!isFranchiseBooking) {
    return { ok: true, decoded: null };
  }

  const access = assertFranchiseBookingAccess(req);
  if (!access.ok) return access;

  const requestedCode = body.franchiseId;
  const tokenCode = access.decoded.franchiseCode;

  if (requestedCode && tokenCode && requestedCode !== tokenCode) {
    return {
      ok: false,
      status: 403,
      message: "Franchise code mismatch",
    };
  }

  return access;
}

export function assertFranchiseAdminAccess(req) {
  const decoded = decodeFranchiseToken(req);

  if (!decoded) {
    return {
      ok: false,
      status: 401,
      message: "Authentication required",
    };
  }

  if (!canAccessBookings(decoded.role)) {
    return {
      ok: false,
      status: 403,
      message: "Only franchise admin can access this feature",
    };
  }

  return { ok: true, decoded };
}
