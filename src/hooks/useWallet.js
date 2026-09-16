"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const TX_PAGE_SIZE = 50;
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
  // Full history is paged (a single user can have thousands of rows).
  const [txHasMore, setTxHasMore] = useState(false);
  const [txNextBefore, setTxNextBefore] = useState(null);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);
  // Every first-page load gets a number; replies from an older load (e.g. the
  // previous filter) are ignored so they can't overwrite the current list.
  const txRequestRef = useRef(0);
  const filterTypeRef = useRef(filterType);
  filterTypeRef.current = filterType;

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

  const buildTxUrl = (uid, type, before) => {
    const qs = new URLSearchParams({ userId: uid, limit: String(TX_PAGE_SIZE) });
    if (type && type !== "all") qs.set("type", type);
    if (before) qs.set("before", before);
    return `/api/transactions?${qs.toString()}`;
  };

  // First page for the current filter (the server filters across the whole history).
  const fetchTransactions = useCallback(async (uid, type = filterTypeRef.current) => {
    if (!uid) return;
    const requestId = ++txRequestRef.current;
    try {
      setLoadingTx(true);
      const res = await fetch(buildTxUrl(uid, type));
      const data = await res.json();
      if (requestId !== txRequestRef.current) return;
      setTransactions(data.transactions || []);
      setTxHasMore(!!data.hasMore);
      setTxNextBefore(data.nextBefore || null);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
    } finally {
      if (requestId === txRequestRef.current) setLoadingTx(false);
    }
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    if (!userId || !txHasMore || !txNextBefore || loadingMoreTx) return;
    const requestId = txRequestRef.current;
    try {
      setLoadingMoreTx(true);
      const res = await fetch(buildTxUrl(userId, filterTypeRef.current, txNextBefore));
      const data = await res.json();
      // Filter changed while this page was loading — drop it.
      if (requestId !== txRequestRef.current) return;
      setTransactions((prev) => {
        const seen = new Set(prev.map((t) => String(t._id || t.id)));
        return [...prev, ...(data.transactions || []).filter((t) => !seen.has(String(t._id || t.id)))];
      });
      setTxHasMore(!!data.hasMore);
      setTxNextBefore(data.nextBefore || null);
    } catch (err) {
      console.error("Loading more transactions failed:", err);
    } finally {
      setLoadingMoreTx(false);
    }
  }, [userId, txHasMore, txNextBefore, loadingMoreTx]);

  useEffect(() => {
    const storedUserId = getLocalStorage("userId");
    if (storedUserId) setUserId(storedUserId);
  }, []);

  // Load (or reload) the first page whenever the user or the filter changes.
  useEffect(() => {
    if (userId) fetchTransactions(userId, filterType);
  }, [userId, filterType, fetchTransactions]);

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
    txHasMore,
    loadingMoreTx,
    loadMoreTransactions,
    handleRecharge,
    goBack,
    router
  };
}