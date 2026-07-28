"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText } from "lucide-react";
import {
  canAccessBookings,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";
import ImagePreviewModal from "@/components/ImagePreviewModal";

export default function FranchisePackageBookingList() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadingId, setDownloadingId] = useState("");

  const handleViewProof = (item) => {
    const proof = item.paymentScreenshot || item.screenshot;
    if (!proof) {
      alert("No payment proof uploaded for this booking");
      return;
    }
    setPreviewUrl(proof);
  };

  const handleInvoice = async (item) => {
    // Prefer the invoice already generated at booking time.
    if (item.invoiceUrl) {
      window.open(item.invoiceUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingId(item._id);
    try {
      const res = await fetch(`/api/admin/invoice-tax?id=${item._id}`);
      if (!res.ok) throw new Error("Invoice generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${item.leadName || "customer"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Invoice download failed");
    } finally {
      setDownloadingId("");
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const franchiseUser = getFranchiseUserFromStorage();
        const token = localStorage.getItem("franchise_token");

        if (!canAccessBookings(franchiseUser?.role)) {
          router.replace("/franchise-panel/dashboard");
          return;
        }

        const franchiseId = franchiseUser?.franchiseCode || "";

        if (!franchiseId || !token) {
          setError("Franchise session not found");
          setLoading(false);
          return;
        }

        const url = `/api/franchise-revenue?franchiseCode=${encodeURIComponent(franchiseId)}&type=plan`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error("Failed to fetch bookings");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 font-semibold py-10">
        {error}
      </div>
    );

  const formatAmount = (val) => {
    const clean = String(val).replace(/[₹,\s]/g, "");
    const num = Number(clean);
    if (!clean || isNaN(num)) return "—";
    return "₹" + num.toLocaleString("en-IN");
  };

  const formatDate = (val) => {
    if (!val) return "—";
    const date = new Date(val);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /** Expiry state drives the End Date colour: expired / expiring soon / ok. */
  const getExpiryState = (val) => {
    if (!val) return { label: "—", tone: "text-gray-400", note: "" };

    const expiry = new Date(val);
    if (isNaN(expiry.getTime())) return { label: "—", tone: "text-gray-400", note: "" };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const expiryDay = new Date(expiry);
    expiryDay.setHours(0, 0, 0, 0);

    const days = Math.round((expiryDay - startOfToday) / 86400000);

    if (days < 0) {
      return {
        label: formatDate(val),
        tone: "text-red-600",
        note: `Expired ${Math.abs(days)}d ago`,
      };
    }
    if (days === 0) {
      return { label: formatDate(val), tone: "text-orange-600", note: "Expires today" };
    }
    if (days <= 7) {
      return {
        label: formatDate(val),
        tone: "text-amber-600",
        note: `${days}d left`,
      };
    }
    return { label: formatDate(val), tone: "text-gray-700", note: `${days}d left` };
  };

  return (
    <div className="p-2 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Package Bookings</h2>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
        {/* Table Header Bar */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            {/* Black sticky thead */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-left font-semibold">Plan</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">GST No.</th>
                <th className="px-6 py-4 text-center font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Booked On</th>
                <th className="px-6 py-4 text-right font-semibold">Start Date</th>
                <th className="px-6 py-4 text-right font-semibold">End Date</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Proof &amp; Invoice
                </th>
              </tr>
            </thead>

            {/* White tbody */}
            <tbody className="bg-white divide-y divide-gray-100">
              {data.length > 0 ? (
                data.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition duration-150"
                  >
                    {/* Customer */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-600 text-white font-semibold text-sm shadow-sm flex-shrink-0">
                          {item.leadName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.leadName}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-5 text-gray-600 font-medium">
                      {item.phone}
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-5">
                      <span className="bg-blue-50 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border border-blue-100">
                        {item.plan}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-5 text-right">
                      <span className="font-bold text-gray-900 text-base">
                        {formatAmount(item.amount)}
                      </span>
                    </td>

                    {/* GST */}
                    <td className="px-6 py-5 text-gray-500 text-sm">
                      {item.gstNumber || "-"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                          item.status !== "inactive"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-400 text-white"
                        }`}
                      >
                        {item.status?.toLowerCase()}
                      </span>
                    </td>

                    {/* Booked On */}
                    <td className="px-6 py-5 text-right text-gray-500 text-sm whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Start Date */}
                    <td className="px-6 py-5 text-right text-gray-700 text-sm whitespace-nowrap">
                      {formatDate(item.packageStartDate)}
                    </td>

                    {/* End Date */}
                    <td className="px-6 py-5 text-right text-sm whitespace-nowrap">
                      {(() => {
                        const expiry = getExpiryState(item.packageExpiryDate);
                        return (
                          <>
                            <div className={`font-semibold ${expiry.tone}`}>
                              {expiry.label}
                            </div>
                            {expiry.note && (
                              <div className={`text-xs ${expiry.tone} opacity-80`}>
                                {expiry.note}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Proof & Invoice */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewProof(item)}
                          disabled={!item.paymentScreenshot && !item.screenshot}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title="View payment proof"
                        >
                          <Eye size={14} />
                          Proof
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInvoice(item)}
                          disabled={downloadingId === item._id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                          title={
                            item.invoiceUrl
                              ? "Open invoice PDF"
                              : "Generate & download invoice"
                          }
                        >
                          {item.invoiceUrl ? (
                            <FileText size={14} />
                          ) : (
                            <Download size={14} />
                          )}
                          {downloadingId === item._id ? "..." : "Invoice"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl mb-3">📦</div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        No Bookings Available
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        No service bookings found for this franchise.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="grid gap-4 md:hidden">
        {data.length > 0 ? (
          data.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow p-4 space-y-2 border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900">
                  {item.leadName}
                </h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    item.status !== "inactive"
                      ? "bg-green-500"
                      : "bg-yellow-400"
                  }`}
                >
                  {item.status?.toLowerCase()}
                </span>
              </div>

              <p className="text-sm text-gray-600">📞 {item.phone}</p>
              <p className="text-sm text-gray-600">📧 {item.email}</p>

              <p className="text-sm font-semibold text-gray-800">{item.plan}</p>

              <div className="flex justify-between text-sm pt-1">
                <span className="font-bold text-gray-900">
                  {formatAmount(item.amount)}
                </span>

                <span className="text-gray-400">
                  Booked {formatDate(item.createdAt)}
                </span>
              </div>

              <div className="flex justify-between gap-3 border-t border-gray-100 pt-2 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Start Date
                  </p>
                  <p className="font-semibold text-gray-700">
                    {formatDate(item.packageStartDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    End Date
                  </p>
                  {(() => {
                    const expiry = getExpiryState(item.packageExpiryDate);
                    return (
                      <>
                        <p className={`font-semibold ${expiry.tone}`}>
                          {expiry.label}
                        </p>
                        {expiry.note && (
                          <p className={`text-xs ${expiry.tone} opacity-80`}>
                            {expiry.note}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => handleViewProof(item)}
                  disabled={!item.paymentScreenshot && !item.screenshot}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  <Eye size={14} />
                  Proof
                </button>
                <button
                  type="button"
                  onClick={() => handleInvoice(item)}
                  disabled={downloadingId === item._id}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-50"
                >
                  {item.invoiceUrl ? <FileText size={14} /> : <Download size={14} />}
                  {downloadingId === item._id ? "..." : "Invoice"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-3">📦</div>

              <h3 className="text-lg font-semibold text-gray-900">
                No Bookings Available
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                No service bookings found for this franchise.
              </p>
            </div>
          </div>
        )}
      </div>

      <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}
