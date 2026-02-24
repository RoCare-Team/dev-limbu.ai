
"use client"
import { useState } from "react"

export default function useSubscription() {

  const [billingCycle, setBillingCycle] = useState("monthly")

  const getMultiplier = () => {
    switch (billingCycle) {
      case "quarterly": return 3
      case "half-yearly": return 6
      case "yearly": return 12
      default: return 1
    }
  }

  const calculatePrice = (basePrice) => {
    if (billingCycle === "monthly") return basePrice
    if (billingCycle === "quarterly") return Math.round(basePrice * 3 * 0.90)
    if (billingCycle === "half-yearly") return Math.round(basePrice * 6 * 0.85)
    if (billingCycle === "yearly") return Math.round(basePrice * 12 * 0.80)
    return basePrice
  }

  return { billingCycle, setBillingCycle, calculatePrice, getMultiplier }
}
