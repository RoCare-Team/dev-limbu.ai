"use client";

import { useEffect, useMemo, useState } from "react";
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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const ADMIN_PASSWORD = "Manoj@321#";

export default function OnboardedFranchisePage() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // password reveal
  const [passkeyTarget, setPasskeyTarget] = useState(null);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Kis franchise ka impersonation chal raha hai (button spinner ke liye)
  const [impersonatingId, setImpersonatingId] = useState(null);

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

  const filteredFranchises = useMemo(() => {
    const term = search.trim().toLowerCase();

    return franchises.filter((franchise) => {
      if (statusFilter === "active" && !franchise.isActive) return false;
      if (statusFilter === "blocked" && franchise.isActive) return false;
      if (!term) return true;

      return [
        franchise.franchiseName,
        franchise.ownerName,
        franchise.mobileNumber,
        franchise.email,
        franchise.franchiseCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [franchises, search, statusFilter]);

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

  /* ----------------------------
     LOGIN AS FRANCHISE
     Server ek short-lived franchise token banata hai; wahi keys set karke
     franchise panel naye tab me khol dete hain, admin session chhoote bina.
  ---------------------------- */
  const handleLoginAsFranchise = async (franchise) => {
    // Tab click ke andar hi kholna padta hai, warna popup blocker rok deta hai.
    const tab = window.open("", "_blank");

    try {
      setImpersonatingId(franchise._id);
      setError("");

      const res = await fetch("/api/franchise-panel/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ franchiseId: franchise._id }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to log in as this franchise");
      }

      const franchiseCode = data.user.franchiseCode || "";

      // Franchise panel inhi keys se session padhta hai (admin ka `token` alag hai).
      localStorage.setItem("franchise_token", data.token);
      localStorage.setItem("franchise_user", JSON.stringify(data.user));
      localStorage.setItem("franchise_code", franchiseCode);

      if (tab) {
        tab.location.href = "/franchise-panel/dashboard";
      } else {
        // Popup block ho gaya — isi tab me chale jaate hain.
        window.location.href = "/franchise-panel/dashboard";
      }
    } catch (err) {
      tab?.close();
      setError(err.message || "Unable to log in as this franchise");
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleEyeClick = (franchise) => {
    // Already unlocked in this session — just toggle visibility.
    if (revealedPasswords[franchise._id]) {
      setVisiblePasswords((prev) => ({
        ...prev,
        [franchise._id]: !prev[franchise._id],
      }));
      return;
    }

    setPasskeyTarget(franchise);
    setPasskey("");
    setPasskeyError("");
    setNeedsReset(false);
    setNewPassword("");
  };

  const closePasskeyPrompt = () => {
    setPasskeyTarget(null);
    setPasskey("");
    setPasskeyError("");
    setNeedsReset(false);
    setNewPassword("");
  };

  const showPassword = (id, value) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: value }));
    setVisiblePasswords((prev) => ({ ...prev, [id]: true }));
    closePasskeyPrompt();
  };

  const handleRevealPassword = async () => {
    if (!passkeyTarget) return;

    try {
      setRevealing(true);
      setPasskeyError("");

      const res = await fetch("/api/franchise-panel/franchise-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: passkeyTarget._id, passkey }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to reveal password");
      }

      // Old account: hash can't be reversed, so let the admin set a new one.
      if (data.data.needsReset) {
        setNeedsReset(true);
        return;
      }

      showPassword(passkeyTarget._id, data.data.password);
    } catch (err) {
      setPasskeyError(err.message || "Unable to reveal password");
    } finally {
      setRevealing(false);
    }
  };

  const handleSetPassword = async () => {
    if (!passkeyTarget) return;

    try {
      setRevealing(true);
      setPasskeyError("");

      const res = await fetch("/api/franchise-panel/franchise-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: passkeyTarget._id,
          passkey,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to update password");
      }

      showPassword(passkeyTarget._id, data.data.password);
    } catch (err) {
      setPasskeyError(err.message || "Unable to update password");
    } finally {
      setRevealing(false);
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

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2 }}
        alignItems={{ sm: "center" }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, owner, mobile, email or code"
          sx={{ maxWidth: 420, width: "100%" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
        {search || statusFilter !== "all" ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            sx={{ textTransform: "none" }}
          >
            Clear
          </Button>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {filteredFranchises.length} of {franchises.length}
        </Typography>
      </Stack>

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
                  <TableCell sx={headCellStyle}>Password</TableCell>
                  <TableCell sx={headCellStyle}>Status</TableCell>
                  <TableCell sx={headCellStyle}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {filteredFranchises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ ...bodyCellStyle, py: 4 }} align="center">
                    <Typography color="text.secondary">
                      No franchise matches this filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredFranchises.map((franchise) => (
                <TableRow key={franchise._id} hover>
                  <TableCell sx={bodyCellStyle}>{franchise.franchiseName}</TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.ownerName}</TableCell>
                  <TableCell sx={bodyCellStyle}>
                    {franchise.mobileNumber?.trim()}
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.email}</TableCell>
                  <TableCell sx={bodyCellStyle}>{franchise.franchiseCode}</TableCell>
                  <TableCell sx={bodyCellStyle}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", minWidth: 90 }}
                      >
                        {revealedPasswords[franchise._id] &&
                        visiblePasswords[franchise._id]
                          ? revealedPasswords[franchise._id]
                          : "••••••••"}
                      </Typography>
                      <Tooltip
                        title={
                          revealedPasswords[franchise._id]
                            ? visiblePasswords[franchise._id]
                              ? "Hide password"
                              : "Show password"
                            : "Show password (passkey required)"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleEyeClick(franchise)}
                        >
                          {revealedPasswords[franchise._id] &&
                          visiblePasswords[franchise._id] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
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
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleLoginAsFranchise(franchise)}
                        disabled={impersonatingId === franchise._id}
                        startIcon={<LogIn size={14} />}
                        title="Is franchise ke panel me login karo (naya tab)"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {impersonatingId === franchise._id
                          ? "Opening..."
                          : "Login"}
                      </Button>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => openPasswordPrompt(franchise)}
                        color={franchise.isActive ? "error" : "success"}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {franchise.isActive ? "Suspend/Block" : "Activate"}
                      </Button>
                    </Stack>
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

      {passkeyTarget ? (
        <Dialog
          open={Boolean(passkeyTarget)}
          onClose={closePasskeyPrompt}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            {needsReset ? "Set a new password" : "Enter passkey"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, color: "text.secondary" }}>
              {needsReset ? (
                <>
                  This account&apos;s password is stored as a one-way hash, so it
                  cannot be shown. Set a new password for{" "}
                  <strong>{passkeyTarget.franchiseName}</strong> to make it
                  viewable from here.
                </>
              ) : (
                <>
                  Enter the passkey to view the password for{" "}
                  <strong>{passkeyTarget.franchiseName}</strong>.
                </>
              )}
            </Typography>
            {passkeyError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passkeyError}
              </Alert>
            ) : null}
            {needsReset ? (
              <TextField
                fullWidth
                autoFocus
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !revealing) handleSetPassword();
                }}
                placeholder="New password (min 6 characters)"
                helperText="The franchise will need to use this new password to log in."
                InputProps={{
                  startAdornment: <Lock size={16} style={{ marginRight: 8 }} />,
                }}
              />
            ) : (
              <TextField
                fullWidth
                autoFocus
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !revealing) handleRevealPassword();
                }}
                placeholder="Enter passkey"
                InputProps={{
                  startAdornment: (
                    <KeyRound size={16} style={{ marginRight: 8 }} />
                  ),
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={needsReset ? handleSetPassword : handleRevealPassword}
              disabled={
                revealing ||
                (needsReset ? newPassword.trim().length < 6 : !passkey)
              }
              variant="contained"
              sx={{ textTransform: "none" }}
            >
              {revealing
                ? needsReset
                  ? "Saving..."
                  : "Verifying..."
                : needsReset
                  ? "Save & show"
                  : "Show password"}
            </Button>
            <Button
              onClick={closePasskeyPrompt}
              disabled={revealing}
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
