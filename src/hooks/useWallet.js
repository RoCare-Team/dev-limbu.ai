"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorage } from "@/utils/storage";

export function useWallet() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(5000);
  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [showTransactions, setShowTransactions] = useState(false);

  // Preset Amounts
  const presetAmounts = useMemo(() => [
    { price: 200, coins: 200, popular: false, bonus: null },
    { price: 500, coins: 500, popular: false, bonus: null },
    { price: 1000, coins: 1000, popular: false, bonus: null },
    { price: 5000, coins: 6000, popular: true, bonus: "+1000 Bonus" },
    { price: 10000, coins: 12000, popular: false, bonus: "+2000 Bonus" },
    { price: 20000, coins: 24000, popular: false, bonus: "+4000 Bonus" },
    { price: 50000, coins: 60000, popular: false, bonus: "+10000 Bonus" },
  ], []);

  // Calculate coins with bonus offers
  const getCoinsForAmount = useCallback((amt) => {
    if (amt >= 50000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 20000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 10000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 5000) return Math.floor(amt * 1.2); // 20% bonus
    return amt; // 1:1 for amounts below 5000
  }, []);

  const coins = useMemo(() => getCoinsForAmount(amount), [amount, getCoinsForAmount]);
  const gstAmount = useMemo(() => (amount * 0.18).toFixed(2), [amount]);
  const totalAmount = useMemo(() => (amount + parseFloat(gstAmount)).toFixed(2), [amount, gstAmount]);

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const fetchTransactions = useCallback(async (uid) => {
    try {
      setLoadingTx(true);
      const res = await fetch(`/api/transactions?userId=${uid}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    const storedUserId = getLocalStorage("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchTransactions(storedUserId);
    }
  }, [fetchTransactions]);

  const handleRecharge = useCallback(async () => {
    if (!userId) {
      alert("User not found. Please log in again.");
      return;
    }

    if (amount < 200) {
      alert("Minimum recharge is ₹200");
      return;
    }

    const referCode = getLocalStorage("franchise_code") || "";
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      return;
    }

    try {
      setLoading(true);

      const orderRes = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan: "WalletRecharge",
          amount: parseFloat(totalAmount),
          gstin: gstNumber,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        alert(orderData.error || "Order creation failed");
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Limbu AI Wallet",
        description: `Recharge ₹${amount} + GST ₹${gstAmount}`,
        order_id: orderData.id,
        theme: { color: "#facc15" },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/subscribe/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                platform: "web",
                plan: "WalletRecharge",
                amount: parseFloat(amount),
                gstAmount: parseFloat(gstAmount),
                totalAmount: parseFloat(totalAmount),
                gstin: gstNumber,
                referCode: referCode,
                payment: response,
              }),
            });

            const result = await verifyRes.json();

            if (!result.success) {
              alert(result.error || "Payment verification failed!");
              setLoading(false);
              return;
            }

            setShowSuccess(true);
            fetchTransactions(userId);

            setTimeout(() => {
              setShowSuccess(false);
              router.push("/dashboard");
            }, 2000);

          } catch (err) {
            console.error("Verification error:", err);
            alert("Verification failed!");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "Limbu AI User",
          email: "info@limbu.ai",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        alert("Payment failed!");
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      console.error("Recharge error:", err);
      alert("Something went wrong!");
      setLoading(false);
    }
  }, [userId, amount, totalAmount, gstAmount, gstNumber, loadRazorpayScript, fetchTransactions, router]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType === "all") return true;
      if (filterType === "credit") return tx.type === "credit" || tx.type === "add";
      if (filterType === "debit") return tx.type === "debit" || tx.type === "subtract";
      return true;
    });
  }, [transactions, filterType]);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  return {
    amount,
    setAmount,
    gstNumber,
    setGstNumber,
    loading,
    showSuccess,
    setShowSuccess,
    loadingTx,
    filterType,
    setFilterType,
    showTransactions,
    setShowTransactions,
    presetAmounts,
    coins,
    gstAmount,
    totalAmount,
    filteredTransactions,
    handleRecharge,
    goBack,
    router
  };
}