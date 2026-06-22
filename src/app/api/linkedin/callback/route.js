import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // ⚠️ adjust to your actual db-connect helper path/name
import LinkedinProfile from "@/models/LinkedinProfile"; // ⚠️ adjust path if your model lives elsewhere
import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

/**
 * Decoding the `state` param.
 *
 * Confirmed from the actual generated auth URL: buildYoutubeLinkedinStatePayload()
 * encodes state as plain JSON.stringify(payload) — NOT base64. So we just
 * URL-decode + JSON.parse directly.
 */
function decodeStatePayload(stateRaw) {
  try {
    return JSON.parse(decodeURIComponent(stateRaw));
  } catch (err) {
    console.error("Failed to decode LinkedIn OAuth state:", err);
    return null;
  }
}

async function exchangeCodeForToken({ code, redirectUri, clientId, clientSecret }) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }
  return data; // { access_token, expires_in, refresh_token?, scope }
}

const LINKEDIN_API_HEADERS = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  "X-Restli-Protocol-Version": "2.0.0",
});

/**
 * All organization URNs the user administers, via organizationAcls.
 * Requires w_organization_social / rw_organization_admin scopes on the token.
 * A single account can administer multiple pages, so we return every URN.
 */
async function fetchAdminOrganizationUrns(accessToken) {
  const url =
    "https://api.linkedin.com/v2/organizationAcls" +
    "?q=roleAssignee" +
    "&role=ADMINISTRATOR" +
    "&state=APPROVED";

  const res = await fetch(url, { headers: LINKEDIN_API_HEADERS(accessToken) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch LinkedIn organizations");

  const urns = (data?.elements || [])
    .map((el) => el.organizationalTarget || el.organization)
    .filter(Boolean);

  // De-duplicate in case the same org is returned more than once.
  return [...new Set(urns)];
}

/**
 * Full details for a single organization, including localizedName, vanityName
 * and a resolved logo image URL.
 */
async function fetchOrganizationDetails(accessToken, orgUrn) {
  const orgId = String(orgUrn).split(":").pop();

  const url =
    `https://api.linkedin.com/v2/organizations/${orgId}` +
    "?projection=(id,localizedName,vanityName,logoV2(original~:playableStreams))";

  const res = await fetch(url, { headers: LINKEDIN_API_HEADERS(accessToken) });
  const data = await res.json();

  // Don't fail the whole connection if one org lookup misbehaves.
  if (!res.ok) {
    console.error("LinkedIn org details fetch failed:", orgUrn, data?.message);
    return {
      pageId: `urn:li:organization:${orgId}`,
      orgId,
      pageName: "LinkedIn Page",
      localizedName: "",
      vanityName: "",
      image: "",
      email: "",
    };
  }

  const logo =
    data?.logoV2?.["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier || "";

  const localizedName = data?.localizedName || "";

  return {
    pageId: `urn:li:organization:${data?.id ?? orgId}`,
    orgId: String(data?.id ?? orgId),
    pageName: localizedName || "LinkedIn Page",
    localizedName,
    vanityName: data?.vanityName || "",
    image: logo,
    email: "",
  };
}

/**
 * Every page the account administers, with names + logos resolved.
 */
async function fetchOrganizationProfiles(accessToken) {
  const urns = await fetchAdminOrganizationUrns(accessToken);
  if (!urns.length) {
    throw new Error("No LinkedIn organization found for this account.");
  }

  return Promise.all(urns.map((urn) => fetchOrganizationDetails(accessToken, urn)));
}

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Decode state up-front so every exit path knows whether this is a mobile-app
  // flow (mobile=true). If so we deeplink back into the app instead of the website.
  const state = decodeStatePayload(stateRaw) || {};
  const isMobile = state.mobile === true;

  try {
    if (errorParam) {
      if (isMobile) {
        return NextResponse.redirect(
          `limbuai://linkedin-error?error=${encodeURIComponent(errorParam)}`,
        );
      }
      return NextResponse.json(
        { error: `LinkedIn OAuth denied: ${errorParam}` },
        { status: 400 },
      );
    }

    if (!code || !stateRaw) {
      if (isMobile) {
        return NextResponse.redirect(`limbuai://linkedin-error?error=missing_params`);
      }
      return NextResponse.json(
        { error: "Missing code or state from LinkedIn callback" },
        { status: 400 },
      );
    }

    if (!state.userId) {
      if (isMobile) {
        return NextResponse.redirect(`limbuai://linkedin-error?error=invalid_state`);
      }
      return NextResponse.json({ error: "Invalid or unreadable state param" }, { status: 400 });
    }

    const { userId, source = "", phoneRaw = "" } = state;

    const baseUrl = resolveOAuthRedirectOrigin(req);
    // ⚠️ Hardcoded for local testing — switch back to `${baseUrl}/api/linkedin/callback`
    // before deploying, and keep it identical to the login route's redirectUri.
    const redirectUri = `https://limbu.ai/api/linkedin/callback`;

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "LinkedIn client credentials are not configured on the server" },
        { status: 500 },
      );
    }

    // Step 1: exchange the code for an access token
    const tokenData = await exchangeCodeForToken({ code, redirectUri, clientId, clientSecret });
    const { access_token, expires_in } = tokenData;

    // Step 2: every page/organization the account administers
    const profiles = await fetchOrganizationProfiles(access_token);

    // Step 3: persist each page (multiple pages per account supported)
    await dbConnect();

    const tokenExpiresAt = new Date(Date.now() + (expires_in || 0) * 1000);
    const connectionSource = source === "chatbot" ? "chatbot" : "manual";

    const ops = profiles.map((p) => ({
      updateOne: {
        filter: { userId, pageId: p.pageId },
        update: {
          $set: {
            userId,
            pageId: p.pageId,
            orgId: p.orgId,
            pageName: p.pageName,
            localizedName: p.localizedName,
            vanityName: p.vanityName,
            image: p.image,
            email: p.email || "",
            pageAccessToken: access_token,
            pageTokenExpiresAt: tokenExpiresAt,
            platform: "linkedin",
            type: "organization",
            phone: phoneRaw || "",
            connectionSource,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length) {
      await LinkedinProfile.bulkWrite(ops);
    }

    // Step 4: redirect back — mobile app deeplink for app flows, website otherwise.
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://linkedin-success?status=connected&count=${profiles.length}`,
      );
    }

    const successUrl = new URL("/dashboard", "https://limbu.ai");

    successUrl.searchParams.set("count", String(profiles.length));
    successUrl.searchParams.set("pageName", profiles[0]?.pageName || "");

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("LinkedIn Callback Route Error:", error);
    if (isMobile) {
      return NextResponse.redirect(`limbuai://linkedin-error?error=unknown`);
    }
    return NextResponse.json(
      { error: error.message || "Failed to complete LinkedIn authentication" },
      { status: 500 },
    );
  }
}