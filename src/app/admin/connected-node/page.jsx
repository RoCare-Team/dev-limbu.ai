"use client";

import React, { useState, useEffect } from "react";

import SelectedLeadsActionBar7 from "./component-modal/SelectedLeadsActionBar7";


import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { Link2 } from "lucide-react";

export default function ConnectedNodePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // 2) state add karo (useState ke saath)
const [selectedRows, setSelectedRows] = useState([]);

// 3) functions add karo
const handleSelectAll = (checked) => {
  if (checked) {
    setSelectedRows(data.map((row) => row._id));
  } else {
    setSelectedRows([]);
  }
};

const handleSelectRow = (id) => {
  setSelectedRows((prev) =>
    prev.includes(id)
      ? prev.filter((rowId) => rowId !== id)
      : [...prev, id]
  );
};

  const fetchCommonUsers = async (pageIndex, limit) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/common-users?page=${pageIndex + 1}&limit=${limit}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotal(result.pagination.total);
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommonUsers(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        height: "calc(100vh - 80px)", // Taking full height minus navbar
        display: "flex",
        flexDirection: "column",
        py: 3,
      }}
    >
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Link2 size={32} color="#1976d2" />
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Connected Nodes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          flex: 1, // Let paper take remaining height
          display: "flex",
          flexDirection: "column",
          width: "100%",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >

          
            <SelectedLeadsActionBar7 selectedRows={selectedRows} />

        <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
          <Table stickyHeader aria-label="connected users table">


            <TableHead>
              <TableRow>

                <TableCell
      padding="checkbox"
      sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}
    >
      <input
        type="checkbox"
        checked={
          data.length > 0 &&
          selectedRows.length === data.length
        }
        onChange={(e) =>
          handleSelectAll(e.target.checked)
        }
        className="w-4 h-4 accent-blue-600 cursor-pointer"
      />
    </TableCell>

                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  User ID
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Full Name
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Phone
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Wallet (Coins)
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Plan
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", bgcolor: "#f8f9fa" }}>
                  Free Used
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading connected nodes...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((row) => (
                  <TableRow
                    key={row._id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >

                    <TableCell padding="checkbox">
    <input
      type="checkbox"
      checked={selectedRows.includes(row._id)}
      onChange={() => handleSelectRow(row._id)}
      className="w-4 h-4 accent-blue-600 cursor-pointer"
    />
  </TableCell>

                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {row.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.wallet || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.subscription?.plan || "N/A"}
                        size="small"
                        sx={{
                          bgcolor:
                            row.subscription?.plan === "Free"
                              ? "#e0e0e0"
                              : "#e3f2fd",
                          color:
                            row.subscription?.plan === "Free"
                              ? "#616161"
                              : "#1976d2",
                          fontWeight: "bold",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.subscription?.status || "inactive"}
                        size="small"
                        color={
                          row.subscription?.status === "active"
                            ? "success"
                            : "default"
                        }
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {row.freeUsedCount || 0}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">
                      No connected nodes found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: "1px solid #e0e0e0",
            bgcolor: "#fff",
            zIndex: 1, // Keep pagination strictly above scrolling content
          }}
        />
      </Paper>
    </Container>
  );
}
