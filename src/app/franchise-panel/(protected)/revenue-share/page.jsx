"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  IndianRupee,
  Layers,
  PieChart,
  Radio,
  Pencil,
  RefreshCw,
  Wallet,
  X,
} from "lucide-react";
import {
  canAccessBookings,
  getFranchiseAuthHeaders,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";
import { sourceBadgeClass, sourceLabel } from "@/lib/sourceBadge";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import RenewPlanModal from "@/app/admin/dashboard/revenue-users/components/RenewPlanModal";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";

/** Franchise keeps 50%, Limbu Ai keeps 50%. */
const SHARE_RATE = 0.5;

/** Renew modal ke plan options — admin revenue-users page se same. */
const REVENUE_PLANS = [
  { name: "Basic Plan", monthly: 3500 },
  { name: "Professional Plan", monthly: 5500 },
  { name: "Premium Plan", monthly: 7500 },
];

/** YYYY-MM-DD (timezone shift ke bina). */
const toDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const EMPTY_DRILL = { type: "", plan: "", source: "", month: "" };

const PAYMENT_MODE_LABELS = {
  "bank-transfer": "Bank Transfer",
  upi: "UPI",
  cheque: "Cheque",
  cash: "Cash",
  other: "Other",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const typeKeyOf = (row) => {
  if (row.type === "user_onboard" || row.type === "plan") return "package";
  if (row.type === "service") return "service";
  return row.type || "other";
};

const typeLabelOf = (key) =>
  key === "package" ? "Package" : key === "service" ? "Service" : "Other";

const monthKeyOf = (row) => {
  const date = new Date(row.createdAt);
  if (isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabelOf = (key) => {
  if (key === "unknown") return "Unknown";
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

/** Roll rows up into { key, label, count, gross } buckets, biggest first. */
function groupRows(rows, keyOf, labelOf) {
  const buckets = new Map();

  rows.forEach((row) => {
    const key = keyOf(row);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: labelOf(key), count: 0, gross: 0 });
    }
    const bucket = buckets.get(key);
    bucket.count += 1;
    bucket.gross += Number(row.amount) || 0;
  });

  return [...buckets.values()].sort((a, b) => b.gross - a.gross);
}

export default function RevenueShare() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [drill, setDrill] = useState(EMPTY_DRILL);
  const [payouts, setPayouts] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadingId, setDownloadingId] = useState("");

  /* ---------------- RENEW PLAN ---------------- */
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewUser, setRenewUser] = useState(null);
  const [renewPlan, setRenewPlan] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewDuration, setRenewDuration] = useState("monthly");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewScreenshot, setRenewScreenshot] = useState(null);
  const [renewRemarks, setRenewRemarks] = useState("");
  const [renewGstNumber, setRenewGstNumber] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  /* ---------------- EDIT RECORD (amount / remarks / proof) ---------------- */
  const [editRow, setEditRow] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editProof, setEditProof] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchRevenue = async () => {
      try {
        const franchiseUser = getFranchiseUserFromStorage();
        const token = localStorage.getItem("franchise_token");

        if (!canAccessBookings(franchiseUser?.role)) {
          router.replace("/franchise-panel/dashboard");
          return;
        }

        const franchiseCode = franchiseUser?.franchiseCode || "";

        if (!franchiseCode || !token) {
          setError("Franchise session not found");
          return;
        }

        const [revenueRes, payoutRes] = await Promise.all([
          fetch(
            `/api/franchise-revenue?franchiseCode=${encodeURIComponent(
              franchiseCode,
            )}`,
            { headers: getFranchiseAuthHeaders() },
          ),
          fetch(
            `/api/franchise-payout?franchiseCode=${encodeURIComponent(
              franchiseCode,
            )}`,
            { headers: getFranchiseAuthHeaders() },
          ),
        ]);

        if (!revenueRes.ok) {
          throw new Error(`HTTP ${revenueRes.status}`);
        }

        const json = await revenueRes.json();

        if (!json.success) {
          throw new Error(json.message || "Failed to fetch revenue");
        }

        setRows(json.data || []);

        // Payouts are informational — a failure here must not blank the page.
        try {
          const payoutJson = await payoutRes.json();
          if (payoutJson.success) {
            setPayouts(payoutJson.data || []);
            setPayoutSummary(payoutJson.summary || null);
          }
        } catch (payoutErr) {
          console.error("Payout fetch error:", payoutErr);
        }
      } catch (err) {
        console.error("Revenue fetch error:", err);
        setError(err.message || "Failed to fetch revenue");
      } finally {
        setLoading(false);
      }
  };

  /* ---------------- EDIT RECORD ---------------- */

  /**
   * Remark kisi bhi onboarding flow se aa sakta hai: kuch flows `planRemarks`
   * bhejte hain, kuch `notes`. `notes` me system ka apna text bhi hota hai
   * ("Plan upgrade to X"), wo remark nahi hai — isliye use chhod do.
   */
  const AUTO_NOTE = /^Plan (upgrade to|renewed from)/i;
  const remarkOf = (row) => {
    const own = (row?.planRemarks || "").trim();
    if (own) return own;
    const note = (row?.notes || "").trim();
    return note && !AUTO_NOTE.test(note) ? note : "";
  };

  const openEditModal = (row) => {
    setEditRow(row);
    setEditAmount(row.amount ?? "");
    setEditRemarks(remarkOf(row));
    setEditProof(null);
  };

  const closeEditModal = () => {
    setEditRow(null);
    setEditAmount("");
    setEditRemarks("");
    setEditProof(null);
  };

  const handleSaveEdit = async () => {
    if (!editRow?._id) return;

    const amountNum = Number(editAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSavingEdit(true);
    try {
      const form = new FormData();
      form.append("id", editRow._id);
      form.append("amount", String(amountNum));

      // Service rows ka remark `notes` me rehta hai, package rows ka `planRemarks` me.
      if (typeKeyOf(editRow) === "service") {
        form.append("type", "service");
        form.append("notes", editRemarks);
      } else {
        form.append("planRemarks", editRemarks);
      }

      if (editProof) form.append("paymentScreenshot", editProof);

      const res = await fetch("/api/franchise-revenue", {
        method: "PUT",
        headers: getFranchiseAuthHeaders(),
        body: form,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Update failed");
      }

      closeEditModal();
      await fetchRevenue();
    } catch (err) {
      console.error("Revenue edit error:", err);
      alert(err.message || "Could not save changes");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ---------------- RENEW PLAN ---------------- */

  /**
   * Renew modal khole — start date purani expiry ke agle din se,
   * aur agar plan already expire ho chuka hai to aaj se.
   */
  const openRenewModal = (row) => {
    setRenewUser(row);
    setRenewPlan(row.plan || "");
    setRenewAmount(row.amount || "");
    setRenewGstNumber(row.gstNumber || "");
    setRenewRemarks("");
    setRenewScreenshot(null);
    setRenewDuration("monthly");

    const oldExpiry = row.packageExpiryDate;

    if (oldExpiry) {
      const expiryDate = new Date(oldExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const startDate =
        expiryDate < today
          ? new Date(today)
          : new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000);

      const expiry = new Date(startDate);
      expiry.setMonth(expiry.getMonth() + 1);

      setRenewStartDate(toDateInput(startDate));
      setRenewExpiryDate(toDateInput(expiry));
    } else {
      setRenewStartDate("");
      setRenewExpiryDate("");
    }

    setShowRenewModal(true);
  };

  const handleRenewPlan = async () => {
    if (!renewPlan) return alert("Select a plan");
    if (!renewAmount) return alert("Enter amount");
    if (!renewStartDate) return alert("Select start date");
    if (!renewExpiryDate) return alert("Select expiry date");

    try {
      setSavingPlan(true);

      let screenshotUrl = "";
      if (renewScreenshot) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", renewScreenshot);
        const uploadResult = await uploadToS3Action(uploadFormData);
        if (uploadResult?.success) screenshotUrl = uploadResult.url;
      }

      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getFranchiseAuthHeaders(),
        },
        body: JSON.stringify({
          leadId: renewUser?.leadId,
          leadName: renewUser?.leadName,
          email: renewUser?.email || "",
          phone: renewUser?.phone || "",
          franchiseId: renewUser?.franchiseId || null,
          franchiseName: renewUser?.franchiseName || null,
          onboardedBy: renewUser?.onboardedBy || null,
          onboardedByName: renewUser?.onboardedByName || "",
          onboardedByRole: renewUser?.onboardedByRole || "",
          plan: renewPlan,
          amount: Number(renewAmount),
          packageStartDate: renewStartDate,
          packageExpiryDate: renewExpiryDate,
          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,
          planRemarks: renewRemarks,
          notes: `Plan renewed from ${renewUser?.plan || "Old Plan"} to ${renewPlan} (franchise panel)`,
          type: "plan",
          status: "active",
          bookingSource: "manual-upload",
          gstNumber: renewGstNumber,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed to renew plan");
        return;
      }

      // Customer ko WhatsApp — fail ho to renewal fir bhi safal hai.
      try {
        await fetch("/api/admin/revenue-plan-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: renewUser?.phone || "",
            firstName: renewUser?.leadName || "Customer",
            planName: renewPlan,
            amount: renewAmount,
            startDate: renewStartDate,
            expiryDate: renewExpiryDate,
            invoiceUrl: data.revenue?.invoiceUrl,
          }),
        });
      } catch (err) {
        console.error("Renew WhatsApp template failed:", err);
      }

      // Invoice email
      try {
        const newRevenueId = data?.revenue?._id;
        if (newRevenueId) {
          await fetch("/api/admin/send-invoice-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revenueId: newRevenueId }),
          });
        }
      } catch (err) {
        console.error("Renew invoice email failed:", err);
      }

      alert("Plan Renewed Successfully");
      setShowRenewModal(false);
      setRenewUser(null);
      setRenewPlan("");
      setRenewAmount("");
      setRenewStartDate("");
      setRenewExpiryDate("");
      setRenewGstNumber("");
      setRenewRemarks("");
      setRenewScreenshot(null);
      fetchRevenue();
    } catch (err) {
      console.error("RENEW PLAN ERROR =>", err);
      alert("Something went wrong");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDownloadInvoice = async (row) => {
    setDownloadingId(row._id);
    try {
      if (row.invoiceUrl) {
        window.open(row.invoiceUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const res = await fetch(`/api/admin/invoice-tax?id=${row._id}`);
      if (!res.ok) throw new Error("Invoice generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${row.leadName || "customer"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice download error:", err);
      alert(err.message || "Invoice download failed");
    } finally {
      setDownloadingId("");
    }
  };

  const summary = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const franchise = total * SHARE_RATE;
    // Prefer the server's payout totals; fall back to what we can derive here.
    const paid = payoutSummary?.totalPaid ?? 0;

    return {
      total,
      franchise,
      provider: total * (1 - SHARE_RATE),
      paid,
      pending: Math.max(0, franchise - paid),
    };
  }, [rows, payoutSummary]);

  const breakdown = useMemo(
    () => ({
      byType: groupRows(rows, typeKeyOf, typeLabelOf),
      byPlan: groupRows(
        rows,
        (row) => row.plan?.trim() || "Unspecified",
        (key) => key,
      ),
      bySource: groupRows(
        rows,
        (row) => row.bookingSource?.trim() || "manual-upload",
        (key) => sourceLabel(key),
      ),
      byMonth: groupRows(rows, monthKeyOf, monthLabelOf).sort((a, b) =>
        b.key.localeCompare(a.key),
      ),
    }),
    [rows],
  );

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (drill.type && typeKeyOf(row) !== drill.type) return false;
        if (drill.plan && (row.plan?.trim() || "Unspecified") !== drill.plan)
          return false;
        if (
          drill.source &&
          (row.bookingSource?.trim() || "manual-upload") !== drill.source
        )
          return false;
        if (drill.month && monthKeyOf(row) !== drill.month) return false;
        return true;
      }),
    [rows, drill],
  );

  const visibleTotal = useMemo(
    () => visibleRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [visibleRows],
  );

  const activeDrills = Object.entries(drill).filter(([, value]) => value);

  // Clicking the same bucket again clears it.
  const toggleDrill = (field, value) => {
    setDrill((prev) => ({ ...prev, [field]: prev[field] === value ? "" : value }));
    setShowBreakdown(true);
  };


  const formatAmount = (amount) =>
    `₹${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

  const drillLabel = (field, value) => {
    if (field === "type") return typeLabelOf(value);
    if (field === "source") return sourceLabel(value);
    if (field === "month") return monthLabelOf(value);
    return value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center font-semibold text-red-600">{error}</div>
    );
  }

  return (
    <div className="p-2 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Revenue Share</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every payment received and how it splits between you and Limbu Ai.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          {rows.length} records
        </span>
      </div>

      {/* Summary — Total Revenue opens the full breakdown */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => setShowBreakdown((prev) => !prev)}
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            showBreakdown
              ? "border-gray-900 bg-gray-900 text-white shadow-md"
              : "border-gray-200 bg-white hover:border-gray-400 hover:shadow"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`text-sm font-medium ${
                  showBreakdown ? "text-white/70" : "text-gray-500"
                }`}
              >
                Total Revenue
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  showBreakdown ? "text-white" : "text-gray-950"
                }`}
              >
                {formatAmount(summary.total)}
              </p>
            </div>
            <span
              className={`rounded-lg p-2 ${
                showBreakdown ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              <IndianRupee size={18} />
            </span>
          </div>
          <p
            className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
              showBreakdown ? "text-white/80" : "text-indigo-600"
            }`}
          >
            {showBreakdown ? "Hide breakdown" : "View full breakdown"}
            <ChevronDown
              size={14}
              className={showBreakdown ? "rotate-180 transition" : "transition"}
            />
          </p>
        </button>

        <SummaryCard
          label={`Your Franchise Share (${SHARE_RATE * 100}%)`}
          value={formatAmount(summary.franchise)}
          hint="Total you have earned so far"
          icon={<Wallet size={18} />}
          tone="indigo"
        />
        <SummaryCard
          label={`Company Share (${(1 - SHARE_RATE) * 100}%)`}
          value={formatAmount(summary.provider)}
          hint="Platform's portion of the same payments"
          icon={<Building2 size={18} />}
          tone="blue"
        />
      </div>

      {/* Payout settlement */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Payout Received"
          value={formatAmount(summary.paid)}
          hint={
            payouts.length
              ? `${payouts.length} payout${
                  payouts.length === 1 ? "" : "s"
                } · last on ${formatDate(payouts[0]?.paidAt)}`
              : "No payout settled yet"
          }
          icon={<CheckCircle2 size={18} />}
          tone="emerald"
        />
        <SummaryCard
          label="Pending With Company"
          value={formatAmount(summary.pending)}
          hint="Your earned share that is yet to be transferred"
          icon={<AlertCircle size={18} />}
          tone={summary.pending > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-950">
                Revenue Breakdown
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Click any row to filter the table below.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <BreakdownGroup
              title="Where the payment came from"
              subtitle="By booking source"
              icon={<Radio size={15} />}
              buckets={breakdown.bySource}
              total={summary.total}
              activeKey={drill.source}
              onSelect={(key) => toggleDrill("source", key)}
              formatAmount={formatAmount}
              renderLabel={(bucket) => (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sourceBadgeClass(
                    bucket.key,
                  )}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {bucket.label}
                </span>
              )}
            />

            <BreakdownGroup
              title="What was sold"
              subtitle="By revenue type"
              icon={<Layers size={15} />}
              buckets={breakdown.byType}
              total={summary.total}
              activeKey={drill.type}
              onSelect={(key) => toggleDrill("type", key)}
              formatAmount={formatAmount}
            />

            <BreakdownGroup
              title="Plan-wise collection"
              subtitle="By plan"
              icon={<Layers size={15} />}
              buckets={breakdown.byPlan}
              total={summary.total}
              activeKey={drill.plan}
              onSelect={(key) => toggleDrill("plan", key)}
              formatAmount={formatAmount}
            />

            <BreakdownGroup
              title="Month-wise collection"
              subtitle="By booking month"
              icon={<CalendarRange size={15} />}
              buckets={breakdown.byMonth}
              total={summary.total}
              activeKey={drill.month}
              onSelect={(key) => toggleDrill("month", key)}
              formatAmount={formatAmount}
            />
          </div>

          <div className="mt-5 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
            <TotalLine
              label="Total collected"
              value={formatAmount(summary.total)}
              tone="text-gray-950"
            />
            <TotalLine
              label={`Paid out to franchise (${SHARE_RATE * 100}%)`}
              value={formatAmount(summary.franchise)}
              tone="text-emerald-700"
            />
            <TotalLine
              label={`Retained by Limbu Ai (${(1 - SHARE_RATE) * 100}%)`}
              value={formatAmount(summary.provider)}
              tone="text-blue-700"
            />
          </div>
        </div>
      )}

      {/* Active drill-down chips */}
      {activeDrills.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-600">
            Showing only:
          </span>
          {activeDrills.map(([field, value]) => (
            <button
              key={field}
              type="button"
              onClick={() => toggleDrill(field, value)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            >
              {drillLabel(field, value)}
              <X size={13} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDrill(EMPTY_DRILL)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#1e293b] text-xs uppercase tracking-wider text-white">
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-center font-semibold">Edit</th>
                <th className="px-6 py-4 text-left font-semibold">Plan</th>
                <th className="px-6 py-4 text-left font-semibold">Remarks</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-right font-semibold">
                  Franchise {SHARE_RATE * 100}%
                </th>
                <th className="px-6 py-4 text-right font-semibold">
                  Provider {(1 - SHARE_RATE) * 100}%
                </th>
                <th className="px-6 py-4 text-right font-semibold">Date</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Proof &amp; Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {visibleRows.length ? (
                visibleRows.map((row) => {
                  const amount = Number(row.amount) || 0;
                  return (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-950">
                          {row.leadName || "Customer"}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {row.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          title="Edit amount, remarks or payment proof"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.plan || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {remarkOf(row) ? (
                          <p
                            className="w-[260px] whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-700"
                            title={remarkOf(row)}
                          >
                            {remarkOf(row)}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        {formatAmount(amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-700">
                        {formatAmount(amount * SHARE_RATE)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-700">
                        {formatAmount(amount * (1 - SHARE_RATE))}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {new Date(row.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              row.paymentScreenshot || row.screenshot
                                ? setPreviewUrl(
                                    row.paymentScreenshot || row.screenshot,
                                  )
                                : alert("No payment proof uploaded")
                            }
                            disabled={!row.paymentScreenshot && !row.screenshot}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                            title="View payment proof"
                          >
                            <Eye size={14} />
                            Proof
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(row)}
                            disabled={downloadingId === row._id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                            title={
                              row.invoiceUrl
                                ? "Open invoice PDF"
                                : "Generate & download invoice"
                            }
                          >
                            {row.invoiceUrl ? (
                              <FileText size={14} />
                            ) : (
                              <Download size={14} />
                            )}
                            {downloadingId === row._id ? "..." : "Invoice"}
                          </button>

                          {/* Renew — sirf package/plan rows par */}
                          {typeKeyOf(row) === "package" && (
                            <button
                              type="button"
                              onClick={() => openRenewModal(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              title="Renew this plan"
                            >
                              <RefreshCw size={14} />
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-gray-500">
                    {rows.length
                      ? "No revenue matches the selected breakdown."
                      : "No revenue found for this franchise."}
                  </td>
                </tr>
              )}
            </tbody>
            {visibleRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 text-sm font-bold text-gray-900">
                  <td className="px-6 py-4" colSpan="4">
                    Total ({visibleRows.length} record
                    {visibleRows.length === 1 ? "" : "s"})
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatAmount(visibleTotal)}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-700">
                    {formatAmount(visibleTotal * SHARE_RATE)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-700">
                    {formatAmount(visibleTotal * (1 - SHARE_RATE))}
                  </td>
                  <td className="px-6 py-4" colSpan="2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Payouts settled to this franchise */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Payout History</h2>
            <p className="text-sm text-gray-500">
              Amounts Limbu Ai has transferred to you, with transfer proof.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total received
            </p>
            <p className="text-xl font-bold text-emerald-700">
              {formatAmount(summary.paid)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3 text-left font-semibold">Paid On</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Mode</th>
                <th className="px-6 py-3 text-left font-semibold">UTR / Ref</th>
                <th className="px-6 py-3 text-left font-semibold">Period</th>
                <th className="px-6 py-3 text-left font-semibold">Notes</th>
                <th className="px-6 py-3 text-center font-semibold">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.length ? (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatDate(payout.paidAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-emerald-700">
                      {formatAmount(payout.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {PAYMENT_MODE_LABELS[payout.paymentMode] ||
                        payout.paymentMode}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {payout.referenceNo || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {payout.periodFrom || payout.periodTo
                        ? `${formatDate(payout.periodFrom)} → ${formatDate(
                            payout.periodTo,
                          )}`
                        : "—"}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-gray-600">
                      {payout.notes || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(payout.screenshot)}
                        disabled={!payout.screenshot}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye size={14} />
                        View Proof
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <p className="text-sm font-semibold text-gray-900">
                      No payout received yet
                    </p>
                    <p className="mt-1 text-sm">
                      Your pending share of {formatAmount(summary.pending)} will
                      appear here once Limbu Ai settles it.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RenewPlanModal
        showRenewModal={showRenewModal}
        setShowRenewModal={setShowRenewModal}
        renewPlan={renewPlan}
        setRenewPlan={setRenewPlan}
        renewAmount={renewAmount}
        setRenewAmount={setRenewAmount}
        renewStartDate={renewStartDate}
        setRenewStartDate={setRenewStartDate}
        renewExpiryDate={renewExpiryDate}
        setRenewExpiryDate={setRenewExpiryDate}
        renewScreenshot={renewScreenshot}
        setRenewScreenshot={setRenewScreenshot}
        renewRemarks={renewRemarks}
        setRenewRemarks={setRenewRemarks}
        renewGstNumber={renewGstNumber}
        setRenewGstNumber={setRenewGstNumber}
        renewDuration={renewDuration}
        setRenewDuration={setRenewDuration}
        handleRenewPlan={handleRenewPlan}
        savingPlan={savingPlan}
        revenuePlans={REVENUE_PLANS}
      />


      {/* ---------------- EDIT RECORD MODAL ---------------- */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  Edit Payment
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {editRow.leadName || "Customer"} · {editRow.plan || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Remarks
                </label>
                <textarea
                  rows={4}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Onboarding remark, custom note…"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Payment Proof
                </label>
                {(editRow.paymentScreenshot || editRow.screenshot) && !editProof && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewUrl(
                        editRow.paymentScreenshot || editRow.screenshot,
                      )
                    }
                    className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:underline"
                  >
                    <Eye size={14} />
                    View current proof
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setEditProof(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-xs file:font-semibold"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Choose a file only if you want to replace the current proof.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingEdit}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}

function SummaryCard({ label, value, hint, icon, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg p-2 ${tones[tone] || tones.blue}`}>
          {icon}
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function BreakdownGroup({
  title,
  subtitle,
  icon,
  buckets,
  total,
  activeKey,
  onSelect,
  formatAmount,
  renderLabel,
}) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {buckets.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          No data yet.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {buckets.map((bucket) => {
            const share = total > 0 ? (bucket.gross / total) * 100 : 0;
            const isActive = activeKey === bucket.key;

            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => onSelect(bucket.key)}
                className={`block w-full px-4 py-3 text-left transition ${
                  isActive ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {renderLabel ? (
                      renderLabel(bucket)
                    ) : (
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {bucket.label}
                      </span>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {bucket.count} payment{bucket.count === 1 ? "" : "s"} ·{" "}
                      {share.toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-950">
                      {formatAmount(bucket.gross)}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">
                      Your share {formatAmount(bucket.gross * SHARE_RATE)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      isActive ? "bg-indigo-600" : "bg-gray-400"
                    }`}
                    style={{ width: `${Math.max(share, 2)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TotalLine({ label, value, tone }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
