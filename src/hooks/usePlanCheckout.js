"use client";

import { useEffect, useState } from "react";

/**
 * Plan booking + Razorpay checkout, shared by pages that sell plans
 * (/pricing, /website-development). Call handlePlanClick(plan) to open the
 * booking modal and spread modalProps onto <ServiceBookingModal />.
 */
export function usePlanCheckout() {
  // ── Modal / booking state ──
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ── Auth state read from localStorage ──
  const [loggedInUser, setLoggedInUser] = useState(null); // { userId, fullName, email, phone, token }

  // ── Form state — only used when guest (not logged in) ──
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  // ─────────────────────────────────────────────
  // Read localStorage once on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      const email =
        localStorage.getItem("userEmail") || localStorage.getItem("email");
      const name = localStorage.getItem("fullName");
      const phone = localStorage.getItem("mobileNumber");

      if (userId && token) {
        setLoggedInUser({ userId, token, email, name, phone });
      }
    } catch (_) {
      // localStorage not available (SSR guard)
    }
  }, []);

  // ─────────────────────────────────────────────
  // Open modal — set selected plan
  // ─────────────────────────────────────────────
  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setBookingSuccess(false);
    setShowServiceModal(true);
  };

  // ─────────────────────────────────────────────
  // Razorpay loader
  // ─────────────────────────────────────────────
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true); // already loaded
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ─────────────────────────────────────────────
  // Core: open Razorpay for a known userId
  // ─────────────────────────────────────────────
  const openRazorpay = async ({ userId, name, email, phone }) => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // Parse amount safely
    const rawTotal =
      selectedPlan?.totalPrice ??
      selectedPlan?.totalAmount ??
      selectedPlan?.basePrice ??
      0;
    const parsedAmount =
      typeof rawTotal === "string"
        ? Number(rawTotal.replace(/[^0-9.-]+/g, ""))
        : Number(rawTotal);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Invalid payment amount. Please contact support.");
      return;
    }

    // Create Razorpay order
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: selectedPlan?.title,
        planDuration: selectedPlan?.planDuration || "monthly",
        amount: parsedAmount,
        receipt: `plan_${Date.now()}`,
        notes: { plan_name: selectedPlan?.title, user_email: email },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || !orderData?.order) {
      alert(
        `Error: ${orderData?.error || "Payment gateway connection failed."}`,
      );
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Limbu AI",
      description: `Payment for ${selectedPlan?.title}`,
      order_id: orderData.order.id,
      prefill: { name, email, contact: phone },
      theme: { color: "#eab308" },
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              plan: selectedPlan?.title,
              planDuration: selectedPlan?.planDuration || "monthly",
              payment: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            }),
          });

          if (verifyRes.ok) {
            setBookingSuccess(true);
            setTimeout(() => {
              setShowServiceModal(false);
              setBookingSuccess(false);
              setServiceForm({ name: "", phone: "", email: "", gstNumber: "" });
            }, 3000);
          } else {
            alert("Payment verification failed on server.");
          }
        } catch (err) {
          console.error("Verification Error:", err);
          alert(
            "Payment successful but verification failed. Please contact support.",
          );
        }
      },
    };

    new window.Razorpay(options).open();
  };

  // ─────────────────────────────────────────────
  // LOGGED-IN USER: skip form, pay directly
  // ─────────────────────────────────────────────
  const handleLoggedInPayment = async () => {
    if (!loggedInUser) return;
    await openRazorpay({
      userId: loggedInUser.userId,
      name: loggedInUser.name,
      email: loggedInUser.email,
      phone: loggedInUser.phone,
    });
  };

  const handleGuestPayment = async (e) => {
    e.preventDefault();

    try {
      const createRes = await fetch("/api/create-or-find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: serviceForm.name,
          email: serviceForm.email,
          phone: serviceForm.phone, // Matches Schema "phone"
          gstNumber: serviceForm.gstNumber,
          source: "website",
          planDuration: selectedPlan?.planDuration || "monthly",
        }),
      });

      const createData = await createRes.json();

      // Check for success and userId
      if (!createRes.ok || !createData?.userId) {
        alert(createData?.error || "Failed to process user information.");
        return;
      }

      // Use the userId from the response for Razorpay
      await openRazorpay({
        userId: createData.userId,
        name: serviceForm.name || createData.user?.fullName || "Guest",
        email: serviceForm.email || createData.user?.email,
        phone: serviceForm.phone || createData.user?.phone,
      });
    } catch (err) {
      console.error("Guest Payment Error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // ─────────────────────────────────────────────
  // Unified handler passed to ServiceBookingModal
  // ─────────────────────────────────────────────
  const handleServicePayment = loggedInUser
    ? handleLoggedInPayment
    : handleGuestPayment;

  return {
    handlePlanClick,
    modalProps: {
      showServiceModal,
      setShowServiceModal,
      selectedPlan,
      bookingSuccess,
      // If logged in, the form is hidden — pass null so the modal knows
      serviceForm: loggedInUser ? null : serviceForm,
      setServiceForm: loggedInUser ? null : setServiceForm,
      isLoggedIn: !!loggedInUser,
      loggedInUser,
      handleServicePayment,
    },
  };
}
