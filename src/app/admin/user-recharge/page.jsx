"use client";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/razorpay/razorpay-transaction");
      const json = await res.json();

      if (json.success) {
        setData(json.transactions);
        setTotal(json.totalTransactions);
      }
    } catch (error) {
      console.error("Frontend fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold text-slate-900">All Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Wallet recharge transactions overview</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading transactions...</div>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-700">
              Total Transactions: <span className="text-xl text-blue-900">{total}</span>
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Wallet</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.map((tx, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.user?.fullName || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.user?.email || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{tx.user?.wallet ?? "-"}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹{tx.totalAmount}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.orderId}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.paymentId}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
