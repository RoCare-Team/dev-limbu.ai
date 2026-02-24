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
    { price: 1, coins: 200, popular: false, bonus: null },
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

  // if (amount < 200) {
  //   alert("Minimum recharge is ₹200");
  //   return;
  // }

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
      theme: { color: "#2563eb" },
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
              platform: "web",   // ✅ FIXED
              plan: "WalletRecharge",
              amount: parseFloat(amount),
              gstAmount: parseFloat(gstAmount),
              totalAmount: parseFloat(totalAmount),
              gstin: gstNumber,
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
        email: "user@example.com",
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
    timeZone: "Asia/Kolkata", // ✅ ADD THIS
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata", // ✅ ADD THIS
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // optional but recommended
  });
};




  const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob-delay-2"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob-delay-4"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-xl shadow-md border border-white/20 text-gray-700 hover:text-dark transition-all hover:shadow-lg"
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Transaction History</span>
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Left Side - Info Card */}
          <div className="space-y-6 lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-8 h-8 text-dark" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-dark  bg-clip-text text-transparent">
                    Wallet Recharge
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Power up your account instantly
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <Zap className="w-5 h-5 text-dark mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-dark">Instant Credit</h3>
                    <p className="text-sm text-dark">
                      Coins added to your wallet immediately after payment
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <Shield className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Secure Payment</h3>
                    <p className="text-sm text-gray-600">
                      Protected by Razorpay's enterprise-grade security
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-gray-800 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Special Offers</h3>
                    <p className="text-sm text-gray-600">
                      Get 20% bonus on ₹5,000+ recharges
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Recharge Form */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8 space-y-6 lg:col-span-2 order-1 lg:order-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-dark" />
                Choose Amount
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {presetAmounts.map((pkg, i) => (
                  <button
                    key={i}
                    onClick={() => setAmount(pkg.price)}
                    className={`relative border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                      amount === pkg.price
                        ? "bg-lightPrimary text-dark border-dark shadow-lg transform scale-105"
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md bg-white"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 -left-2 bg-dark text-primary text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        Popular
                      </span>
                    )}
                    {pkg.bonus && (
                      <span className="absolute -top-2 -right-2 bg-dark text-primary text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        {pkg.bonus}
                      </span>
                    )}
                    <IndianRupee
                      className={`w-6 h-6 ${
                        amount === pkg.price ? "text-dark" : "text-primary"
                      }`}
                    />
                    <span className="font-bold text-xl">₹{pkg.price}</span>
                    <span className="text-xs opacity-90">{pkg.coins} Coins</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-dark" />
                Custom Amount
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark" />
                <input
                  type="number"
                  min="200"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 font-medium text-lg bg-white"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-xs text-dark mt-2 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {amount >= 5000 && "₹1 = 1.2 Coins (20% Bonus) • "}
                {amount < 5000 && "₹1 = 1 Coin • "}
                Minimum recharge: ₹200
              </p>
            </div>

            <div>
              <label className="block text-gray-800 font-semibold mb-3 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-dark" />
                GST Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800 font-medium text-lg bg-white"
                  placeholder="Enter your GSTIN"
                  maxLength="15"
                />
              </div>
            </div>
            {/* Payment Breakdown */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-dark" />
                <h3 className="font-bold text-dark">Payment Breakdown</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-dark">Base Amount</span>
                  <span className="font-semibold text-dark">₹{amount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-semibold text-dark">₹{gstAmount}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-gray-800">Total Amount</span>
                  <span className="text-2xl font-bold bg-primary bg-clip-text text-dark">
                    ₹{totalAmount}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">You'll Receive</span>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-gray-600" />
                      <span className="text-xl font-bold text-dark">{coins} Coins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRecharge}
              disabled={loading}
              className={`w-full flex justify-center items-center gap-3 py-4 rounded-2xl shadow-lg font-bold text-dark text-lg transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary  hover:shadow-xl hover:scale-105"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <IndianRupee className="w-6 h-6" />
                  <span>Pay ₹{totalAmount}</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              By proceeding, you agree to our terms and conditions
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-scale-in">
            <div className="bg-primary p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark rounded-xl flex items-center justify-center shadow-md">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark">Transaction History</h2>
              </div>
              <button
                onClick={() => setShowTransactions(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-dark" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {["all", "credit", "debit"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterType === type
                        ? "bg-dark text-primary shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {loadingTx ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No transactions found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Your transaction history will appear here
                    </p>
                  </div>
                ) : (
                  filteredTransactions?.map((tx, index) => {
                    
                    const isCredit = tx.type === "credit" || tx.type === "add";
                    return (
                      <div
                        key={tx._id || index}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isCredit ? "bg-green-50" : "bg-red-50"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowUpCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <ArrowDownCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {tx.description || (isCredit ? tx.reason : tx.reason)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(tx?.createdAt || tx?.date)}</span>
                                <Clock className="w-3 h-3 ml-1" />
                                <span>{formatTime(tx?.createdAt || tx?.date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold text-lg ${
                                isCredit ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isCredit ? "+" : "-"}₹{tx.amount}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx.coins || tx.amount} Coins
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center w-full max-w-md animate-scale-in">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-in">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Payment Successful! 🎉
            </h2>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-600 mb-2">Total Paid</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ₹{totalAmount}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-green-600">
                <Coins className="w-5 h-5" />
                <span className="font-semibold">{coins} Coins Added</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              Transaction recorded successfully
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-blob-delay-2 {
          animation: blob 7s infinite 2s;
        }
        .animate-blob-delay-4 {
          animation: blob 7s infinite 4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.4s ease-out;
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #a855f7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #9333ea);
        }
      `}</style>
    </div>
  );
}