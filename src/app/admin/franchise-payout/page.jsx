"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Eye,
  IndianRupee,
  Loader2,
  Search,
  Undo2,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import { uploadToS3Action } from "@/app/actions/uploadS3Actions";
import ImagePreviewModal from "@/components/ImagePreviewModal";

const PAYMENT_MODES = [
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const formatAmount = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

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

const todayInputValue = () => new Date().toISOString().slice(0, 10);

/** "YYYY-MM" for a Date — the value an <input type="month"> expects. */
const monthInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const shiftMonth = (month, step) => {
  const [y, m] = month.split("-").map(Number);
  return monthInputValue(new Date(y, m - 1 + step, 1));
};

const monthLabel = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

/** First and last day of a month, as the date inputs in the payout form want them. */
const monthBounds = (month) => {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
};

export default function FranchisePayoutPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // "" = all time. Otherwise "YYYY-MM": revenue recorded in that month, and the
  // payouts that settle it.
  const [month, setMonth] = useState("");

  const [payoutFranchise, setPayoutFranchise] = useState(null);
  const [historyFranchise, setHistoryFranchise] = useState(null);
  const [collectionFranchise, setCollectionFranchise] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setAdminEmail((localStorage.getItem("adminEmail") || localStorage.getItem("email")) || "");
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!adminEmail) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/franchise-payout?all=1&adminEmail=${encodeURIComponent(adminEmail)}${
          month ? `&month=${month}` : ""
        }`,
        { cache: "no-store" },
      );
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to load payouts");
      }
      setRows(json.data || []);
    } catch (err) {
      setError(err.message || "Failed to load payouts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [adminEmail, month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.franchiseName, row.franchiseCode, row.ownerName, row.email]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [rows, search]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          gross: acc.gross + (row.grossRevenue || 0),
          earned: acc.earned + (row.franchiseEarned || 0),
          paid: acc.paid + (row.totalPaid || 0),
          pending: acc.pending + (row.pending || 0),
        }),
        { gross: 0, earned: 0, paid: 0, pending: 0 },
      ),
    [rows],
  );

  if (!adminEmail && !loading) {
    return (
      <div className="p-6">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Admin session not found. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Franchise Payouts</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Settle each franchise&apos;s 50% revenue share and attach the transfer
            proof.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period — the whole page (totals, rows, payout form) follows this */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setMonth("")}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                month ? "text-gray-500 hover:bg-gray-100" : "bg-gray-900 text-white"
              }`}
            >
              All time
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m || monthInputValue(), -1))}
              className="rounded-md px-2 py-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Previous month"
            >
              ‹
            </button>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border-0 px-2 py-1.5 text-sm text-gray-900 outline-none"
            />
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m || monthInputValue(), 1))}
              className="rounded-md px-2 py-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search franchise, code or owner"
              className="w-72 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {month && (
        <p className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-900">
          Showing <strong>{monthLabel(month)}</strong> only — revenue recorded in this month, and
          the payouts that settle it. The Pay Out form is pre-filled with this month&apos;s pending
          amount and period.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={month ? `Collected · ${monthLabel(month)}` : "Total Collected"}
          value={formatAmount(totals.gross)}
          icon={<IndianRupee size={18} />}
          tone="bg-gray-100 text-gray-800"
        />
        <StatCard
          label="Franchise Share (50%)"
          value={formatAmount(totals.earned)}
          icon={<Building2 size={18} />}
          tone="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          label="Already Paid Out"
          value={formatAmount(totals.paid)}
          icon={<Wallet size={18} />}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label={month ? `Pending · ${monthLabel(month)}` : "Pending Payout"}
          value={formatAmount(totals.pending)}
          icon={<AlertCircle size={18} />}
          tone="bg-amber-50 text-amber-700"
          highlight={totals.pending > 0}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[1080px] w-full text-sm">
          <thead>
            <tr className="bg-[#1e293b] text-xs uppercase tracking-wider text-white">
              <th className="px-5 py-4 text-left font-semibold">Franchise</th>
              <th className="px-5 py-4 text-right font-semibold">Collected</th>
              <th className="px-5 py-4 text-right font-semibold">Share (50%)</th>
              <th className="px-5 py-4 text-right font-semibold">Paid</th>
              <th className="px-5 py-4 text-right font-semibold">Pending</th>
              <th className="px-5 py-4 text-left font-semibold">Last Payout</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-16 text-center text-gray-500">
                  <Loader2 className="mx-auto animate-spin" size={22} />
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-16 text-center text-gray-500">
                  No franchises found.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-950">
                      {row.franchiseName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">
                        {row.franchiseCode}
                      </span>
                      <span>{row.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {/* The total is the entry point to what it is made of —
                        payouts already had a history, collections did not. */}
                    <button
                      type="button"
                      disabled={!row.grossRevenue}
                      onClick={() => setCollectionFranchise(row)}
                      title={
                        row.grossRevenue
                          ? "See which clients this came from"
                          : "Nothing collected in this period"
                      }
                      className={`font-semibold ${
                        row.grossRevenue
                          ? "text-gray-800 underline decoration-dotted decoration-gray-400 underline-offset-4 hover:text-indigo-700 hover:decoration-indigo-500"
                          : "cursor-default text-gray-400"
                      }`}
                    >
                      {formatAmount(row.grossRevenue)}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-700">
                    {formatAmount(row.franchiseEarned)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                    {formatAmount(row.totalPaid)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`font-bold ${
                        row.pending > 0 ? "text-amber-600" : "text-gray-400"
                      }`}
                    >
                      {formatAmount(row.pending)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {row.payoutCount > 0 ? (
                      <>
                        <div>{formatDate(row.lastPaidAt)}</div>
                        <div className="text-xs text-gray-400">
                          {row.payoutCount} payout
                          {row.payoutCount === 1 ? "" : "s"}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryFranchise(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        History
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayoutFranchise(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                      >
                        <Wallet size={14} />
                        Pay Out
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payoutFranchise && (
        <PayoutModal
          month={month}
          franchise={payoutFranchise}
          adminEmail={adminEmail}
          onClose={() => setPayoutFranchise(null)}
          onSuccess={() => {
            setPayoutFranchise(null);
            fetchSummary();
          }}
        />
      )}

      {historyFranchise && (
        <PayoutHistoryModal
          franchise={historyFranchise}
          adminEmail={adminEmail}
          onClose={() => setHistoryFranchise(null)}
          onPreview={setPreviewUrl}
          onChanged={fetchSummary}
        />
      )}

      {collectionFranchise && (
        <CollectionHistoryModal
          franchise={collectionFranchise}
          adminEmail={adminEmail}
          month={month}
          onClose={() => setCollectionFranchise(null)}
          onPreview={setPreviewUrl}
        />
      )}

      <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}

function StatCard({ label, value, icon, tone, highlight }) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        highlight ? "border-amber-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg p-2 ${tone}`}>{icon}</span>
      </div>
    </div>
  );
}

function PayoutModal({ franchise, adminEmail, month = "", onClose, onSuccess }) {
  // Settling a month: the period is that month, so this payout is counted
  // against it next time the month is opened (see periodFrom in the API).
  const bounds = month ? monthBounds(month) : null;
  const [form, setForm] = useState({
    amount: franchise.pending > 0 ? String(Math.round(franchise.pending)) : "",
    paymentMode: "bank-transfer",
    referenceNo: "",
    notes: "",
    periodFrom: bounds?.from || "",
    periodTo: bounds?.to || "",
    paidAt: todayInputValue(),
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setFormError("");

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a valid payout amount");
      return;
    }
    if (!file) {
      setFormError("Attach the payment screenshot as proof");
      return;
    }

    setSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const upload = await uploadToS3Action(uploadData);

      if (!upload?.success) {
        throw new Error(upload?.error || "Screenshot upload failed");
      }

      const res = await fetch("/api/franchise-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          franchiseCode: franchise.franchiseCode,
          amount,
          paymentMode: form.paymentMode,
          referenceNo: form.referenceNo,
          notes: form.notes,
          periodFrom: form.periodFrom || null,
          periodTo: form.periodTo || null,
          paidAt: form.paidAt || null,
          screenshot: upload.url,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to record payout");
      }

      onSuccess();
    } catch (err) {
      setFormError(err.message || "Failed to record payout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Record Payout</h2>
            <p className="text-sm text-gray-500">
              {franchise.franchiseName} · {franchise.franchiseCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-center">
          <MiniStat label="Share (50%)" value={formatAmount(franchise.franchiseEarned)} />
          <MiniStat label="Paid" value={formatAmount(franchise.totalPaid)} tone="text-emerald-700" />
          <MiniStat label="Pending" value={formatAmount(franchise.pending)} tone="text-amber-600" />
        </div>

        <div className="space-y-4 px-5 py-4">
          <Field label="Payout Amount *">
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="0"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment Mode">
              <select
                value={form.paymentMode}
                onChange={(e) => update("paymentMode", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="UTR / Reference No.">
              <input
                type="text"
                value={form.referenceNo}
                onChange={(e) => update("referenceNo", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                placeholder="e.g. UTR123456789"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Paid On">
              <input
                type="date"
                value={form.paidAt}
                onChange={(e) => update("paidAt", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </Field>
            <Field label="Period From">
              <input
                type="date"
                value={form.periodFrom}
                max={form.periodTo || undefined}
                onChange={(e) => update("periodFrom", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </Field>
            <Field label="Period To">
              <input
                type="date"
                value={form.periodTo}
                min={form.periodFrom || undefined}
                onChange={(e) => update("periodTo", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
            </Field>
          </div>

          <Field label="Payment Proof (screenshot / receipt) *">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-gray-500">
              <Upload size={18} className="text-gray-500" />
              <span className="truncate">
                {file ? file.name : "Click to select an image or PDF"}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </Field>

          <Field label="Notes">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="Anything the franchise should know about this payout"
            />
          </Field>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {formError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving..." : "Record Payout"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Where a franchise's "Collected" total actually came from.
 *
 * The table showed one number per franchise and nothing behind it: a payout had
 * a history, the money coming in did not, so there was no way to answer "which
 * clients is this made of" without opening the database. This reads the same
 * revenue rows the Collected column aggregates — same status filter, same month
 * window — so the list always adds up to the figure on the row.
 */
function CollectionHistoryModal({
  franchise,
  adminEmail,
  month = "",
  onClose,
  onPreview,
}) {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(
          `/api/franchise-payout?breakdown=1&franchiseCode=${encodeURIComponent(
            franchise.franchiseCode,
          )}&adminEmail=${encodeURIComponent(adminEmail)}${month ? `&month=${month}` : ""}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!alive) return;
        if (!json.success) throw new Error(json.message || "Failed to load collections");
        setEntries(json.data || []);
        setSummary(json.summary || null);
      } catch (err) {
        if (alive) {
          setLoadError(err.message || "Failed to load collections");
          setEntries([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [franchise.franchiseCode, adminEmail, month]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Collection History</h2>
            <p className="text-sm text-gray-500">
              {franchise.franchiseName} · {franchise.franchiseCode}
              {month ? ` · ${monthLabel(month)}` : " · All time"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {summary && !loading && (
          <div className="grid grid-cols-3 gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 text-center">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Clients</div>
              <div className="text-lg font-bold text-gray-950">{summary.count}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Collected</div>
              <div className="text-lg font-bold text-gray-950">
                {formatAmount(summary.gross)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Share (50%)</div>
              <div className="text-lg font-bold text-indigo-700">
                {formatAmount(summary.franchiseEarned)}
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <Loader2 className="mx-auto my-8 animate-spin text-gray-400" size={22} />
          ) : loadError ? (
            <p className="py-10 text-center text-sm text-rose-600">{loadError}</p>
          ) : entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No revenue recorded{month ? ` in ${monthLabel(month)}` : ""} for this franchise.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-2.5 text-left font-semibold">Client</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Plan</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Onboarded by</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => {
                    const proof = entry.paymentScreenshot || entry.screenshot || "";
                    return (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-gray-950">
                            {entry.businessName || entry.leadName || "—"}
                          </div>
                          {entry.businessName && entry.leadName && (
                            <div className="text-xs text-gray-500">{entry.leadName}</div>
                          )}
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                            {entry.phone && <span>{entry.phone}</span>}
                            {entry.email && <span>{entry.email}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          <div>{entry.plan || "—"}</div>
                          {entry.packageExpiryDate && (
                            <div className="text-xs text-gray-400">
                              till {formatDate(entry.packageExpiryDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          <div>{entry.onboardedByName || "—"}</div>
                          {entry.bookingSource && (
                            <div className="text-xs text-gray-400">{entry.bookingSource}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-900">
                          {formatAmount(entry.amount)}
                          {entry.utrNumber && (
                            <div className="text-xs font-normal text-gray-400">
                              UTR {entry.utrNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {proof ? (
                            <button
                              type="button"
                              onClick={() => onPreview?.(proof)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={13} />
                              View
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PayoutHistoryModal({
  franchise,
  adminEmail,
  onClose,
  onPreview,
  onChanged,
}) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reversingId, setReversingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/franchise-payout?franchiseCode=${encodeURIComponent(
          franchise.franchiseCode,
        )}&adminEmail=${encodeURIComponent(adminEmail)}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      setPayouts(json.success ? json.data || [] : []);
    } catch {
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [franchise.franchiseCode, adminEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReverse = async (payout) => {
    if (!window.confirm(`Reverse the ${formatAmount(payout.amount)} payout?`))
      return;

    setReversingId(payout._id);
    try {
      const res = await fetch(
        `/api/franchise-payout?id=${payout._id}&adminEmail=${encodeURIComponent(
          adminEmail,
        )}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.success) {
        await load();
        onChanged?.();
      } else {
        alert(json.message || "Failed to reverse payout");
      }
    } finally {
      setReversingId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Payout History</h2>
            <p className="text-sm text-gray-500">
              {franchise.franchiseName} · {franchise.franchiseCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader2 className="mx-auto my-8 animate-spin text-gray-400" size={22} />
          ) : payouts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No payouts recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout._id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-gray-950">
                        {formatAmount(payout.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(payout.paidAt)} ·{" "}
                        {PAYMENT_MODES.find((m) => m.value === payout.paymentMode)
                          ?.label || payout.paymentMode}
                        {payout.referenceNo ? ` · ${payout.referenceNo}` : ""}
                      </p>
                      {payout.notes && (
                        <p className="mt-1 text-sm text-gray-600">{payout.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {payout.screenshot && (
                        <button
                          type="button"
                          onClick={() => onPreview(payout.screenshot)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Eye size={14} />
                          View Proof
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReverse(payout)}
                        disabled={reversingId === payout._id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Undo2 size={14} />
                        Reverse
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "text-gray-900" }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
