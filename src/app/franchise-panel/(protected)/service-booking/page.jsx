"use client";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function ServiceBookingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/service-booking?planType=our-services");
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

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <CircularProgress />
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
                <th className="px-5 py-4 text-left font-semibold">
                  Customer
                </th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-left">Plan</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-left">GST No.</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Date</th>
              </tr>
            </thead>

            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`border-b hover:bg-gray-50 transition ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-5 py-4 font-medium">{item.name}</td>

                    <td className="px-5 py-4">
                      <div>{item.phone}</div>
                      <div className="text-xs text-gray-500">
                        {item.email}
                      </div>
                    </td>

                    <td className="px-5 py-4">{item.planTitle}</td>

                    <td className="px-5 py-4 text-right font-semibold">
                      ₹{item.totalAmount}
                    </td>

                    <td className="px-5 py-4">
                      {item.gstNumber || "-"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-10 text-gray-500"
                  >
                    No booking data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {data.length > 0 ? (
          data.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow p-4 space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{item.name}</h3>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">📞 {item.phone}</p>
              <p className="text-sm text-gray-600">📧 {item.email}</p>

              <p className="text-sm font-semibold">{item.planTitle}</p>

              <div className="flex justify-between text-sm">
                <span>₹{item.totalAmount}</span>

                <span className="text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
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