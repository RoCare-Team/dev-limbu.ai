"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

const PROFIT_CALCULATIONS = {
  starter: { investment: 50000 },
  standard: { investment: 100000 },
  premium: { investment: 500000 },
  master: { investment: 2000000 },
};

const MAX_PAYMENT = 495000;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.onload = () => resolve(true);
      existing.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function parseCityName(rawParam) {
  if (!rawParam) return "";

  const prefix = "franchise-opportunities-";
  if (rawParam === "franchise-opportunities") {
    return "";
  }

  const slug = rawParam.startsWith(prefix)
    ? rawParam.slice(prefix.length)
    : rawParam;

  if (!slug.trim()) {
    return "";
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FranchisePageClient({
  params,
  cityName,
  autoOpenPlan = "premium",
  onClose,
}) {
  const rawParam = params?.slug ?? "";
  const resolvedCityName = cityName || parseCityName(rawParam);

  // Ye component ab sirf tab mount hota hai jab user CTA dabata hai
  // (dekho FranchiseApplyTrigger), isliye form shuru se hi khula rehta hai.
  const [selectedPlan, setSelectedPlan] = useState(autoOpenPlan);
  const [showForm, setShowForm] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const [createdFranchiseId, setCreatedFranchiseId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: resolvedCityName || "",
    gstNumber: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(null);

  const investmentAmount = PROFIT_CALCULATIONS[selectedPlan]?.investment ?? 0;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;
  const paymentParts =
    totalAmount > MAX_PAYMENT
      ? [MAX_PAYMENT, totalAmount - MAX_PAYMENT]
      : [totalAmount];

  const getRecordTotalAmount = (record) => {
    const recordTotal = Number(record?.totalAmount);
    if (recordTotal > 0) return recordTotal;

    const recordInvestment = Number(record?.investment);
    if (recordInvestment > 0) {
      return recordInvestment + Math.round(recordInvestment * 0.18);
    }

    return totalAmount;
  };

  const getPaidAmount = (record) =>
    (record?.payments || [])
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleOpenForm = async (plan = null) => {
    const resolvedPlan = plan || selectedPlan;
    setSelectedPlan(resolvedPlan);
    setShowForm(true);
    setFormSubmitted(false);
    setRemainingAmount(null);

    const pendingId = localStorage.getItem("pendingFranchiseId");
    if (pendingId) {
      try {
        const dbRes = await fetch(`/api/franchise?id=${pendingId}`);
        const dbData = await dbRes.json();

        if (dbRes.ok && dbData.success) {
          const record = dbData.data;

          if (record.status === "paid") {
            localStorage.removeItem("pendingFranchiseId");
          } else if (record.status === "partial_paid") {
            const recordTotal = getRecordTotalAmount(record);
            const paidSoFar = getPaidAmount(record);
            const remaining = recordTotal - paidSoFar;

            if (remaining > 0) {
              setCreatedFranchiseId(record._id);
              setRemainingAmount(remaining);
              setServiceForm({
                name: record.name || "",
                phone: record.phone || "",
                email: record.email || "",
                city: record.city || resolvedCityName || "",
                gstNumber: record.gstNumber || "",
              });
              setFormStep(2);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Pending check failed:", err);
      }
    }

    setFormStep(1);
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const res = await fetch(`/api/auth/signup?userId=${userId}`);
        const data = await res.json();
        if (data && !data.error) {
          setServiceForm((prev) => ({
            ...prev,
            name: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            gstNumber: data.GstNumber || "",
            city: data.city || resolvedCityName || prev.city,
          }));
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();

    if (
      !serviceForm.name ||
      !serviceForm.phone ||
      !serviceForm.email ||
      !serviceForm.city
    ) {
      alert("Please fill all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/franchise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serviceForm,
          plan: selectedPlan,
          investment: investmentAmount,
          totalAmount: totalAmount,
          status: "pending",
          leadType: "Website",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newId = data.data._id;
        setCreatedFranchiseId(newId);
        localStorage.setItem("pendingFranchiseId", newId);
        setFormStep(2);
      } else {
        alert(data.message || "Something went wrong saving your details.");
      }
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to submit details. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleServicePayment = async (franchiseIdOverride = null) => {
    setIsLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load.");
        setIsLoading(false);
        return;
      }

      const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID;
      if (!RAZORPAY_KEY) {
        alert("Payment configuration missing");
        setIsLoading(false);
        return;
      }

      const franchiseId =
        franchiseIdOverride ||
        createdFranchiseId ||
        localStorage.getItem("pendingFranchiseId");

      if (!franchiseId) {
        alert("Session expired. Please fill the form again.");
        setIsLoading(false);
        return;
      }

      const dbRes = await fetch(`/api/franchise?id=${franchiseId}`);
      const dbData = await dbRes.json();

      if (!dbRes.ok || !dbData.success) {
        alert("Could not fetch your application. Please try again.");
        setIsLoading(false);
        return;
      }

      const franchiseRecord = dbData.data;
      const franchiseTotal = getRecordTotalAmount(franchiseRecord);
      const paidSoFar = getPaidAmount(franchiseRecord);
      const remaining = franchiseTotal - paidSoFar;

      if (!franchiseTotal || isNaN(franchiseTotal) || franchiseTotal <= 0) {
        alert("Invalid franchise payment record. Please fill the form again.");
        localStorage.removeItem("pendingFranchiseId");
        setCreatedFranchiseId(null);
        setFormStep(1);
        setIsLoading(false);
        return;
      }

      if (!remaining || isNaN(remaining) || remaining <= 0) {
        alert("Payment already completed or invalid record!");
        localStorage.removeItem("pendingFranchiseId");
        setIsLoading(false);
        return;
      }

      const isFirstPayment = paidSoFar === 0;
      const firstInstallmentAmount = Math.min(franchiseTotal, MAX_PAYMENT);
      const amountToPay = isFirstPayment ? firstInstallmentAmount : remaining;
      const installmentNumber = isFirstPayment ? 1 : 2;
      const isLastPayment = amountToPay >= remaining;

      const openPayment = async (amount, instNum, isLast) => {
        const safeAmount = Number(amount);
        if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
          throw new Error(`Invalid payment amount: ${amount}`);
        }

        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan,
            amount: safeAmount,
            receipt: `fr_${Date.now()}_${instNum}`,
            notes: {
              plan_name: selectedPlan,
              user_email: serviceForm.email || franchiseRecord?.email || "",
              installment: String(instNum),
            },
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok || !orderData.order) {
          throw new Error(orderData.error || "Failed to create order");
        }

        return new Promise((resolve, reject) => {
          const options = {
            key: RAZORPAY_KEY,
            amount: orderData.order.amount,
            currency: orderData.order.currency,
            name: "Limbu.ai Franchise",
            description:
              franchiseTotal > MAX_PAYMENT
                ? `Installment ${instNum} Payment`
                : `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan Franchise Fee`,
            order_id: orderData.order.id,
            prefill: {
              name: serviceForm.name || franchiseRecord?.name || "",
              email: serviceForm.email || franchiseRecord?.email || "",
              contact: serviceForm.phone || franchiseRecord?.phone || "",
            },
            theme: { color: "#eab308" },
            handler: async function (response) {
              try {
                const submitRes = await fetch("/api/franchise", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: franchiseId,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    amount: safeAmount,
                    installment: instNum,
                    status: isLast ? "paid" : "partial_paid",
                  }),
                });

                const submitData = await submitRes.json();

                if (!submitRes.ok) {
                  throw new Error(
                    submitData.message || "Failed to update payment",
                  );
                }

                resolve(submitData.data);
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment popup closed")),
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.on("payment.failed", (r) => reject(r.error));
          razorpay.open();
        });
      };

      const updatedFranchise = await openPayment(
        amountToPay,
        installmentNumber,
        isLastPayment,
      );

      if (isFirstPayment && franchiseTotal > MAX_PAYMENT) {
        const newRemaining =
          getRecordTotalAmount(updatedFranchise) -
          getPaidAmount(updatedFranchise);

        if (newRemaining > 0) {
          alert(
            `First payment successful!\n\nYour remaining installment is ₹${newRemaining.toLocaleString()}. You can complete it when you return.`,
          );
          setRemainingAmount(newRemaining);
          setFormStep(2);
          return;
        }
      }

      localStorage.removeItem("pendingFranchiseId");
      setFormSubmitted(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSubmitted(false);
        setFormStep(1);
        setCreatedFranchiseId(null);
        setServiceForm({
          name: "",
          phone: "",
          email: "",
          city: resolvedCityName ?? "",
          gstNumber: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Payment Error:", error);
      alert(error?.description || error?.message || "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Mount hote hi wahi plan khol do jis CTA par click hua tha, aur pending
  // application (agar koi hai) DB se prefill kar lo.
  useEffect(() => {
    handleOpenForm(autoOpenPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form band hone par parent ko batao taaki poora chunk unmount ho jaye.
  useEffect(() => {
    if (!showForm) onClose?.();
  }, [showForm, onClose]);

  if (!showForm) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-black/5 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <button
          onClick={() => setShowForm(false)}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 bg-white border border-black/5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-50 transition-all z-20 shadow-sm"
          aria-label="Close"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="overflow-y-auto custom-scroll relative z-10 flex-1">
          {!formSubmitted ? (
            <div>
              <div className="p-6 sm:p-8 text-center border-b border-black/5 bg-slate-50/50 pt-10 sm:pt-8 relative">
                {formStep === 2 && (
                  <button
                    onClick={() => {
                      if (remainingAmount !== null) {
                        setShowForm(false);
                      } else {
                        setFormStep(1);
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-full transition-all"
                  >
                    <X className="w-4 h-4 rotate-45 sm:w-5 sm:h-5 text-slate-500" />
                  </button>
                )}

                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-sm border border-lemon-glow/20 bg-lemon-glow/10">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-lemon-hover" />
                  <span className="text-[10px] font-black uppercase text-lemon-ink tracking-widest">
                    {formStep === 1
                      ? "Step 1: Your Details"
                      : remainingAmount !== null
                      ? "Complete Your Payment"
                      : "Step 2: Payment Summary"}
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl font-black text-black uppercase tracking-normal leading-tight mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {resolvedCityName
                    ? `${resolvedCityName} Partner Application`
                    : "Partner Application"}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  {remainingAmount !== null
                    ? "Complete your pending installment to activate franchise"
                    : "Initialize your AI business deployment today"}
                </p>
              </div>

              {formStep === 1 ? (
                <form
                  onSubmit={handleProceedToPayment}
                  className="p-6 sm:p-8 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={serviceForm.phone}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                        placeholder="Enter 10-digit mobile number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={serviceForm.email}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                        Your City
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceForm.city}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                        placeholder="Which city are you from?"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={serviceForm.gstNumber}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            gstNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-lemon-glow transition-all"
                        placeholder="Enter GST number if you have one"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-lemon w-full py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? "Saving Details..." : "Proceed to Next ↗"}
                  </button>
                </form>
              ) : (
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-inner">
                    {remainingAmount !== null ? (
                      <>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-green-600 uppercase tracking-widest">
                          <span>✓ Installment 1 Paid:</span>
                          <span>₹{(totalAmount - remainingAmount).toLocaleString()}</span>
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                              Remaining (Installment 2):
                            </span>
                            <span className="text-lg sm:text-xl font-black text-lemon-ink tracking-tight">
                              ₹{remainingAmount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Pay this to complete your franchise activation
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <span>Franchise Fee:</span>
                          <span className="text-black">₹{investmentAmount.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <span>GST (18%):</span>
                          <span className="text-black">₹{gstAmount.toLocaleString()}</span>
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                              Total Amount:
                            </span>
                            <span className="text-lg sm:text-xl font-black text-lemon-ink tracking-tight">
                              ₹{totalAmount.toLocaleString()}
                            </span>
                          </div>

                          {paymentParts.length > 1 && (
                            <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 space-y-3">
                              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-700">
                                Payment will be processed in 2 installments
                              </div>
                              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                <span>Installment 1</span>
                                <span>₹{paymentParts[0].toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                <span>Installment 2</span>
                                <span>₹{paymentParts[1].toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleServicePayment()}
                    disabled={isLoading}
                    className="btn-lemon w-full py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading
                      ? "Processing..."
                      : remainingAmount !== null
                      ? `Pay ₹${remainingAmount.toLocaleString()} to Complete ↗`
                      : paymentParts.length > 1
                      ? "Pay Installment 1 ↗"
                      : "Pay Now ↗"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 sm:p-16 text-center flex flex-col justify-center min-h-[400px]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce shadow-sm">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3
                className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Application Received
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Our deployment team will reach out within 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
