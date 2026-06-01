
"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import ServiceBookingModal from "@/components/modals/ServiceBookingModal"
import {
  expandPricingLandingForApi,
  mergePricingLanding,
} from "@/lib/pricingLandingDefaults"
import {
  applyDiscountToModalPlan,
  buildModalPlanForCheckout,
  findPlanByKey,
  normalizeBillingCycle,
  parseCheckoutDiscountPercent,
} from "@/lib/planCheckout"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planKey       = searchParams.get("planKey")
  const cycleParam    = searchParams.get("cycle")
  const discountParam = searchParams.get("discount")
  const chatSessionId = searchParams.get("session_id")?.trim() || ""
  // Phone-based chatbot flow: ?phone=919876543210
  const phoneFromUrl  = (searchParams.get("phone") || "").replace(/\D/g, "")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: "",
    phone: phoneFromUrl || "",   // pre-fill from URL if chatbot sent phone
    email: "",
    gstNumber: "",
  })

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!planKey) {
      setError("Missing planKey in URL.")
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch("/api/home-data?type=pricingLanding&checkout=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => {
        if (cancelled) return
        const merged = expandPricingLandingForApi(mergePricingLanding(doc), {
          applyChatbotPriceDiscount: false,
        })
        const found = findPlanByKey(merged, planKey)
        if (!found) {
          setError("Invalid or unknown plan. Check planKey.")
          setLoading(false)
          return
        }
        const cycle = normalizeBillingCycle(cycleParam)
        const modalPlan = applyDiscountToModalPlan(
          buildModalPlanForCheckout(found, cycle),
          discountParam,
        )
        setSelectedPlan(modalPlan)
        setBookingSuccess(false)
        setShowServiceModal(true)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load pricing. Try again later.")
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [planKey, cycleParam, discountParam])

  const handleServicePayment = useCallback(
    async (e) => {
      e.preventDefault()
      if (!serviceForm.name || !serviceForm.phone || !serviceForm.email) {
        toast.error("Please fill in all fields")
        return
      }
      if (!selectedPlan) return

      try {
        const amountVal =
          typeof selectedPlan.totalPrice === "string"
            ? parseInt(String(selectedPlan.totalPrice).replace(/[^\d]/g, ""), 10)
            : selectedPlan.totalPrice

        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan.title,
            amount: amountVal,
            receipt: `receipt_${Date.now()}`,
            notes: {
              plan_name: selectedPlan.title,
              user_email: serviceForm.email,
              plan_key: selectedPlan.planKey || "",
              plan_type: selectedPlan.planType || "",
              purchase_link: selectedPlan.purchaseLink || "",
            },
          }),
        })

        const orderData = await orderRes.json()
        if (orderData.error) {
          toast.error("Error creating payment order")
          return
        }

        const options = {
          key: process.env.RAZORPAY_KEY_ID || "rzp_live_RwW59lDH6d9dB8",
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Limbu.ai",
          description: selectedPlan.title,
          image: "",
          order_id: orderData.order.id,
          handler: async function (response) {
            try {
              const saveRes = await fetch("/api/service-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...serviceForm,
                  bookingSource: phoneFromUrl ? "chatbot" : "website",
                  planTitle: selectedPlan.title,
                  planType: selectedPlan.planType,
                  planDuration: selectedPlan.planDuration ?? "",
                  planKey: selectedPlan.planKey || "",
                  purchaseLink: selectedPlan.purchaseLink || "",
                  planPrice:
                    typeof selectedPlan.price === "number"
                      ? String(selectedPlan.price)
                      : selectedPlan.price,
                  totalAmount:
                    typeof selectedPlan.totalPrice === "number"
                      ? String(selectedPlan.totalPrice)
                      : String(selectedPlan.totalPrice ?? ""),
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  status: "paid",
                  ...(chatSessionId ? { chatbotSessionId: chatSessionId } : {}),
                  ...(phoneFromUrl  ? { chatbotPhone: phoneFromUrl }      : {}),
                }),
              })

              const saveData = await saveRes.json().catch(() => ({}))

              if (saveRes.ok) {
                setBookingSuccess(true)
                setServiceForm({
                  name: "",
                  phone: "",
                  email: "",
                  gstNumber: "",
                })
                toast.success(
                  saveData.checkoutUserId
                    ? `Payment successful. Account: ${saveData.checkoutUserId}`
                    : "Payment successful!",
                )
              } else {
                toast.error(
                  saveData.error ||
                    "Payment succeeded but we could not complete registration. Contact support with your payment ID.",
                )
              }
            } catch (err) {
              console.error(err)
              toast.error("Error saving booking")
            }
          },
          prefill: {
            name: serviceForm.name,
            email: serviceForm.email,
            contact: serviceForm.phone,
          },
          theme: { color: "#3B82F6" },
        }

        const paymentObject = new window.Razorpay(options)
        paymentObject.open()
      } catch (err) {
        console.error(err)
        toast.error("Something went wrong. Please try again.")
      }
    },
    [selectedPlan, serviceForm, chatSessionId, phoneFromUrl]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Opening checkout…
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-slate-800 font-medium">{error}</p>
        <a href="/" className="text-blue-600 underline">
          Back to home
        </a>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col items-center justify-start pt-16 px-4">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Complete payment</h1>
        <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
          Enter your details below to pay securely with Razorpay for{" "}
          <span className="font-semibold">{selectedPlan?.title}</span>.
        </p>
      </div>

      <ServiceBookingModal
        showServiceModal={showServiceModal}
        setShowServiceModal={setShowServiceModal}
        selectedPlan={selectedPlan}
        bookingSuccess={bookingSuccess}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        handleServicePayment={handleServicePayment}
      />
    </>
  )
}

function parseRupeeValue(value) {
  if (typeof value === "number") return value
  const parsed = parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatRupee(value) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`
}

function normalizeDiscountPercent(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.min(parsed, 100)
}

function applyDiscountToModalPlan(plan, discountParam) {
  const discountPercent = normalizeDiscountPercent(discountParam)
  if (!plan || !discountPercent) return plan

  const originalPrice = parseRupeeValue(plan.price)
  if (!originalPrice) return plan

  const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100))
  const gst = Math.round(discountedPrice * 0.18)
  const total = discountedPrice + gst

  return {
    ...plan,
    originalPrice: plan.price,
    discountPercent,
    discountAmount: formatRupee(originalPrice - discountedPrice),
    price: formatRupee(discountedPrice),
    gstAmount: formatRupee(gst),
    totalPrice: formatRupee(total),
  }
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          Loading…
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
