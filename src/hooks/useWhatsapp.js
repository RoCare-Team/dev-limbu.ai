import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

// All WhatsApp SSO calls go through our own /api/whatsapp/* routes.
// The shared secret lives only on the server (SSO_SHARED_SECRET) and never
// reaches the browser.

export function useWhatsapp() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [accountStatus, setAccountStatus] = useState({
    checked: false,
    exists: false,
  });

  /**
   * Check whether a WhatsApp account exists for this email.
   * Server route /api/whatsapp/check attaches the SSO secret.
   */
  const checkWhatsappAccount = useCallback(async (email) => {
    if (!email) {
      setAccountStatus({ checked: true, exists: false });
      return;
    }

    setChecking(true);

    try {
      const res = await fetch(
        `/api/whatsapp/check?email=${encodeURIComponent(email)}`,
      );
      const json = await res.json().catch(() => ({}));
      // exists → "You already have a WhatsApp account" + "Open WhatsApp Dashboard" button
      // !exists → "Connect to WhatsApp" → signup form
      setAccountStatus({ checked: true, exists: !!json?.exists });
    } catch (error) {
      console.error("Error checking WhatsApp account:", error);
      setAccountStatus({ checked: true, exists: false });
    } finally {
      setChecking(false);
    }
  }, []);

  /**
   * Existing account → server route /api/whatsapp/go fetches a fresh handoff
   * code and 302-redirects into the WhatsApp dashboard. The secret and the
   * handoff lookup stay on the server.
   */
  const openWhatsappDashboard = useCallback((email) => {
    if (!email) {
      toast.error("Email not found");
      return;
    }

    window.open(
      `/api/whatsapp/go?email=${encodeURIComponent(email)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

  /**
   * Sign up the user via /api/whatsapp/signup (server proxy), then redirect to
   * the WhatsApp dashboard with the returned handoff code.
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
        const res = await fetch("/api/whatsapp/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, workspaceName }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.success === false) {
          const msg = data.error || "WhatsApp signup failed";
          toast.error(msg);
          return { success: false, error: msg };
        }

        const handoffCode = data?.handoffCode;

        if (!handoffCode) {
          toast.error("Signup succeeded but no handoff code received");
          return { success: false, error: "Missing handoff code" };
        }

        toast.success("WhatsApp account created! Redirecting...");
        setAccountStatus({ checked: true, exists: true });

        window.location.href = `https://whatsapp.limbu.ai/auth/sso?code=${encodeURIComponent(handoffCode)}`;

        return { success: true, data };
      } catch (error) {
        console.error("Error signing up WhatsApp:", error);
        toast.error("Unexpected error while connecting WhatsApp");
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [],
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
