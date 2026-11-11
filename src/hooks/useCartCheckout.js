"use client";

import { useEffect, useState } from "react";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * One Razorpay payment for every plan in the cart. The server prices the cart
 * (create-order) and activates each plan from the order notes (verify).
 * status: "idle" | "paying" | "success"; error holds a user-facing message.
 */
export function useCartCheckout() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (userId && token) {
        setLoggedInUser({
          userId,
          name: localStorage.getItem("fullName"),
          email: localStorage.getItem("userEmail") || localStorage.getItem("email"),
          phone: localStorage.getItem("mobileNumber"),
        });
      }
    } catch {
      /* storage blocked */
    }
  }, []);

  /** items: [{ offer, tier }]; guest: { name, phone, email } when not logged in. */
  const pay = async (items, guest) => {
    setError("");
    setStatus("paying");
    try {
      let buyer = loggedInUser;
      if (!buyer) {
        const res = await fetch("/api/create-or-find", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: guest.name,
            email: guest.email,
            phone: guest.phone,
            source: "website",
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.userId) throw new Error(data?.error || "Could not save your details.");
        buyer = { userId: data.userId, name: guest.name, email: guest.email, phone: guest.phone };
      }

      if (!(await loadRazorpay())) throw new Error("Payment gateway failed to load. Are you online?");

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: items, receipt: `cart_${Date.now()}` }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData?.order) throw new Error(orderData?.error || "Could not start the payment.");

      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Limbu AI",
          description: `${items.length} plan${items.length > 1 ? "s" : ""}`,
          order_id: orderData.order.id,
          prefill: { name: buyer.name || "", email: buyer.email || "", contact: buyer.phone || "" },
          theme: { color: "#eab308" },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          handler: async (response) => {
            try {
              const verify = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: buyer.userId, plan: "Cart", payment: response }),
              });
              if (!verify.ok) throw new Error("Payment received but activation failed. Please contact support.");
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.open();
      });

      setStatus("success");
      return true;
    } catch (err) {
      setError(err.message);
      setStatus("idle");
      return false;
    }
  };

  return { loggedInUser, status, error, pay, reset: () => setStatus("idle") };
}
