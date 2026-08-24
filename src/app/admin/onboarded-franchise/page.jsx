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
  LinearProgress,
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
  Ban,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from "lucide-react";

const ADMIN_PASSWORD = "Manoj@321#";

/** Franchise panel ka public login page — franchise owners ko yahi share karna hai. */
const FRANCHISE_LOGIN_URL = "https://www.limbu.ai/franchise-panel/login";

/* ----------------------------
   DATE HELPERS
---------------------------- */
const DATE_FMT = { day: "2-digit", month: "short", year: "numeric" };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", DATE_FMT);
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", DATE_FMT)}, ${d.toLocaleTimeString(
    "en-IN",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

/** "3 days ago" / "2 months ago" — table me date ke neeche context ke liye. */
function relativeTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Monthly bucket key, e.g. "Aug 2026". */
function monthKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function OnboardedFranchisePage() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  /** Status dialog ka error — dialog ke andar hi dikhta hai. */
  const [statusError, setStatusError] = useState("");
  /** Success message (suspend/activate/delete ke baad). */
  const [notice, setNotice] = useState("");

  // delete flow — password ke baad hi delete hota hai
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // password reveal
  const [passkeyTarget, setPasskeyTarget] = useState(null);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  /* ----------------------------
     STATS — total / active / blocked / is mahine / latest
  ---------------------------- */
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(Date.now() - 30 * 86400000);

    const active = franchises.filter((f) => f.isActive).length;
    const thisMonth = franchises.filter(
      (f) => f.createdAt && new Date(f.createdAt) >= monthStart,
    ).length;
    const last30Days = franchises.filter(
      (f) => f.createdAt && new Date(f.createdAt) >= last30,
    ).length;
    const dates = franchises
      .map((f) => f.createdAt && new Date(f.createdAt))
      .filter((d) => d && !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);

    return {
      total: franchises.length,
      active,
      blocked: franchises.length - active,
      thisMonth,
      last30Days,
      firstOnboardedAt: dates[0] || null,
      lastOnboardedAt: dates[dates.length - 1] || null,
    };
  }, [franchises]);

  const statCards = [
    {
      label: "Total Franchises",
      value: stats.total,
      icon: Building2,
      color: "#2563eb",
      bg: "#eff6ff",
      hint: stats.firstOnboardedAt
        ? `since ${formatDate(stats.firstOnboardedAt)}`
        : null,
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle2,
      color: "#16a34a",
      bg: "#f0fdf4",
      hint: stats.total
        ? `${Math.round((stats.active / stats.total) * 100)}% of all`
        : null,
    },
    {
      label: "Blocked",
      value: stats.blocked,
      icon: Ban,
      color: "#dc2626",
      bg: "#fef2f2",
      hint: stats.blocked ? "suspended accounts" : "none suspended",
    },
    {
      label: "This Month",
      value: stats.thisMonth,
      icon: TrendingUp,
      color: "#7c3aed",
      bg: "#f5f3ff",
      hint: `${stats.last30Days} in last 30 days`,
    },
    {
      label: "Latest Onboarded",
      value: stats.lastOnboardedAt ? relativeTime(stats.lastOnboardedAt) : "—",
      icon: CalendarDays,
      color: "#d97706",
      bg: "#fffbeb",
      hint: stats.lastOnboardedAt ? formatDate(stats.lastOnboardedAt) : null,
    },
  ];

  /* ----------------------------
     ONBOARDING TIMELINE — mahine ke hisaab se count
  ---------------------------- */
  const timeline = useMemo(() => {
    const buckets = new Map();

    franchises.forEach((f) => {
      if (!f.createdAt) return;
      const key = monthKey(f.createdAt);
      const entry = buckets.get(key) || { key, count: 0, sortAt: 0, names: [] };
      entry.count += 1;
      entry.sortAt = Math.max(entry.sortAt, new Date(f.createdAt).getTime());
      entry.names.push(f.franchiseName);
      buckets.set(key, entry);
    });

    const rows = Array.from(buckets.values()).sort((a, b) => b.sortAt - a.sortAt);
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

    return { rows: rows.slice(0, 6), max };
  }, [franchises]);

  /* ----------------------------
     FILTER + SORT
  ---------------------------- */
  const filteredFranchises = useMemo(() => {
    const term = search.trim().toLowerCase();

    const list = franchises.filter((franchise) => {
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

    const at = (f) => new Date(f.createdAt || 0).getTime();

    return [...list].sort((a, b) => {
      if (sortBy === "oldest") return at(a) - at(b);
      if (sortBy === "name")
        return String(a.franchiseName || "").localeCompare(
          String(b.franchiseName || ""),
        );
      return at(b) - at(a); // newest
    });
  }, [franchises, search, statusFilter, sortBy]);

  const openPasswordPrompt = (franchise) => {
    setSelectedFranchise(franchise);
    setPassword("");
    setStatusError("");
  };

  const closePasswordPrompt = () => {
    setSelectedFranchise(null);
    setPassword("");
    setStatusError("");
  };

  const handleStatusToggle = async () => {
    if (!selectedFranchise) return;

    // Error dialog ke andar dikhana zaroori hai — page-level Alert modal ke
    // peeche chhup jaata tha, isliye kuch hota hua hi nahi lagta tha.
    if (password !== ADMIN_PASSWORD) {
      setStatusError("Incorrect password. Try again.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusError("");

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

      setNotice(
        `${selectedFranchise.franchiseName} ${
          data.data.isActive ? "activated" : "suspended"
        } successfully`
      );
      closePasswordPrompt();
    } catch (err) {
      setStatusError(err.message || "Unable to update status");
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------
     DELETE FRANCHISE — password ke baad hi
  ---------------------------- */
  const openDeletePrompt = (franchise) => {
    setDeleteTarget(franchise);
    setDeletePassword("");
    setDeleteError("");
  };

  const closeDeletePrompt = () => {
    setDeleteTarget(null);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDeleteFranchise = async () => {
    if (!deleteTarget) return;

    if (deletePassword !== ADMIN_PASSWORD) {
      setDeleteError("Incorrect password. Try again.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const res = await fetch("/api/franchise-panel/franchise-getAll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget._id,
          password: deletePassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete franchise");
      }

      setFranchises((prev) =>
        prev.filter((item) => item._id !== deleteTarget._id)
      );
      setNotice(`${deleteTarget.franchiseName} deleted permanently`);
      closeDeletePrompt();
    } catch (err) {
      setDeleteError(err.message || "Unable to delete franchise");
    } finally {
      setDeleting(false);
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

  const copyLoginLink = async () => {
    try {
      await navigator.clipboard.writeText(FRANCHISE_LOGIN_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const copyPassword = async (id) => {
    try {
      await navigator.clipboard.writeText(revealedPasswords[id]);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3, maxWidth: 1600 }}>
      {/* ---------- HEADER ---------- */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "#eff6ff",
            }}
          >
            <Building2 size={24} color="#2563eb" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              OnBoarded Franchise
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Franchise accounts, onboarding history aur panel access — ek jagah
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title={FRANCHISE_LOGIN_URL}>
            <Button
              component="a"
              href={FRANCHISE_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              startIcon={<ExternalLink size={16} />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Franchise Login
            </Button>
          </Tooltip>

          <Tooltip title={copiedLink ? "Link copied!" : "Copy login link"}>
            <IconButton
              onClick={copyLoginLink}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                color: copiedLink ? "#16a34a" : "#475569",
              }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            </IconButton>
          </Tooltip>

          <Button
            onClick={fetchFranchises}
            disabled={loading}
            variant="outlined"
            startIcon={
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : undefined}
              />
            }
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : null}

      {notice ? (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      ) : null}

      {/* ---------- STAT CARDS ---------- */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          mb: 2.5,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
        }}
      >
        {statCards.map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid #e5e7eb",
              borderRadius: 2.5,
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: card.bg,
                flexShrink: 0,
              }}
            >
              <card.icon size={19} color={card.color} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                {card.label}
              </Typography>
              <Typography variant="h5" fontWeight={800} lineHeight={1.25}>
                {card.value}
              </Typography>
              {card.hint ? (
                <Typography
                  variant="caption"
                  sx={{ color: "text.disabled", display: "block" }}
                >
                  {card.hint}
                </Typography>
              ) : null}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ---------- ONBOARDING TIMELINE ---------- */}
      {timeline.rows.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            border: "1px solid #e5e7eb",
            borderRadius: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CalendarDays size={17} color="#7c3aed" />
            <Typography variant="subtitle2" fontWeight={800}>
              Onboarding timeline
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (last {timeline.rows.length} month
              {timeline.rows.length === 1 ? "" : "s"} with signups)
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {timeline.rows.map((row) => (
              <Box
                key={row.key}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Typography
                  variant="caption"
                  sx={{ width: 84, flexShrink: 0, fontWeight: 600 }}
                >
                  {row.key}
                </Typography>

                <Tooltip title={row.names.join(", ")} placement="top">
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(row.count / timeline.max) * 100}
                      sx={{
                        height: 9,
                        borderRadius: 5,
                        bgcolor: "#f1f5f9",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor: "#7c3aed",
                        },
                      }}
                    />
                  </Box>
                </Tooltip>

                <Typography
                  variant="caption"
                  sx={{ width: 70, flexShrink: 0, color: "text.secondary" }}
                >
                  {row.count} franchise{row.count === 1 ? "" : "s"}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ---------- FILTERS ---------- */}
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
          sx={{ maxWidth: 380, width: "100%" }}
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
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="blocked">Blocked</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 175 }}
        >
          <MenuItem value="newest">Newest onboarded</MenuItem>
          <MenuItem value="oldest">Oldest onboarded</MenuItem>
          <MenuItem value="name">Franchise name (A–Z)</MenuItem>
        </TextField>
        {search || statusFilter !== "all" || sortBy !== "newest" ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setSortBy("newest");
            }}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Clear
          </Button>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {filteredFranchises.length} of {franchises.length}
        </Typography>
      </Stack>

      {/* ---------- TABLE ---------- */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: "1px solid #e5e7eb",
            borderRadius: 2.5,
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            Loading franchise data...
          </Typography>
        </Paper>
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
          <TableContainer sx={{ overflowX: "auto", maxHeight: 660 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellStyle}>Franchise</TableCell>
                  <TableCell sx={headCellStyle}>Owner</TableCell>
                  <TableCell sx={headCellStyle}>Contact</TableCell>
                  <TableCell sx={headCellStyle}>Onboarded</TableCell>
                  <TableCell sx={headCellStyle}>Password</TableCell>
                  <TableCell sx={headCellStyle}>Status</TableCell>
                  <TableCell sx={{ ...headCellStyle, textAlign: "right" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFranchises.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      sx={{ ...bodyCellStyle, py: 5 }}
                      align="center"
                    >
                      <Typography color="text.secondary">
                        No franchise matches this filter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {filteredFranchises.map((franchise) => (
                  <TableRow key={franchise._id} hover>
                    {/* FRANCHISE — name + code */}
                    <TableCell sx={bodyCellStyle}>
                      <Typography variant="body2" fontWeight={700}>
                        {franchise.franchiseName}
                      </Typography>
                      <Chip
                        label={franchise.franchiseCode}
                        size="small"
                        sx={{
                          mt: 0.4,
                          height: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: "monospace",
                          bgcolor: "#f1f5f9",
                          color: "#334155",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={bodyCellStyle}>
                      <Typography variant="body2">
                        {franchise.ownerName}
                      </Typography>
                    </TableCell>

                    {/* CONTACT — mobile + email stacked (width bachane ke liye) */}
                    <TableCell sx={bodyCellStyle}>
                      <Typography variant="body2" fontWeight={600}>
                        {franchise.mobileNumber?.trim() || "—"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", wordBreak: "break-all" }}
                      >
                        {franchise.email}
                      </Typography>
                    </TableCell>

                    {/* ONBOARDED — date + relative */}
                    <TableCell sx={bodyCellStyle}>
                      <Tooltip title={formatDateTime(franchise.createdAt)}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formatDate(franchise.createdAt)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.disabled" }}
                          >
                            {relativeTime(franchise.createdAt)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* PASSWORD — passkey ke baad hi visible */}
                    <TableCell sx={bodyCellStyle}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                        <Box
                          component="span"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: 12.5,
                            px: 1,
                            py: 0.6,
                            borderRadius: 1.5,
                            border: "1px solid",
                            minWidth: 96,
                            display: "inline-block",
                            ...(revealedPasswords[franchise._id] &&
                            visiblePasswords[franchise._id]
                              ? {
                                  bgcolor: "#eff6ff",
                                  borderColor: "#bfdbfe",
                                  color: "#1e40af",
                                  userSelect: "all",
                                }
                              : {
                                  bgcolor: "#f8fafc",
                                  borderColor: "#e2e8f0",
                                  color: "#94a3b8",
                                  letterSpacing: 3,
                                }),
                          }}
                        >
                          {revealedPasswords[franchise._id] &&
                          visiblePasswords[franchise._id]
                            ? revealedPasswords[franchise._id]
                            : "••••••••"}
                        </Box>

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
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </IconButton>
                        </Tooltip>

                        {revealedPasswords[franchise._id] &&
                        visiblePasswords[franchise._id] ? (
                          <Tooltip
                            title={
                              copiedId === franchise._id ? "Copied!" : "Copy"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() => copyPassword(franchise._id)}
                            >
                              <Copy
                                size={15}
                                color={
                                  copiedId === franchise._id
                                    ? "#16a34a"
                                    : undefined
                                }
                              />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Box>
                    </TableCell>

                    <TableCell sx={bodyCellStyle}>
                      <Chip
                        size="small"
                        icon={
                          franchise.isActive ? (
                            <ShieldCheck size={13} />
                          ) : (
                            <ShieldAlert size={13} />
                          )
                        }
                        label={franchise.isActive ? "Active" : "Blocked"}
                        color={franchise.isActive ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell sx={bodyCellStyle} align="right">
                      <Stack
                        direction="row"
                        spacing={0.8}
                        justifyContent="flex-end"
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleLoginAsFranchise(franchise)}
                          disabled={impersonatingId === franchise._id}
                          startIcon={<LogIn size={13} />}
                          title="Is franchise ke panel me login karo (naya tab)"
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
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
                            borderRadius: 2,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {franchise.isActive ? "Suspend" : "Activate"}
                        </Button>

                        <Tooltip title="Delete franchise permanently">
                          <IconButton
                            size="small"
                            onClick={() => openDeletePrompt(franchise)}
                            sx={{
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: 2,
                              "&:hover": { bgcolor: "#fef2f2" },
                            }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ---------- STATUS CHANGE DIALOG ---------- */}
      {selectedFranchise ? (
        <Dialog
          open={Boolean(selectedFranchise)}
          onClose={closePasswordPrompt}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            {selectedFranchise.isActive
              ? "Suspend franchise"
              : "Activate franchise"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1.5, color: "text.secondary" }}>
              <strong>{selectedFranchise.franchiseName}</strong> (
              {selectedFranchise.franchiseCode}) ko{" "}
              <strong>
                {selectedFranchise.isActive ? "Blocked" : "Active"}
              </strong>{" "}
              karne ke liye admin password daalein.
            </Typography>

            {statusError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {statusError}
              </Alert>
            ) : null}

            <TextField
              fullWidth
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting && password) {
                  handleStatusToggle();
                }
              }}
              placeholder="Enter admin password"
              InputProps={{
                startAdornment: <Lock size={16} style={{ marginRight: 8 }} />,
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleStatusToggle}
              disabled={submitting || !password}
              variant="contained"
              color={selectedFranchise.isActive ? "error" : "success"}
              sx={{ textTransform: "none" }}
            >
              {submitting
                ? "Processing..."
                : selectedFranchise.isActive
                  ? "Suspend"
                  : "Activate"}
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

      {/* ---------- DELETE DIALOG ---------- */}
      {deleteTarget ? (
        <Dialog
          open={Boolean(deleteTarget)}
          onClose={closeDeletePrompt}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#b91c1c" }}>
            Delete franchise
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ye action undo nahi ho sakta. <strong>{deleteTarget.franchiseName}</strong>{" "}
              ({deleteTarget.franchiseCode}) ka account permanently delete ho
              jayega aur wo panel me login nahi kar payega.
            </Alert>

            <Typography sx={{ mb: 1.5, color: "text.secondary" }}>
              Confirm karne ke liye admin password daalein.
            </Typography>

            {deleteError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {deleteError}
              </Alert>
            ) : null}

            <TextField
              fullWidth
              autoFocus
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !deleting && deletePassword) {
                  handleDeleteFranchise();
                }
              }}
              placeholder="Enter admin password"
              InputProps={{
                startAdornment: <Lock size={16} style={{ marginRight: 8 }} />,
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDeleteFranchise}
              disabled={deleting || !deletePassword}
              variant="contained"
              color="error"
              startIcon={<Trash2 size={15} />}
              sx={{ textTransform: "none" }}
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
            <Button
              onClick={closeDeletePrompt}
              disabled={deleting}
              variant="outlined"
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}

      {/* ---------- PASSWORD PASSKEY DIALOG ---------- */}
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
  fontWeight: 800,
  fontSize: 12.5,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: "#475569",
  bgcolor: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const bodyCellStyle = {
  borderBottom: "1px solid #f1f5f9",
  py: 1.4,
};
