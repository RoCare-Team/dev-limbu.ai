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
        const res = await fetch("/api/service-booking?planType=our-service");
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
      <div className="hidden md:block">
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "20px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "#111827",
                }}
              >
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                  Customer
                </TableCell>

                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                  Contact
                </TableCell>

                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                  Plan
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: "#fff", fontWeight: 700 }}
                >
                  Amount
                </TableCell>

                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                  GST No.
                </TableCell>

                <TableCell
                  align="center"
                  sx={{ color: "#fff", fontWeight: 700 }}
                >
                  Status
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ color: "#fff", fontWeight: 700 }}
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item._id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p>{item.phone}</p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">{item.planTitle}</span>
                    </TableCell>

                    <TableCell align="right">
                      {(item.totalAmount || 0).toLocaleString()}
                    </TableCell>

                    <TableCell>{item.gstNumber || "-"}</TableCell>

                    <TableCell align="center">
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === "paid" ? "success" : "warning"}
                      />
                    </TableCell>

                    <TableCell align="right">
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-xl shadow p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{item.name}</h3>
              {/* Resstart  */}
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
              <span>{item.totalAmount}</span>
              <span className="text-gray-500">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
