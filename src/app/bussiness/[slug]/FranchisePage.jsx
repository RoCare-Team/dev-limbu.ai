"use client";

import BookDemoModal from "@/components/modals/BookDemoModal";
import FooterSection from "@/components/sections/FooterSection";
import Navbar from "@/components/sections/HeaderSection";
import ScrollToTop from "@/components/ui/ScrollToTop";
import {
  ArrowRight,
  CheckCircle,
  Star,
  PhoneCall,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Shield,
  Zap,
  BarChart,
  Target,
  Rocket,
  Clock,
  X,
  Mail as MailIcon,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { mostCities, POPULAR_CITIES } from "@/utils/popularCity";

// ✅ Moved OUTSIDE component so it's never undefined
const PROFIT_CALCULATIONS = {
  starter: { investment: 50000 },
  standard: { investment: 100000 },
  premium: { investment: 500000 },
};

const SITE_URL = "https://limbu.ai";

// ✅ Fixed: checks if script already loaded before injecting again
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

// ✅ Helper: extract and format city name from URL param
// e.g. "franchise-opportunities-new-delhi" → "New Delhi"
function parseCityName(rawParam) {
  if (!rawParam) return "";

  const prefix = "franchise-opportunities-";

  // If slug is exactly "franchise-opportunities"
  // then no city exists
  if (rawParam === "franchise-opportunities") {
    return "";
  }

  const slug = rawParam.startsWith(prefix)
    ? rawParam.slice(prefix.length)
    : rawParam;

  // Extra safety check
  if (!slug.trim()) {
    return "";
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function createFranchiseCitySlug(city) {
  return `franchise-opportunities-${city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}
const popularCities = POPULAR_CITIES;

const partners = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  label: `Partner ${i + 1}`,
}));

const features = [
  { icon: "⚡", title: "Flexible & Scalable", sub: "Start small, grow big" },
  { icon: "∞", title: "Unlimited Users", sub: "No per-seat charges" },
  { icon: "🤝", title: "Up to 10 Partners", sub: "Grow your network" },
  { icon: "🏪", title: "Full Franchise Rights", sub: "Own your territory" },
];

// All coordinates in a 500x500 viewBox — fully scalable
const VB = 500;
const CX = 250,
  CY = 250;
const ORBIT_R = 185;
const INNER_R = 105;
const SLOT_R = 34;

function OrbitDiagram() {
  const slots = partners.map((p, i) => {
    const angle = (2 * Math.PI * i) / partners.length - Math.PI / 2;
    return {
      ...p,
      x: CX + ORBIT_R * Math.cos(angle),
      y: CY + ORBIT_R * Math.sin(angle),
      lx1: CX + (ORBIT_R - SLOT_R - 4) * Math.cos(angle),
      ly1: CY + (ORBIT_R - SLOT_R - 4) * Math.sin(angle),
      lx2: CX + (INNER_R + 4) * Math.cos(angle),
      ly2: CY + (INNER_R + 4) * Math.sin(angle),
    };
  });

  return (
    <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Dashed connector lines */}
        {slots.map((s) => (
          <line
            key={`line-${s.id}`}
            x1={s.lx1}
            y1={s.ly1}
            x2={s.lx2}
            y2={s.ly2}
            stroke="#FCD34D"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
        ))}

        {/* Center glow ring */}
        <circle cx={CX} cy={CY} r={INNER_R + 14} fill="#FEF9EC" />

        {/* Center circle border */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="#FFFBEB"
          stroke="#FBBF24"
          strokeWidth="4"
        />

        {/* Center text */}
        <text
          x={CX}
          y={CY - 30}
          textAnchor="middle"
          fontSize="11"
          fill="#92400E"
          fontFamily="sans-serif"
          letterSpacing="1.5"
        >
          FRANCHISE LICENCE
        </text>
        <text
          x={CX}
          y={CY + 2}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#111827"
          fontFamily="sans-serif"
        >
          ₹5,00,000
        </text>
        <text
          x={CX}
          y={CY + 24}
          textAnchor="middle"
          fontSize="11"
          fill="#B45309"
          fontFamily="sans-serif"
        >
          Add up to 10 partners
        </text>
        <text
          x={CX}
          y={CY + 40}
          textAnchor="middle"
          fontSize="11"
          fill="#B45309"
          fontFamily="sans-serif"
        >
          &amp; unlimited users
        </text>

        {/* Partner slots */}
        {slots.map((s) => (
          <g key={`slot-${s.id}`}>
            <circle
              cx={s.x}
              cy={s.y}
              r={SLOT_R}
              fill="#FEF3C7"
              stroke="#FDE68A"
              strokeWidth="2"
            />
            <circle
              cx={s.x}
              cy={s.y - 7}
              r="5.5"
              fill="none"
              stroke="#D97706"
              strokeWidth="1.6"
            />
            <path
              d={`M${s.x - 8} ${s.y + 10} q8-9 16 0`}
              fill="none"
              stroke="#D97706"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <text
              x={s.x}
              y={s.y + 28}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#78350F"
              fontFamily="sans-serif"
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function FranchisePage() {
  // ✅ Read city name from URL param
  const params = useParams();

  // folder is [slug]
  const rawParam = params?.slug ?? "";
  const cityName = parseCityName(rawParam);

  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [createdFranchiseId, setCreatedFranchiseId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: cityName ?? "",
    gstNumber: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(null); // ← NEW: returning user ke liye

  const investmentAmount = PROFIT_CALCULATIONS[selectedPlan]?.investment ?? 0;
  const gstAmount = Math.round(investmentAmount * 0.18);
  const totalAmount = investmentAmount + gstAmount;
  const MAX_PAYMENT = 495000;
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
    setRemainingAmount(null); // reset

    // ── Returning user: pehle se pending installment hai? ──
    const pendingId = localStorage.getItem("pendingFranchiseId");
    if (pendingId) {
      try {
        const dbRes = await fetch(`/api/franchise?id=${pendingId}`);
        const dbData = await dbRes.json();

        if (dbRes.ok && dbData.success) {
          const record = dbData.data;

          // Fully paid — cleanup karo
          if (record.status === "paid") {
            localStorage.removeItem("pendingFranchiseId");
          }
          // Partial paid — seedha Step 2 pe bhejo
          else if (record.status === "partial_paid") {
            const recordTotal = getRecordTotalAmount(record);
            const paidSoFar = getPaidAmount(record);
            const remaining = recordTotal - paidSoFar;

            if (remaining > 0) {
              setCreatedFranchiseId(record._id);
              setRemainingAmount(remaining); // ← sirf yahi dikhega Step 2 mein
              setServiceForm({
                name: record.name || "",
                phone: record.phone || "",
                email: record.email || "",
                city: record.city || cityName || "",
                gstNumber: record.gstNumber || "",
              });
              setFormStep(2);
              return; // form fill skip
            }
          }
        }
      } catch (err) {
        console.error("Pending check failed:", err);
      }
    }

    // ── Fresh user ──
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
            city: data.city || cityName || prev.city,
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
          totalAmount: totalAmount, // ← FIX 1: DB mein save hoga remaining ke liye
          status: "pending",
          leadType: "Website",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const newId = data.data._id;
        setCreatedFranchiseId(newId);
        localStorage.setItem("pendingFranchiseId", newId); // ← FIX 2: returning user ke liye
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

  // In handleServicePayment, update the handler callback to track paid amount
  // and calculate remaining before installment 2

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

      // ── STEP 1: Fetch current DB state ──
      // Use saved ID from state OR localStorage (returning user case)
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

      // ── STEP 2: Calculate what's already paid ──
      const franchiseTotal = getRecordTotalAmount(franchiseRecord);
      const paidSoFar = getPaidAmount(franchiseRecord);
      const remaining = franchiseTotal - paidSoFar;

      // ← SIRF YEH LINE REPLACE KARO
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

      // ── STEP 3: Figure out which installment we're on ──
      const isFirstPayment = paidSoFar === 0;
      const firstInstallmentAmount = Math.min(franchiseTotal, 495000);
      const amountToPay = isFirstPayment ? firstInstallmentAmount : remaining;
      const installmentNumber = isFirstPayment ? 1 : 2;
      const isLastPayment = amountToPay >= remaining;



     
      // ── STEP 4: Open Razorpay ──
      const openPayment = async (amount, instNum, isLast) => {
        // ── Guard: amount valid hona chahiye ──
        const safeAmount = Number(amount);
        if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
          throw new Error(`Invalid payment amount: ${amount}`);
        }

        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan,
            amount: safeAmount, // ← Number guaranteed
            receipt: `fr_${Date.now()}_${instNum}`, // ← short: max ~22 chars (Razorpay limit 40)
            notes: {
              plan_name: selectedPlan,
              user_email: serviceForm.email || franchiseRecord?.email || "",
              installment: String(instNum), // ← notes mein string hona chahiye
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
              franchiseTotal > 495000
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
                    amount: safeAmount, // ← safeAmount use karo
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

      // ── STEP 5: Pay ──
      const updatedFranchise = await openPayment(
        amountToPay,
        installmentNumber,
        isLastPayment,
      );

      // ── STEP 6: If installment 1 done & installment 2 pending, open it ──
      if (isFirstPayment && franchiseTotal > 495000) {
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

      // ── STEP 7: Success ──
      localStorage.removeItem("pendingFranchiseId"); // cleanup
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
          city: cityName ?? "",
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




  return (
    <div
      className="relative w-full overflow-hidden m-0 p-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* =================== APPLICATION FORM MODAL =================== */}
      {showForm && (
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
                  {/* ── Modal Header ── */}
                  <div className="p-6 sm:p-8 text-center border-b border-black/5 bg-slate-50/50 pt-10 sm:pt-8 relative">
                    {formStep === 2 && (
                      <button
                        onClick={() => {
                          // Returning user ko Step 1 pe mat bhejo — sirf fresh user ke liye
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
                      <span className="text-[10px] font-black uppercase text-lemon-hover tracking-widest">
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
                      {cityName
                        ? `${cityName} Partner Application`
                        : "Partner Application"}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      {remainingAmount !== null
                        ? "Complete your pending installment to activate franchise"
                        : "Initialize your AI business deployment today"}
                    </p>
                  </div>

                  {/* ── Step 1: Form ── */}
                  {formStep === 1 ? (
                    <form
                      onSubmit={handleProceedToPayment}
                      className="p-6 sm:p-8 space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                            GST Number (Optional)
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
                    /* ── Step 2: Payment Summary ── */
                    <div className="p-6 sm:p-8 space-y-5">
                      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-inner">
                        {remainingAmount !== null ? (
                          /* ── Returning user: installment 1 paid, sirf remaining dikhao ── */
                          <>
                            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-green-600 uppercase tracking-widest">
                              <span>✓ Installment 1 Paid:</span>
                              <span>
                                ₹
                                {(
                                  totalAmount - remainingAmount
                                ).toLocaleString()}
                              </span>
                            </div>

                            <div className="border-t border-slate-200 pt-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                                  Remaining (Installment 2):
                                </span>
                                <span className="text-lg sm:text-xl font-black text-lemon-hover tracking-tight">
                                  ₹{remainingAmount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Pay this to complete your franchise activation
                              </p>
                            </div>
                          </>
                        ) : (
                          /* ── Fresh user: poora breakdown ── */
                          <>
                            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span>Franchise Fee:</span>
                              <span className="text-black">
                                ₹{investmentAmount.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span>GST (18%):</span>
                              <span className="text-black">
                                ₹{gstAmount.toLocaleString()}
                              </span>
                            </div>

                            <div className="border-t border-slate-200 pt-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                                  Total Amount:
                                </span>
                                <span className="text-lg sm:text-xl font-black text-lemon-hover tracking-tight">
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
                                    <span>
                                      ₹{paymentParts[0].toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                    <span>Installment 2</span>
                                    <span>
                                      ₹{paymentParts[1].toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* ── Pay Button ── */}
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
                /* ── Success Screen ── */
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
      )}

      {/* =================== HERO SECTION =================== */}
      <section className="relative w-full overflow-hidden py-14 sm:py-24 px-6">
        {/* Background Glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] z-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top right, var(--lemon-glow) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* ================= LEFT CONTENT ================= */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-lemon-glow/20 bg-lemon-glow/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />

                <span className="text-[10px] font-black tracking-widest uppercase text-lemon-hover">
                  {cityName
                    ? `${cityName} Franchise Portal Active`
                    : "Franchise Portal Active"}
                </span>
              </div>

              {/* Heading */}
              <h1
                className="uppercase leading-[1.1] tracking-tight text-black font-black"
                style={{
                  fontSize: "clamp(1.7rem, 3.8vw, 3.1rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Build Your Own <br />
                <span className={cityName ? "text-black" : "text-lemon-hover"}>
                  AI Business Empire{" "}
                  {cityName && (
                    <>
                      In <span className="text-lemon-hover">{cityName}</span>
                    </>
                  )}
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-4 text-sm md:text-lg text-slate-500 max-w-xl leading-relaxed font-bold uppercase tracking-widest opacity-90">
                {cityName
                  ? `India's #1 AI-Powered Google My Business Infrastructure in ${cityName}.`
                  : "India's #1 AI-Powered Google My Business Infrastructure."}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                {[
                  { val: "₹2.5L+", label: "Monthly Target" },
                  { val: "100%", label: "Recurring Model" },
                  { val: "Zero", label: "Technical Overhead" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="text-2xl font-black text-black tracking-tighter mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {stat.val}
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-10">
                <button
                  onClick={() => handleOpenForm("premium")}
                  className="btn-lemon px-10 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  {cityName ? `Apply Now For ${cityName}` : "Apply Now"}

                  <ArrowRight size={16} className="ml-2 inline" />
                </button>
              </div>
            </div>

            {/* ================= RIGHT IMAGE ================= */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Glow */}
              <div className="absolute inset-0 bg-lemon-glow/20 blur-3xl rounded-full scale-90" />

              {/* Image Card */}
              <div className="relative rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white p-3 max-w-[600px]">
                <Image
                  src="/images/frenchiese-image.png"
                  alt="AI Business Franchise"
                  width={700}
                  height={700}
                  className="w-full h-full object-cover rounded-[24px]"
                  priority
                />

                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl px-5 py-4">
                  <div className="text-2xl font-black text-black leading-none">
                    250+
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mt-1">
                    Businesses Scaled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== TRUST SIGNALS =================== */}
      <section className="py-8 sm:py-10 border-y border-slate-200 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Optional Heading */}
          <div className="text-center mb-8">
            <h2
              className="uppercase font-black tracking-tight text-black"
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.7rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Trusted Across{" "}
              {cityName ? (
                <span className="text-lemon-hover">{cityName}</span>
              ) : (
                "India"
              )}
            </h2>

            <p className="mt-2 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">
              Fast Growing AI Business Franchise Network
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: "1000+", label: "Happy Partners" },
              { value: "50+", label: "Cities Covered" },
              { value: "98%", label: "Success Rate" },
              { value: "4.9/5", label: "User Rating" },
            ].map((item, i) => (
              <div
                key={i}
                className="group rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm px-5 py-6 text-center shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.value}
                </div>

                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black group-hover:text-lemon-hover transition-colors">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== ARCHITECTURE =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-hover text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Why Choose Us
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              The Limbu AI{" "}
              {cityName ? (
                <span className="text-lemon-hover">{cityName}</span>
              ) : null}{" "}
              Advantage
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Powerful AI infrastructure designed for scalable local business
              growth
            </p>
          </div>

          {/* ================= CARDS ================= */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Fully Automated",
                desc: "Our AI handles posting, reviews, optimization, and reporting automatically.",
              },
              {
                icon: Users,
                title: "Easy Management",
                desc: cityName
                  ? `Manage all your ${cityName} business clients from one dashboard.`
                  : "Manage all your business clients from one dashboard.",
              },
              {
                icon: Star,
                title: "Review Automation",
                desc: "Automatically monitor and reply to customer reviews with AI.",
              },
              {
                icon: BarChart,
                title: "Smart Reports",
                desc: "Track rankings, calls, traffic, and lead growth with simple analytics.",
              },
              {
                icon: Target,
                title: "More Leads",
                desc: cityName
                  ? `Convert ${cityName} search traffic into paying customers.`
                  : "Convert online traffic into paying customers.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Protected with encrypted systems, cloud backups, and 24/7 monitoring.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Icon */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-black transition-all duration-300">
                  <item.icon className="w-6 h-6 text-black group-hover:text-lemon-glow transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3
                    className="text-lg font-black uppercase tracking-tight text-black mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    {cityName &&
                    (item.title === "Easy Management" ||
                      item.title === "More Leads") ? (
                      <>
                        {item.title === "Easy Management" ? (
                          <>
                            Manage all your{" "}
                            <span className="text-lemon-hover">{cityName}</span>{" "}
                            business clients from one dashboard.
                          </>
                        ) : (
                          <>
                            Convert{" "}
                            <span className="text-lemon-hover">{cityName}</span>{" "}
                            search traffic into paying customers.
                          </>
                        )}
                      </>
                    ) : (
                      item.desc
                    )}
                  </p>
                </div>

                {/* Bottom Border Animation */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHY JOIN =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-hover text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Franchise Benefits
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {cityName ? (
                <>
                  <span className="text-lemon-hover">{cityName}</span> Franchise
                  Benefits
                </>
              ) : (
                "Franchise Benefits"
              )}
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Build a scalable AI-powered business with recurring revenue and
              exclusive market opportunities
            </p>
          </div>

          {/* ================= BENEFITS GRID ================= */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Rocket,
                title: "Growing Market",
                desc: cityName
                  ? `Every local business in ${cityName} needs online visibility today.`
                  : "Every local business needs online visibility today.",
              },
              {
                icon: DollarSign,
                title: "Recurring Income",
                desc: "Generate predictable monthly revenue from active clients.",
              },
              {
                icon: Shield,
                title: "Proven System",
                desc: "Operate with a tested business model and complete training support.",
              },
              {
                icon: Users,
                title: "Massive Demand",
                desc: cityName
                  ? `Thousands of businesses in ${cityName} need these services.`
                  : "Thousands of businesses need these services.",
              },
              {
                icon: Zap,
                title: "AI Automation",
                desc: "Our AI platform handles most of the operational workload for you.",
              },
              {
                icon: Award,
                title: "Exclusive Territory",
                desc: cityName
                  ? `Get exclusive operating rights in ${cityName}.`
                  : "Get exclusive operating rights in your territory.",
              },
              {
                icon: TrendingUp,
                title: "High Margins",
                desc: "Keep strong profit margins with scalable recurring services.",
              },
              {
                icon: Clock,
                title: "Remote Friendly",
                desc: "Run and manage your business from anywhere with internet access.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Icon */}
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-black transition-all duration-300">
                  <item.icon className="w-6 h-6 text-black group-hover:text-lemon-glow transition-colors duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3
                    className="text-base sm:text-lg font-black uppercase tracking-tight text-black mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    {cityName &&
                    (item.title === "Growing Market" ||
                      item.title === "Massive Demand" ||
                      item.title === "Exclusive Territory") ? (
                      <>
                        {item.title === "Growing Market" && (
                          <>
                            Every local business in{" "}
                            <span className="text-lemon-hover">{cityName}</span>{" "}
                            needs online visibility today.
                          </>
                        )}

                        {item.title === "Massive Demand" && (
                          <>
                            Thousands of businesses in{" "}
                            <span className="text-lemon-hover">{cityName}</span>{" "}
                            need these services.
                          </>
                        )}

                        {item.title === "Exclusive Territory" && (
                          <>
                            Get exclusive operating rights in{" "}
                            <span className="text-lemon-hover">{cityName}</span>
                            .
                          </>
                        )}
                      </>
                    ) : (
                      item.desc
                    )}
                  </p>
                </div>

                {/* Bottom Border Animation */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== POPULAR CITIES =================== */}
      <section className="relative py-8 sm:py-8 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-lemon-hover text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                Popular Cities
              </p>
              <h2
                className="font-black uppercase tracking-tight leading-tight text-black"
                style={{
                  fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", // Reduced font size
                  fontFamily: "var(--font-heading)",
                }}
              >
                Explore Franchise{" "}
                <span className="text-lemon-hover">Opportunities</span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md leading-relaxed">
              Select a city to view local franchise details and application
              steps.
            </p>
          </div>

          {/* Updated Grid: More compact cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mostCities.map((city) => {
              const citySlug = createFranchiseCitySlug(city);
              const isActiveCity =
                cityName?.toLowerCase() === city.toLowerCase();

              return (
                <Link
                  key={city}
                  href={`/bussiness/${citySlug}`}
                  className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 ${
                    isActiveCity
                      ? "border-lemon-hover bg-lemon-glow/10 shadow-sm"
                      : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-lemon-hover hover:shadow-md"
                  }`}
                  aria-current={isActiveCity ? "page" : undefined}
                >
                  <span className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 group-hover:text-black transition-colors">
                    {city}
                  </span>

                  <ArrowRight
                    size={14}
                    className={`shrink-0 transition-all duration-300 ${
                      isActiveCity
                        ? "text-lemon-hover"
                        : "text-slate-300 group-hover:text-lemon-hover group-hover:translate-x-1"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================== ORBIT DIAGRAM SECTION =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main Container */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm p-6 sm:p-10 lg:p-14">
            {/* Top Badge */}
            <div className="flex justify-center mb-5">
              <span className="bg-lemon-glow/15 text-lemon-hover text-[10px] sm:text-xs font-black px-5 py-2 rounded-full uppercase tracking-[0.28em] border border-lemon-glow/20">
                Franchise Licence
              </span>
            </div>

            {/* Heading */}
            <div className="text-center mb-10">
              <h2
                className="font-black tracking-tight leading-[1.1] text-black"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {cityName ? (
                  <>
                    <span className="text-lemon-hover">{cityName}</span> Smarter
                    Businesses,
                  </>
                ) : (
                  "Smarter Businesses,"
                )}

                <br />

                <span className="text-black">Stronger Futures.</span>
              </h2>

              <p className="mt-5 text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto">
                Flexible and scalable AI-powered infrastructure designed for
                long-term franchise growth and operational simplicity.
                {cityName ? (
                  <>
                    {" "}
                    Built specifically for{" "}
                    <span className="text-lemon-hover">{cityName}</span>{" "}
                    businesses.
                  </>
                ) : null}
              </p>
            </div>

            {/* Orbit Diagram */}
            <div className="mb-8">
              <OrbitDiagram />
            </div>

            {/* Pricing Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
              {/* Glow Effect */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-lemon-glow/10 blur-3xl rounded-full" />

              {/* Small Text */}
              <div className="text-center text-[10px] sm:text-xs uppercase tracking-[0.28em] text-slate-400 font-black mb-8 relative z-10">
                Partner Slots Included (10 Active Accounts)
              </div>

              {/* Price */}
              <div className="relative z-10 text-center mb-8">
                <div
                  className="text-5xl font-black text-black tracking-tighter mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  ₹5,00,000
                </div>

                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  + 18% GST • One-Time Fee
                </div>
              </div>

              {/* Revenue Stats */}
              <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Your Share
                  </p>

                  <p className="text-sm font-black text-black">50% Revenue</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Earning Potential
                  </p>

                  <p className="text-sm font-black text-black">₹1-3L / Month</p>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/60 p-6 text-center hover:bg-white hover:shadow-xl hover:border-lemon-hover/40 transition-all duration-500"
                  >
                    {/* Hover Glow */}
                    <div className="absolute -top-14 -right-14 w-32 h-32 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Icon */}
                    <div className="relative z-10 text-3xl mb-4">{f.icon}</div>

                    {/* Title */}
                    <h3
                      className="relative z-10 text-sm sm:text-base font-black text-black mb-2 tracking-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {f.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="relative z-10 text-xs text-slate-500 font-bold leading-relaxed">
                      {f.sub}
                    </p>

                    {/* Bottom Line */}
                    <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
                  </div>
                ))}

                <div className="col-span-2 lg:col-span-4 flex justify-center mt-4">
                  <button
                    onClick={() => handleOpenForm("premium")}
                    className="btn-lemon px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Choose This Plan ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FAQ =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* ================= HEADER ================= */}
          <div className="text-center mb-14">
            <p className="text-lemon-hover text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] mb-4">
              Support & Help
            </p>

            <h2
              className="font-black uppercase tracking-tight leading-[1.1] text-black"
              style={{
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Frequently Asked{" "}
              <span className="text-lemon-hover">Questions</span>
            </h2>

            <p className="mt-4 text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.22em] max-w-2xl mx-auto">
              Everything you need to know before starting your AI franchise
              business
            </p>
          </div>

          {/* ================= FAQ LIST ================= */}
          <div className="space-y-5">
            {[
              {
                q: "Do I Need To Be Good With Computers?",
                a: "Not at all. Our AI system handles the technical work while you focus on managing and growing local business relationships.",
              },
              {
                q: "How Much Time Do I Need To Give?",
                a: "Most franchise partners spend around 3-4 flexible hours daily depending on their business goals and growth plans.",
              },
              {
                q: "When Will I Recover My Investment?",
                a: cityName
                  ? `Most ${cityName} franchise partners recover their investment within 4 to 6 months when following our proven system.`
                  : "Most franchise partners recover their investment within 4 to 6 months when following our proven system.",
              },
              {
                q: "Are There Any Hidden Charges?",
                a: "No hidden fees. After the one-time franchise investment, you continue earning recurring monthly revenue.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-2xl hover:border-lemon-hover/40 transition-all duration-500"
              >
                {/* Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-lemon-glow/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

                {/* Question */}
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-lemon-glow/15 border border-lemon-glow/20 flex items-center justify-center shrink-0">
                    <span className="text-lemon-hover font-black text-sm">
                      Q
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base sm:text-lg font-black uppercase tracking-tight text-black leading-snug"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {faq.q}
                    </h3>

                    <p className="mt-4 text-sm sm:text-base text-slate-500 font-bold leading-relaxed">
                      {cityName &&
                      faq.q === "When Will I Recover My Investment?" ? (
                        <>
                          Most{" "}
                          <span className="text-lemon-hover">{cityName}</span>{" "}
                          franchise partners recover their investment within 4
                          to 6 months when following our proven system.
                        </>
                      ) : (
                        faq.a
                      )}
                    </p>
                  </div>
                </div>

                {/* Bottom Border */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-lemon-hover group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="relative py-16 sm:py-20 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-lemon-glow/10 blur-3xl rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* ================= MAIN CARD ================= */}
          <div className="relative overflow-hidden rounded-[2.8rem] border border-slate-200 bg-white shadow-sm hover:shadow-2xl transition-all duration-500">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-lemon-glow/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full bg-black text-lemon-glow text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] shadow-lg">
                <span className="w-2 h-2 rounded-full bg-lemon-hover animate-pulse" />
                Limited Spots Available{" "}
                {cityName ? (
                  <>
                    In <span className="text-white">{cityName}</span>
                  </>
                ) : null}
              </div>

              {/* Heading */}
              <h2
                className="font-black uppercase tracking-tight leading-[1.1] text-black"
                style={{
                  fontSize: "clamp(1.7rem, 3.2vw, 2.8rem)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {cityName ? (
                  <>
                    Start Your{" "}
                    <span className="text-lemon-hover">{cityName}</span>
                  </>
                ) : (
                  "Start Your Business"
                )}

                <br />

                <span className="text-black">Business With Us Today</span>
              </h2>

              {/* Sub Text */}
              <p className="mt-6 text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto">
                {cityName ? (
                  <>
                    Secure your{" "}
                    <span className="text-lemon-hover">{cityName}</span>{" "}
                    franchise territory before someone else takes it.
                  </>
                ) : (
                  "Secure your franchise territory before someone else takes it."
                )}
              </p>

              {/* CTA */}
              <div className="flex flex-wrap justify-center gap-5 mt-10">
                <button
                  onClick={() => handleOpenForm("premium")}
                  className="group rounded-2xl bg-black hover:bg-lemon-hover text-white hover:text-black px-10 py-5 text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 shadow-2xl hover:scale-[1.02]"
                >
                  {cityName ? (
                    <>
                      Apply In <span>{cityName}</span>
                    </>
                  ) : (
                    "Apply Now"
                  )}

                  <ArrowRight
                    size={16}
                    className="ml-2 inline transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="mt-14 pt-10 border-t border-slate-200">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    {
                      value: "tel:+919289344726",
                      icon: PhoneCall,
                      label: "+91 9289344726",
                    },
                    {
                      value: "mailto:info@limbu.ai",
                      icon: MailIcon,
                      label: "info@limbu.ai",
                    },
                  ].map((contact, i) => (
                    <a
                      key={i}
                      href={contact.value}
                      className="group flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 hover:bg-white hover:border-lemon-hover/40 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-black transition-all duration-300">
                        <contact.icon
                          size={16}
                          className="text-black group-hover:text-lemon-glow transition-colors duration-300"
                        />
                      </div>

                      <span className="text-xs sm:text-sm font-black text-black tracking-tight">
                        {contact.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
      <ScrollToTop />
      <BookDemoModal />
    </div>
  );
}
