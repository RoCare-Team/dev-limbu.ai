"use client";
import { useState, useEffect } from "react";
import {
  Wallet,
  Coins,
  IndianRupee,
  ArrowRight,
  Sparkles,
  CheckCircle,
  CreditCard,
  Zap,
  TrendingUp,
  Shield,
  ArrowLeft,
  History,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Receipt,
  Clock,
  X,
  FileText,
  Loader2,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";


export default function SmartWalletRecharge() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(5000);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [showTransactions, setShowTransactions] = useState(false);
  const [gstNumber, setGstNumber] = useState("");

  // Calculate coins with bonus offers
  const getCoinsForAmount = (amt) => {
    if (amt >= 50000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 20000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 10000) return Math.floor(amt * 1.2); // 20% bonus
    if (amt >= 5000) return Math.floor(amt * 1.2); // 20% bonus
    return amt; // 1:1 for amounts below 5000
  };

  const coins = getCoinsForAmount(amount);
  const gstAmount = (amount * 0.18).toFixed(2);
  const totalAmount = (amount + parseFloat(gstAmount)).toFixed(2);

  const presetAmounts = [
    { price: 200, coins: 200, popular: false, bonus: null },
    { price: 500, coins: 500, popular: false, bonus: null },
    { price: 1000, coins: 1000, popular: false, bonus: null },
    { price: 5000, coins: 6000, popular: true, bonus: "+1000 Bonus" },
    { price: 10000, coins: 12000, popular: false, bonus: "+2000 Bonus" },
    { price: 20000, coins: 24000, popular: false, bonus: "+4000 Bonus" },
    { price: 50000, coins: 60000, popular: false, bonus: "+10000 Bonus" },
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchTransactions(storedUserId);
    }
  }, []);

  const fetchTransactions = async (userId) => {
    try {
      setLoadingTx(true);
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();
      
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Transaction fetch failed:", err);
    } finally {
      setLoadingTx(false);
    }
  };

const handleRecharge = async () => {
  if (!userId) {
    alert("User not found. Please log in again.");
    return;
  }

  if (amount < 200) {
    alert("Minimum recharge is ₹200");
    return;
  }

  const referCode = localStorage.getItem("franchise_code")
  const res = await loadRazorpayScript();
  if (!res) {
    alert("Razorpay SDK failed to load.");
    return;
  }

  try {
    setLoading(true);

    const planData = "WalletRecharge";

    const orderRes = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        plan: planData,
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
        name: "Auto GMB User",
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
};

  useEffect(() => {
    setLoading(false);
    setShowSuccess(false);
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "all") return true;
    if (filterType === "credit") return tx.type === "credit" || tx.type === "add";
    if (filterType === "debit") return tx.type === "debit" || tx.type === "subtract";
    return true;
  });
const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-2.5 rounded-xl border border-black/5 bg-white hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tighter leading-none mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                Smart <span className="text-yellow-500">Wallet</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Scale Your Digital Presence</p>
            </div>
          </div>

          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="btn-ghost px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
          >
            <History className="w-4 h-4" />
            Transaction History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Side - Benefits */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 mb-6">
                  <Wallet className="w-7 h-7 text-black" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2" style={{ fontFamily: "var(--font-heading)" }}>Wallet Benefits</h2>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">Maximize Your Growth Potential</p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Instant Activation</h3>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Coins are credited to your secure vault immediately after verification.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Secure Protocol</h3>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Enterprise-grade encryption powered by Razorpay's security stack.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Scale Rewards</h3>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Unlock up to 20% bonus coins on strategic high-volume recharges.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Tooltip */}
            <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-4 h-4 text-yellow-600" />
                <h4 className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">Need Assistance?</h4>
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                Facing issues with your payment? Our technical team is available 24/7 to resolve any wallet concerns.
              </p>
            </div>
          </div>

          {/* Right Side - Recharge Engine */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black/5 rounded-3xl p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-slate-50 rounded-lg border border-black/5">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Select Power-Up</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                {presetAmounts.map((pkg, i) => (
                  <button
                    key={i}
                    onClick={() => setAmount(pkg.price)}
                    className={`relative border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
                      amount === pkg.price
                        ? "border-black bg-black text-yellow-400 shadow-xl shadow-black/10 scale-105"
                        : "border-slate-100 bg-white text-slate-400 hover:border-yellow-400 hover:text-black"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    {pkg.bonus && (
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap border-2 border-white">
                        {pkg.bonus}
                      </span>
                    )}
                    <IndianRupee className="w-5 h-5" />
                    <span className="font-black text-xl leading-none">₹{pkg.price}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{pkg.coins} Coins</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Amount (₹)</label>
                  <div className="relative">
                   
                    <input
                      type="number"
                      min="200"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="input w-full pl-12 py-4 text-lg font-black"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Min: ₹200 • {amount >= 5000 ? "20% Bonus Active" : "1:1 Ratio"}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className="input w-full pl-12 py-4 text-base font-bold uppercase tracking-widest"
                      placeholder="ENTER GST NUMBER"
                      maxLength="15"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 border border-black/5 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-4 h-4 text-black" />
                  <h3 className="text-sm font-black text-black uppercase tracking-widest">Order Summary</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Base Credits</span>
                    <span className="text-black">₹{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>GST (18%)</span>
                    <span className="text-black">₹{gstAmount}</span>
                  </div>
                  <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                    <span className="text-sm font-black text-black uppercase tracking-widest">Total Payable</span>
                    <span className="text-3xl font-black text-black">₹{totalAmount}</span>
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-4 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Deposit</p>
                      <p className="text-lg font-black text-black">{coins} <span className="text-[10px] opacity-40">COINS</span></p>
                    </div>
                  </div>
                  {amount >= 5000 && (
                     <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                       <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">Bonus Applied</p>
                     </div>
                  )}
                </div>

                <button
                  onClick={handleRecharge}
                  disabled={loading}
                  className="btn-lemon w-full py-5 rounded-2xl text-base uppercase font-black tracking-widest shadow-xl hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing Payment...
                    </>
                  ) : (
                    <>
                      Recharge Wallet Now ↗
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-black/5 animate-scaleUp">
            <div className="bg-black p-6 sm:p-8 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <History className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Vault Logs</h2>
                  <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Transaction History</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransactions(false)}
                className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 sm:p-10 flex-1 flex flex-col min-h-0 bg-slate-50/30">
              <div className="flex gap-2 mb-6 p-1 bg-white border border-black/5 rounded-xl shrink-0">
                {["all", "credit", "debit"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterType === type
                        ? "bg-black text-yellow-400 shadow-lg"
                        : "text-slate-400 hover:text-black hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-2">
                {loadingTx ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Reading Vault Records...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-white border border-black/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs found in this sector</p>
                  </div>
                ) : (
                  filteredTransactions?.map((tx, index) => {
                    const isCredit = tx.type === "credit" || tx.type === "add";
                    return (
                      <div
                        key={tx._id || index}
                        className="bg-white border border-black/5 rounded-2xl p-5 hover:border-yellow-400/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isCredit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowUpCircle className="w-5 h-5" />
                              ) : (
                                <ArrowDownCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-black text-xs uppercase tracking-tight truncate">
                                {tx.description || tx.reason || "Wallet Operation"}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(tx?.createdAt || tx?.date)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(tx?.createdAt || tx?.date)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-base leading-none mb-1 ${isCredit ? "text-green-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}₹{tx.amount}
                            </p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                              {tx.coins || tx.amount} COINS
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-10 text-center w-full max-w-md shadow-2xl border border-black/5 animate-scaleUp">
            <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-400/20">
              <CheckCircle className="w-12 h-12 text-black" />
            </div>

            <h2 className="text-2xl font-black text-black uppercase tracking-tighter mb-2" style={{ fontFamily: "var(--font-heading)" }}>Payment Successful</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Vault Balance Synchronized</p>

            <div className="bg-slate-50 border border-black/5 rounded-3xl p-8 mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Credits Added</p>
              <p className="text-4xl font-black text-black mb-4">
                ₹{totalAmount}
              </p>
              <div className="flex items-center justify-center gap-3 text-yellow-600">
                <Coins className="w-5 h-5" />
                <span className="text-lg font-black">{coins} COINS</span>
              </div>
            </div>

            <button 
              onClick={() => router.push("/dashboard")}
              className="btn-lemon w-full py-4 rounded-xl text-xs uppercase font-black tracking-widest"
            >
              Enter Dashboard ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
}