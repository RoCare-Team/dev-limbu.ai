"use client";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const franchiseCode = localStorage.getItem("franchise_code");

      const res = await fetch("/api/razorpay/razorpay-transaction");
      const json = await res.json();

      if (json.success) {
        // ✅ Filter based on referCode
        const filteredTransactions = json.transactions.filter(
          (tx) =>
            tx.user?.referCode &&
            franchiseCode &&
            tx.user.referCode === franchiseCode
        );

        setData(filteredTransactions);
        setTotal(filteredTransactions.length);
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Franchise Transactions</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <>
          <p className="text-lg font-semibold mb-3">
            Total Transactions:{" "}
            <span className="text-blue-600">{total}</span>
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2">User Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Wallet</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Payment ID</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  data.map((tx, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        {tx.user?.fullName || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {tx.user?.email || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {tx.user?.wallet ?? "-"}
                      </td>
                      <td className="px-4 py-2 font-semibold">
                        ₹{tx.totalAmount}
                      </td>
                      <td className="px-4 py-2">{tx.orderId}</td>
                      <td className="px-4 py-2">{tx.paymentId}</td>
                      <td className="px-4 py-2">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


