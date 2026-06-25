import dbConnect from "@/lib/dbConnect";
import AutoReply from "@/models/AutoReply";
import { NextResponse } from "next/server";

const normalizeGmbAccountId = (accountId) =>
  String(accountId || "").replace(/^accounts\//, "");

/**
 * POST /api/saveAutoReply
 * Toggle autoReply for a connected GMB account and all its locations.
 *
 * Body: { userId, refreshToken, accountId, locations: [{ accountId, locationId }], autoReply: Boolean }
 */
export async function POST(req) {
  await dbConnect();
  const body = await req.json();

  const { userId, refreshToken, accountId: rawAccountId, locations = [], autoReply } = body;
  const accountId = normalizeGmbAccountId(rawAccountId);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User is not properly authenticated." },
      { status: 400 }
    );
  }

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: "accountId is required." },
      { status: 400 }
    );
  }

  if (typeof autoReply !== "boolean") {
    return NextResponse.json(
      { success: false, error: "autoReply must be a boolean." },
      { status: 400 }
    );
  }

  try {
    // Locations being toggled in this request (carry the per-location autoReply state)
    const incomingLocations = Array.isArray(locations)
      ? locations
          .filter((loc) => loc?.locationId)
          .map((loc) => ({
            ...loc,
            accountId: normalizeGmbAccountId(loc.accountId || accountId),
            locationId: loc.locationId,
            autoReply,
          }))
      : [];

    // Merge incoming locations into an existing set, updating matches and
    // preserving the per-location autoReply of locations not in this request.
    const mergeLocations = (existing = []) => {
      const byId = new Map(
        (existing || []).map((loc) => [loc.locationId, { ...loc }])
      );
      incomingLocations.forEach((loc) => {
        byId.set(loc.locationId, { ...(byId.get(loc.locationId) || {}), ...loc });
      });
      return Array.from(byId.values());
    };

    // Check if user record exists
    let record = await AutoReply.findOne({ userId });

    if (!record) {
      // Create new record with this location
      record = await AutoReply.create({
        userId,
        refreshToken,
        accounts: [{ accountId, autoReply, locations: incomingLocations }],
        locations: incomingLocations,
        autoReply,
        updatedAt: new Date(),
      });
    } else {
      // Update refreshToken if provided
      if (refreshToken) record.refreshToken = refreshToken;

      if (!Array.isArray(record.accounts)) record.accounts = [];

      const accountIndex = record.accounts.findIndex(
        (acc) => normalizeGmbAccountId(acc.accountId) === accountId
      );
      if (accountIndex > -1) {
        const mergedAccountLocations = mergeLocations(
          record.accounts[accountIndex].locations
        );
        record.accounts[accountIndex].locations = mergedAccountLocations;
        // Account-level flag = ON if any of its locations have auto-reply ON (legacy compat)
        record.accounts[accountIndex].autoReply = mergedAccountLocations.some(
          (loc) => loc.autoReply === true
        );
        record.markModified("accounts");
      } else {
        record.accounts.push({ accountId, autoReply, locations: incomingLocations });
      }

      const otherLocations = (record.locations || []).filter(
        (loc) => normalizeGmbAccountId(loc.accountId) !== accountId
      );
      const sameAccountLocations = mergeLocations(
        (record.locations || []).filter(
          (loc) => normalizeGmbAccountId(loc.accountId) === accountId
        )
      );
      record.locations = [...otherLocations, ...sameAccountLocations];
      record.autoReply = record.accounts.some((acc) => acc.autoReply === true);
      record.updatedAt = new Date();
      await record.save();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST AutoReply Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/saveAutoReply?userId=xxx&accountId=yyy
 * Returns autoReply status for all connected GMB accounts of a user.
 */
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const accountId = normalizeGmbAccountId(searchParams.get("accountId"));

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const record = await AutoReply.findOne({ userId }).lean();

    if (!record) {
      return NextResponse.json({
        success: true,
        locations: [],
        message: "No auto-reply settings found",
      });
    }

    const accounts = Array.isArray(record.accounts) && record.accounts.length > 0
      ? record.accounts
      : buildAccountsFromLegacyLocations(record.locations || [], record.autoReply === true);

    const filteredAccounts = accountId
      ? accounts.filter((acc) => normalizeGmbAccountId(acc.accountId) === accountId)
      : accounts;

    // Resolve per-location autoReply, falling back to the account-level flag for
    // legacy records where locations were stored without their own autoReply field.
    const resolveLocationAutoReply = (loc, acc) =>
      typeof loc.autoReply === "boolean" ? loc.autoReply : acc.autoReply === true;

    const accountsWithLocationFlags = filteredAccounts.map((acc) => ({
      ...acc,
      locations: (acc.locations || []).map((loc) => ({
        ...loc,
        autoReply: resolveLocationAutoReply(loc, acc),
      })),
    }));

    const locations = accountsWithLocationFlags.flatMap((acc) => acc.locations);

    return NextResponse.json({
      success: true,
      accounts: accountsWithLocationFlags,
      locations,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error("GET AutoReply Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildAccountsFromLegacyLocations(locations, defaultAutoReply = false) {
  const accountsById = new Map();

  locations.forEach((loc) => {
    const accountId = normalizeGmbAccountId(loc?.accountId);
    if (!accountId) return;
    if (!accountsById.has(accountId)) {
      accountsById.set(accountId, {
        accountId,
        autoReply: defaultAutoReply,
        locations: [],
      });
    }

    const account = accountsById.get(accountId);
    account.autoReply = account.autoReply || loc.autoReply === true;
    account.locations.push({
      ...loc,
      accountId,
      locationId: loc.locationId,
    });
  });

  return Array.from(accountsById.values());
}
