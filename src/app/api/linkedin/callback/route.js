import axios from "axios";
import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import LinkedinProfile from "@/models/LinkedinProfile";

import {
  parseYoutubeLinkedinOAuthState,
  linkedinSuccessRedirect,
  linkedinErrorRedirect,
} from "@/lib/chatbotPlatformOAuthState";

import { resolveOAuthRedirectOrigin } from "@/lib/oauthRedirectOrigin";

export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);

    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    const baseUrl = resolveOAuthRedirectOrigin(req);

    /**
     * Parse OAuth State
     */
    const parsed = parseYoutubeLinkedinOAuthState(stateParam);

    const userId = parsed.userId;

    const isMobile = parsed.mobile;

    /**
     * NEW
     * profile | page
     */
    const connectionType = parsed.connectionType || "profile";

    /**
     * Validation
     */
    if (!code || !userId) {
      if (isMobile) {
        return NextResponse.redirect(
          `limbuai://linkedin-error?error=missing_params`,
        );
      }

      return NextResponse.redirect(
        linkedinErrorRedirect(parsed, "missing_params", baseUrl),
      );
    }

    /**
     * Source
     */
    const connectionSource = parsed.source === "chatbot" ? "chatbot" : "manual";

    const tagPhone =
      parsed.source === "chatbot" && parsed.phone ? parsed.phone : "";

    /**
     * Different Credentials
     */
    const clientId =
      connectionType === "page"
        ? process.env.MANNU_LINKEDIN_CLIENT_ID
        : process.env.LINKEDIN_CLIENT_ID;

    const clientSecret =
      connectionType === "page"
        ? process.env.MANNU_LINKEDIN_CLIENT_SECRET
        : process.env.LINKEDIN_CLIENT_SECRET;

    /**
     * Exchange Token
     */
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",

      new URLSearchParams({
        grant_type: "authorization_code",

        code,

        client_id: clientId,

        client_secret: clientSecret,

        redirect_uri: `${baseUrl}/api/linkedin/callback`,
      }),

      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token, expires_in } = tokenRes.data;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    /**
     * =====================================================
     * PROFILE FLOW
     * =====================================================
     */
    if (connectionType === "profile") {
      let personUrn = "";

      let personName = "LinkedIn User";

      let profilePicture = "";

      let email = "";

      try {
        /**
         * Fetch Profile
         */
        const meRes = await axios.get(
          "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",

          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        const meData = meRes.data;

        personUrn = meData.id;

        personName = `${meData.localizedFirstName || ""} ${
          meData.localizedLastName || ""
        }`.trim();

        /**
         * Profile Image
         */
        const displayImage = meData.profilePicture?.["displayImage~"];

        if (
          displayImage &&
          displayImage.elements &&
          displayImage.elements.length > 0
        ) {
          profilePicture =
            displayImage.elements[displayImage.elements.length - 1]
              .identifiers[0].identifier;
        }

        /**
         * Email
         */
        try {
          const emailRes = await axios.get(
            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",

            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            },
          );

          const emailElements = emailRes.data.elements;

          if (emailElements && emailElements.length > 0) {
            email = emailElements[0]["handle~"]?.emailAddress || "";
          }
        } catch (emailErr) {
          console.log("Could not fetch LinkedIn email.");
        }
      } catch (meErr) {
        /**
         * Fallback userinfo endpoint
         */
        console.log(
          "Fallback to /v2/userinfo",
          meErr.response?.data || meErr.message,
        );

        const profileRes = await axios.get(
          "https://api.linkedin.com/v2/userinfo",

          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        personUrn = profileRes.data.sub;

        personName = profileRes.data.name || "LinkedIn User";

        profilePicture = profileRes.data.picture || "";

        email = profileRes.data.email || "";
      }

      /**
       * Save Profile
       */
      if (personUrn) {
        await LinkedinProfile.findOneAndUpdate(
          {
            userId,
            pageId: `urn:li:person:${personUrn}`,
          },

          {
            userId,

            pageId: `urn:li:person:${personUrn}`,

            pageName: `${personName} (Profile)`,

            image: profilePicture,

            email,

            pageAccessToken: access_token,

            pageTokenExpiresAt: expiresAt,

            platform: "linkedin",

            type: "profile",

            connectionSource,

            phone: tagPhone || "",
          },

          {
            upsert: true,
            new: true,
          },
        );
      }
    }

    /**
     * =====================================================
     * PAGE FLOW
     * =====================================================
     */
    if (connectionType === "page") {
      try {
        /**
         * Fetch Organizations
         */
        const orgsRes = await axios.get(
          "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",

          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        const elements = orgsRes.data.elements || [];

        /**
         * Save Each Organization
         */
        for (const el of elements) {
          const orgUrn = el.organization;

          const orgId = orgUrn.split(":").pop();

          let orgName = `Company Page (${orgId})`;

          let orgLogo = "";

          /**
           * Fetch Organization Details
           */
          try {
            const orgDetailRes = await axios.get(
              `https://api.linkedin.com/v2/organizations/${orgId}?projection=(id,localizedName,logoV2(original~:playableStreams))`,

              {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                },
              },
            );

            orgName = orgDetailRes.data.localizedName || orgName;

            const logoV2 = orgDetailRes.data.logoV2?.["original~"];

            if (logoV2 && logoV2.elements && logoV2.elements.length > 0) {
              orgLogo = logoV2.elements[0].identifiers[0].identifier;
            }
          } catch (orgDetailErr) {
            console.log(
              `Failed to fetch organization ${orgId}`,
              orgDetailErr.response?.data || orgDetailErr.message,
            );
          }

          /**
           * Save Organization
           */
          await LinkedinProfile.findOneAndUpdate(
            {
              userId,
              pageId: orgUrn,
            },

            {
              userId,

              pageId: orgUrn,

              pageName: orgName,

              image: orgLogo,

              pageAccessToken: access_token,

              pageTokenExpiresAt: expiresAt,

              platform: "linkedin",

              type: "organization",

              connectionSource,

              phone: tagPhone || "",
            },

            {
              upsert: true,
              new: true,
            },
          );
        }
      } catch (err) {
        console.log(
          "Could not fetch LinkedIn organizations.",
          err.response?.data || err.message,
        );
      }
    }

    /**
     * Mobile Redirect
     */
    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://linkedin-success?status=connected&type=${connectionType}`,
      );
    }

    /**
     * Web Redirect
     */
    return NextResponse.redirect(linkedinSuccessRedirect(parsed, baseUrl));
  } catch (err) {
    console.error(
      "LINKEDIN CALLBACK ERROR:",
      err.response?.data || err.message,
    );

    const baseUrl = resolveOAuthRedirectOrigin(req);

    const stateParam = new URL(req.url).searchParams.get("state");

    const parsed = parseYoutubeLinkedinOAuthState(stateParam);

    const isMobile = parsed.mobile;

    if (isMobile) {
      return NextResponse.redirect(
        `limbuai://linkedin-error?error=oauth_failed`,
      );
    }

    return NextResponse.redirect(
      linkedinErrorRedirect(parsed, "oauth_failed", baseUrl),
    );
  }
}
