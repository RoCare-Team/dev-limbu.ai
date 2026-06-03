"use client";
import { useEffect, useState } from "react";

export default function ServiceBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log("franchise panel service data:", data);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const franchiseUserRaw = localStorage.getItem("franchise_user");
        const franchiseUser = franchiseUserRaw
          ? JSON.parse(franchiseUserRaw)
          : null;

        const franchiseCode = franchiseUser?.franchiseCode || "";

        if (!franchiseCode) {
          setError("Franchise code not found in localStorage");
          setLoading(false);
          return;
        }

        const url = `/api/franchise-revenue?franchiseCode=${encodeURIComponent(franchiseCode)}&type=service`;

        const res = await fetch(url);
        const json = await res.json();

        if (!json.success)
          throw new Error(json.message || "Failed to fetch bookings");

        setData(json.data); // ✅ json.data — API se match
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Service Bookings</h2>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1e293b] text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-left font-semibold">Plan</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">GST No.</th>
                <th className="px-6 py-4 text-center font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Date</th>
              </tr>
            </thead>

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
                          item.status === "active"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-400 text-white"
                        }`}
                      >
                        {item.status?.toLowerCase()}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5 text-right text-gray-500 text-sm whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
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
                    item.status === "active"
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
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </span>
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
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">
            No booking data found
          </div>
        )}
      </div>
    </div>
  );
}