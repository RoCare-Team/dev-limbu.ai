import crypto from "crypto"
import mongoose from "mongoose"
import User from "@/models/User"
import RazorpayTransaction from "@/models/RazorpayTransaction"
import Admin from "@/models/Admin"
import { bookingSourceToUserSource } from "@/lib/bookingSource"
import { CHECKOUT_TEST_PLAN_KEY } from "@/lib/checkoutTestPlan"
import { normalizeBillingCycle } from "@/lib/planCheckout"
import { runNewUserOnboarding } from "@/lib/onboardingNewUser"
import { mergeMetaLeadsTag } from "@/lib/bookingSource"
import { runWelcomeBonusForUserId } from "@/lib/welcomeBonusWhatsApp"

const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed,
})
const Setting =
  mongoose.models.settings || mongoose.model("settings", SettingSchema)

/** Digits-only IN mobile for User.phone (91 + 10 digits). */
function normalizeCheckoutPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "")
  if (!digits) return ""
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits
  if (last10.length !== 10) return ""
  return `91${last10}`
}

function parseAmountNumber(val) {
  if (typeof val === "number" && Number.isFinite(val)) return val
  const s = String(val ?? "").replace(/[^\d.]/g, "")
  const n = parseFloat(s)
  return Number.isFinite(n) ? Math.round(n) : 0
}

export function computePackageExpiryDate(startDate, planDurationRaw) {
  const d = new Date(startDate)
  const duration = String(planDurationRaw || "monthly").toLowerCase()
  const end = new Date(d)
  if (duration === "monthly") end.setMonth(end.getMonth() + 1)
  else if (duration === "quarterly") end.setMonth(end.getMonth() + 3)
  else if (duration === "half-yearly") end.setMonth(end.getMonth() + 6)
  else if (duration === "yearly") end.setFullYear(end.getFullYear() + 1)
  else if (duration.includes("month") && !duration.includes("half")) {
    end.setMonth(end.getMonth() + 1)
  } else end.setMonth(end.getMonth() + 1)
  return end
}

async function assignAgentRoundRobin() {
  let assignedAgentId = null
  try {
    const activeAgents = await Admin.find({
      role: "agent",
      isActive: true,
    }).sort({ createdAt: 1 })
    if (activeAgents.length > 0) {
      let rrDoc = await Setting.findOne({ key: "agentLeadRR" })
      if (!rrDoc) {
        rrDoc = await Setting.create({ key: "agentLeadRR", value: 0 })
      }
      let rrValue = parseInt(rrDoc.value, 10)
      if (!Number.isFinite(rrValue) || rrValue < 0) rrValue = 0
      assignedAgentId = activeAgents[rrValue % activeAgents.length]._id
      await Setting.updateOne({ key: "agentLeadRR" }, { $inc: { value: 1 } })
    }
  } catch (e) {
    console.error("checkout assignAgentRoundRobin", e)
  }
  return assignedAgentId
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET
  if (!secret) {
    return { ok: false, error: "Razorpay secret not configured" }
  }
  if (!orderId || !paymentId || !signature) {
    return { ok: false, error: "Missing payment verification fields" }
  }
  const body = orderId + "|" + paymentId
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  if (expected !== signature) {
    return { ok: false, error: "Invalid payment signature" }
  }
  return { ok: true }
}

function isSubscriptionPlan(planType, planKey) {
  if (planType === "our-package") return true
  if (typeof planKey === "string" && planKey.startsWith("subscription-")) {
    return true
  }
  return false
}

/**
 * After verified Razorpay payment: find or create User (phone/email), then attach plan.
 */
export async function applyCheckoutToUser(body) {
  const {
    name,
    phone,
    email,
    gstNumber,
    planTitle,
    planType,
    planDuration: planDurationRaw,
    planKey,
    paymentId,
    orderId,
    razorpay_signature,
    totalAmount,
    bookingSource,
  } = body

  const userSource = bookingSourceToUserSource(bookingSource)

  const sig = verifyRazorpaySignature(orderId, paymentId, razorpay_signature)
  if (!sig.ok) {
    return { ok: false, status: 400, error: sig.error }
  }

  const dup = await RazorpayTransaction.findOne({ paymentId })
  if (dup) {
    return { ok: false, status: 400, error: "This payment was already processed" }
  }

  const normalizedPhone = normalizeCheckoutPhone(phone)
  if (!normalizedPhone) {
    return { ok: false, status: 400, error: "Valid 10-digit phone number required" }
  }

  const emailNorm = String(email || "")
    .trim()
    .toLowerCase()
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return { ok: false, status: 400, error: "Valid email required" }
  }

  const phoneUser = await User.findOne({ phone: normalizedPhone })
  const emailUser = await User.findOne({ email: emailNorm })

  if (phoneUser && emailUser && String(phoneUser._id) !== String(emailUser._id)) {
    return {
      ok: false,
      status: 400,
      error:
        "This phone and email belong to different accounts. Log in with your registered credentials.",
    }
  }

  let user = phoneUser || emailUser
  let created = false

  if (emailUser && !phoneUser && emailUser.phone && emailUser.phone !== normalizedPhone) {
    return {
      ok: false,
      status: 400,
      error: "This email is registered with a different phone number",
    }
  }

  if (!user) {
    const assignedAgentId = await assignAgentRoundRobin()
    try {
      user = await User.create({
        userId: `USR${Date.now()}`,
        fullName: String(name || "").trim() || "User",
        email: emailNorm,
        phone: normalizedPhone,
        wallet: 500,
        freeUsedCount: 2,
        assignedAgentId,
        source: userSource,
        leadTags: mergeMetaLeadsTag(userSource, []),
        GstNumber: gstNumber ? String(gstNumber).trim() : undefined,
        subscription: {
          status: "inactive",
          plan: "Free",
        },
      })
    } catch (e) {
      if (e?.code === 11000) {
        return {
          ok: false,
          status: 400,
          error:
            "This phone or email is already linked to an account. Log in with that account.",
        }
      }
      throw e
    }
    created = true
    void runWelcomeBonusForUserId(user.userId).catch((err) =>
      console.error("runWelcomeBonusForUserId checkout", err),
    )
    void runNewUserOnboarding(user.userId).catch((err) =>
      console.error("runNewUserOnboarding checkout", err),
    )
  } else {
    const updates = {}
    if (String(name || "").trim()) updates.fullName = String(name).trim()
    updates.email = emailNorm
    updates.phone = normalizedPhone
    if (gstNumber && String(gstNumber).trim()) {
      updates.GstNumber = String(gstNumber).trim()
    }
    updates.source = userSource
    user = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: updates },
      { new: true },
    )
  }

  const start = new Date()
  const planDuration = normalizeBillingCycle(planDurationRaw)
  const pkgEnd = computePackageExpiryDate(start, planDuration)
  const totalNum = parseAmountNumber(totalAmount)
  const gstAmount =
    totalNum > 0 ? Math.round((totalNum * 18) / 118) : 0

  const resolvedPlanTitle =
    planKey === CHECKOUT_TEST_PLAN_KEY ? "Basic Plan" : planTitle

  const subscriptionPaymentFields = {
    "subscription.plan": resolvedPlanTitle,
    "subscription.status": "active",
    "subscription.paymentId": paymentId,
    "subscription.orderId": orderId,
    "subscription.date": start,
    "subscription.expiry": pkgEnd,
  }

  if (isSubscriptionPlan(planType, planKey)) {
    await User.findByIdAndUpdate(user._id, {
      $set: {
        ...subscriptionPaymentFields,
        paidPackage: resolvedPlanTitle,
        planDuration,
        packageStartDate: start,
        packageExpiryDate: pkgEnd,
        source: userSource,
      },
    })
  } else {
    await User.findByIdAndUpdate(user._id, {
      $set: {
        ...subscriptionPaymentFields,
        paidService: resolvedPlanTitle,
        isServiceBooked: true,
        serviceStartDate: start,
        serviceExpiryDate: pkgEnd,
        source: userSource,
      },
    })
  }

  const refreshed = await User.findById(user._id).lean()

  await RazorpayTransaction.create({
    userId: refreshed.userId,
    orderId,
    paymentId,
    signature: razorpay_signature,
    amount: totalNum,
    gstAmount,
    totalAmount: totalNum,
    gstin: gstNumber ? String(gstNumber).trim() : "",
  })

  return {
    ok: true,
    user: refreshed,
    userCreated: created,
  }
}
