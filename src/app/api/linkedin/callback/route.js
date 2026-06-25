import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // ⚠️ adjust to your actual db-connect helper path/name
import LinkedinProfile from "@/models/LinkedinProfile"; 

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

/**
 * The connected member's personal profile via OpenID Connect userinfo.
 * Requires the `openid profile email` scopes on the token.
 * The posting URN for a member is `urn:li:person:{sub}`.
 */
async function fetchMemberProfile(accessToken) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok || !data?.sub) {
    throw new Error(data?.message || "Failed to fetch LinkedIn profile.");
  }

  return {
    pageId: `urn:li:person:${data.sub}`,
    orgId: "",
    pageName: data.name || data.given_name || "LinkedIn Profile",
    localizedName: data.name || "",
    vanityName: "",
    image: data.picture || "",
    email: data.email || "",
  };
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

  // Origin to redirect back to (localhost in dev, limbu.ai in prod).
  const baseUrl = "https://limbu.ai";

  // User-facing error exit: mobile deeplink for app flows, otherwise redirect
  // back to /dashboard with an error reason the UI can turn into a toast.
  const errorRedirect = (reason, message = "") => {
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://linkedin-error?error=${encodeURIComponent(reason)}`,
      );
    }
    const errorUrl = new URL("/dashboard", baseUrl);
    errorUrl.searchParams.set("linkedin", "error");
    errorUrl.searchParams.set("reason", reason);
    if (message) errorUrl.searchParams.set("message", message);
    return NextResponse.redirect(errorUrl.toString());
  };

  try {
    if (errorParam) {
      return errorRedirect("oauth_denied", errorParam);
    }

    if (!code || !stateRaw) {
      return errorRedirect("missing_params");
    }

    if (!state.userId) {
      return errorRedirect("invalid_state");
    }

    const { userId, source = "", phoneRaw = "", connectionType = "page" } = state;
    const isProfile = connectionType === "profile";

    // Must exactly match the login route's redirectUri — both derive from the
    // same origin helper so they stay in sync across localhost / live.
    const redirectUri = `${baseUrl}/api/linkedin/callback`;

    // Separate LinkedIn app/credentials per connection type.
    const clientId = isProfile
      ? process.env.LINKEDIN_CLIENT_ID_PROFILE
      : process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = isProfile
      ? process.env.LINKEDIN_CLIENT_SECRET_PROFILE
      : process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "LinkedIn client credentials are not configured on the server" },
        { status: 500 },
      );
    }

    // Step 1: exchange the code for an access token
    const tokenData = await exchangeCodeForToken({ code, redirectUri, clientId, clientSecret });
    const { access_token, expires_in } = tokenData;

    // Step 2: profile flow → the member's own profile; page flow → every
    // organization the account administers.
    const profiles = isProfile
      ? [await fetchMemberProfile(access_token)]
      : await fetchOrganizationProfiles(access_token);

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
            type: isProfile ? "profile" : "organization",
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

    const successUrl = new URL("/dashboard", baseUrl);

    successUrl.searchParams.set("linkedin", "connected");
    successUrl.searchParams.set("connectionType", isProfile ? "profile" : "page");
    successUrl.searchParams.set("count", String(profiles.length));
    successUrl.searchParams.set("pageName", profiles[0]?.pageName || "");

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("LinkedIn Callback Route Error:", error);
    const msg = error?.message || "";

    // Categorize into a small set of reasons. The raw technical message is only
    // logged above — the UI shows a clean, friendly message per reason.
    let reason = "connection_failed";
    if (/no linkedin organization/i.test(msg)) {
      reason = "no_organization";
    } else if (
      /access token|authorization code|code verifier|redirect uri|expired/i.test(
        msg,
      )
    ) {
      reason = "token_expired";
    }

    return errorRedirect(reason);
  }
}