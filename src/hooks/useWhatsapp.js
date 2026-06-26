import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

const WHATSAPP_BASE_URL = "https://whatsapp.limbu.ai";
const SSO_SECRET = process.env.NEXT_PUBLIC_SSO_SHARED_SECRET;

const SSO_LOGIN_URL = (email) =>
  `${WHATSAPP_BASE_URL}/api/auth/sso-login?email=${encodeURIComponent(email)}`;

export function useWhatsapp() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [accountStatus, setAccountStatus] = useState({
    checked: false,
    exists: false,
  });

  /**
   * Check whether a WhatsApp account exists for this email.
   * Calls sso-login with x-sso-secret header.
   */
  const checkWhatsappAccount = useCallback(async (email) => {
    if (!email) {
      setAccountStatus({ checked: true, exists: false });
      return;
    }

    setChecking(true);

    try {
      const res = await fetch(SSO_LOGIN_URL(email), {
        headers: {
          "x-sso-secret": SSO_SECRET,
        },
      });
      const json = await res.json().catch(() => ({}));
      // data.exists → "You already have a WhatsApp account" + "Open WhatsApp Dashboard" button
      // !data.exists → "Connect to WhatsApp" → signup form
      setAccountStatus({ checked: true, exists: !!json?.data?.exists });
    } catch (error) {
      console.error("Error checking WhatsApp account:", error);
      setAccountStatus({ checked: true, exists: false });
    } finally {
      setChecking(false);
    }
  }, []);

  /**
   * Existing account → call sso-login to get a fresh handoff code,
   * then redirect to the WhatsApp dashboard.
   */
  const openWhatsappDashboard = useCallback(async (email) => {
    if (!email) {
      toast.error("Email not found");
      return;
    }

    try {
      const res = await fetch(SSO_LOGIN_URL(email), {
        headers: {
          "x-sso-secret": SSO_SECRET,
        },
      });
      const json = await res.json().catch(() => ({}));
      const handoffCode = json?.data?.handoffCode;

      if (!handoffCode) {
        toast.error("Could not retrieve dashboard access code");
        return;
      }

      window.location.href = `${WHATSAPP_BASE_URL}/auth/sso?code=${encodeURIComponent(handoffCode)}`;
    } catch (error) {
      console.error("Error opening WhatsApp dashboard:", error);
      toast.error("Unexpected error opening WhatsApp");
    }
  }, []);

  /**
   * Sign up the user on whatsapp.limbu.ai and redirect to its dashboard.
   */
  const signupWhatsapp = useCallback(
    async ({ name, email, password, workspaceName }) => {
      if (!email) {
        toast.error("Email is required");
        return { success: false, error: "Email is required" };
      }

      if (!password) {
        toast.error("Password is required");
        return { success: false, error: "Password is required" };
      }

      setLoading(true);

      try {
        const res = await fetch(`${WHATSAPP_BASE_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || email.split("@")[0],
            email,
            password,
            workspaceName: workspaceName || `${name || "My"} Business`,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.success === false) {
          const msg = data.error || data.message || "WhatsApp signup failed";
          toast.error(msg);
          return { success: false, error: msg };
        }

        const handoffCode = data?.data?.handoffCode;

        if (!handoffCode) {
          toast.error("Signup succeeded but no handoff code received");
          return { success: false, error: "Missing handoff code" };
        }

        toast.success("WhatsApp account created! Redirecting...");
        setAccountStatus({ checked: true, exists: true });

        window.location.href = `${WHATSAPP_BASE_URL}/auth/sso?code=${encodeURIComponent(handoffCode)}`;

        return { success: true, data };
      } catch (error) {
        console.error("Error signing up WhatsApp:", error);
        toast.error("Unexpected error while connecting WhatsApp");
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    checking,
    accountStatus,
    checkWhatsappAccount,
    openWhatsappDashboard,
    signupWhatsapp,
  };
}