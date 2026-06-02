"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Building2, Lock, ShieldAlert, ShieldCheck } from "lucide-react";

const ADMIN_PASSWORD = "Manoj@321#";

export default function OnboardedFranchisePage() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/franchise-panel/franchise-getAll", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch franchises");
      }

      setFranchises(data.data || []);
    } catch (err) {
      setError(err.message || "Unable to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const openPasswordPrompt = (franchise) => {
    setSelectedFranchise(franchise);
    setPassword("");
  };

  const closePasswordPrompt = () => {
    setSelectedFranchise(null);
    setPassword("");
  };

  const handleStatusToggle = async () => {
    if (!selectedFranchise) return;

    if (password !== ADMIN_PASSWORD) {
      setError("Incorrect password. Use Manoj@321#");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/franchise-panel/franchise-getAll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFranchise._id,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update franchise status");
      }

      setFranchises((prev) =>
        prev.map((item) =>
          item._id === selectedFranchise._id
            ? { ...item, isActive: data.data.isActive }
            : item
        )
      );

      closePasswordPrompt();
    } catch (err) {
      setError(err.message || "Unable to update status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.2 }}>
        <Building2 size={28} color="#1976d2" />
        <Typography variant="h4" fontWeight={700}>
          OnBoarded Franchise
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Typography>Loading franchise data...</Typography>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2.5,
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellStyle}>Franchise Name</TableCell>
                  <TableCell sx={headCellStyle}>Owner Name</TableCell>
                  <TableCell sx={headCellStyle}>Mobile</TableCell>
                  <TableCell sx={headCellStyle}>Email</TableCell>
                  <TableCell sx={headCellStyle}>Code</TableCell>
                  <TableCell sx={headCellStyle}>Status</TableCell>
                  <TableCell sx={headCellStyle}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {franchises.map((franchise) => (
                <TableRow key={franchise._id} hover>
                  <TableCell sx={bodyCellStyle}>{franchise.franchiseName}</TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.ownerName}</TableCell>
                  <TableCell sx={bodyCellStyle}>
                    {franchise.mobileNumber?.trim()}
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.email}</TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.franchiseCode}</TableCell>
                  <TableCell sx={bodyCellStyle}>
                    <Chip
                      size="small"
                      icon={
                        franchise.isActive ? (
                          <ShieldCheck size={14} />
                        ) : (
                          <ShieldAlert size={14} />
                        )
                      }
                      label={franchise.isActive ? "Active" : "Blocked"}
                      color={franchise.isActive ? "success" : "error"}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => openPasswordPrompt(franchise)}
                      color={franchise.isActive ? "error" : "success"}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "8px",
                      }}
                    >
                      {franchise.isActive ? "Suspend/Block" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {selectedFranchise ? (
        <Dialog
          open={Boolean(selectedFranchise)}
          onClose={closePasswordPrompt}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm status change</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, color: "text.secondary" }}>
              Enter password to change status for{" "}
              <strong>{selectedFranchise.franchiseName}</strong>.
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              InputProps={{
                startAdornment: <Lock size={16} style={{ marginRight: 8 }} />,
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleStatusToggle}
              disabled={submitting}
              variant="contained"
              sx={{ textTransform: "none" }}
            >
                {submitting ? "Processing..." : "Submit"}
            </Button>
            <Button
              onClick={closePasswordPrompt}
              disabled={submitting}
              variant="outlined"
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Container>
  );
}

const headCellStyle = {
  fontWeight: 700,
  bgcolor: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
};

const bodyCellStyle = {
  borderBottom: "1px solid #f1f5f9",
};
