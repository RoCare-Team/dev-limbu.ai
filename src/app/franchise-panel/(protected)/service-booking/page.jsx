"use client";

import { useEffect, useState } from "react";

export default function ServiceBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Get franchise referCode from localStorage
        const referCode = localStorage.getItem("referCode");
        
        // Build query with referCode filter
        const query = new URLSearchParams({
          planType: "our-service",
          ...(referCode && { referCode })
        });
        
        const res = await fetch(`/api/service-booking?${query.toString()}`);
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
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/service-booking?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setData(data.map(item => item._id === id ? { ...item, status: newStatus } : item));
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

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

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Service Bookings</h2>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Customer</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-left">Plan</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-left">GST No.</th>
                <th className="px-5 py-4 text-center">Payment</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Date</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item._id}
                  className={`border-b transition ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50`}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-800">{item.phone}</div>
                  </td>
                  <td className="px-5 py-4 font-medium text-indigo-600">{item.planTitle}</td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">{item.totalAmount}</td>
                  <td className="px-5 py-4 text-gray-700">{item.gstNumber || "—"}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      item.paymentMethod === "online" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {item.paymentMethod === "online" ? "Online" : "Offline"}
                    </span>
                    {item.paymentMethod === "offline" && item.paymentScreenshot && (
                      <button onClick={() => setSelectedItem(item)} className="block text-xs text-blue-600 hover:underline mt-1">
                        View Screenshot
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)} className="text-xs border rounded px-2 py-1 bg-white">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {data.map((item) => (
          <div key={item._id} className="bg-white rounded-xl shadow p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{item.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                item.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {item.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">📞 {item.phone}</p>
            <p className="text-sm text-gray-600">📧 {item.email}</p>
            <p className="text-sm font-semibold">{item.planTitle}</p>
            <div className="flex justify-between text-sm">
              <span className="font-bold">₹{item.totalAmount}</span>
              <span className="text-gray-500">{new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                item.paymentMethod === "online" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              }`}>
                {item.paymentMethod === "online" ? "Online" : "Offline"}
              </span>
              {item.paymentMethod === "offline" && item.paymentScreenshot && (
                <button onClick={() => setSelectedItem(item)} className="text-xs text-blue-600 hover:underline">
                  View Screenshot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Screenshot Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Payment Screenshot</h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <img src={selectedItem.paymentScreenshot} alt="Payment Screenshot" className="w-full rounded" />
            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{selectedItem.name}</p>
                <p className="text-sm text-gray-500">₹{selectedItem.totalAmount}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateStatus(selectedItem._id, "paid")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Mark as Paid</button>
                <button onClick={() => setSelectedItem(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
