"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { PhoneInTalk, Refresh, Close } from "@mui/icons-material";

function formatCount(count) {
  return Number(count || 0).toLocaleString("en-IN");
}

function titleCase(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatIstTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const STAGE_COLORS = {
  Active: { color: "#059669", bg: "#ecfdf5" },
  "Follow Up": { color: "#b45309", bg: "#fffbeb" },
  Inactive: { color: "#6b7280", bg: "#f3f4f6" },
  Onboard: { color: "#2563eb", bg: "#eff6ff" },
};

const STATUS_COLORS = {
  Hot: { color: "#dc2626", bg: "#fef2f2" },
  Warm: { color: "#ea580c", bg: "#fff7ed" },
  Cold: { color: "#0284c7", bg: "#f0f9ff" },
};

function Chip({ label, color, bg }) {
  if (!label) return null;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 0.75,
        py: 0.15,
        borderRadius: "6px",
        border: `1px solid ${color}40`,
        background: bg,
        color,
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  );
}

/** A clickable count cell — opens the "which leads were called" drill-down. */
function CountButton({ value, color, active, onClick, size = 14 }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      title="Click to see which leads were called"
      sx={{
        border: active ? `2px solid ${color}` : "1px solid transparent",
        background: active ? `${color}12` : "transparent",
        borderRadius: "8px",
        px: 0.9,
        py: 0.25,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: `${size}px`,
        fontWeight: 800,
        color,
        fontVariantNumeric: "tabular-nums",
        transition: "background 0.15s ease, border-color 0.15s ease",
        "&:hover": { background: `${color}1f` },
      }}
    >
      {formatCount(value)}
    </Box>
  );
}

function TotalChip({ label, value, color, bg, active, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      title="Click to see which leads were called"
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: "10px",
        border: active ? `2px solid ${color}` : `1.5px solid ${color}55`,
        background: bg,
        minWidth: 110,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": { boxShadow: `0 0 0 3px ${color}22` },
      }}
    >
      <Typography
        sx={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color,
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: "20px",
          fontWeight: 800,
          lineHeight: 1.1,
          color: "#111827",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatCount(value)}
      </Typography>
    </Box>
  );
}

function CalledLeadsList({ selection, state, onClose }) {
  const { loading, error, leads, stats, truncated } = state;
  const periodLabel = selection.period === "yesterday" ? "Yesterday" : "Today";
  const whoLabel = selection.displayName
    ? titleCase(selection.displayName)
    : "All agents";

  return (
    <Box
      sx={{
        mt: 1.25,
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.25, py: 0.9, background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
      >
        <Box>
          <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
            Leads talked to — {whoLabel} · {periodLabel}
          </Typography>
          <Typography sx={{ fontSize: "10px", color: "#6b7280", mt: 0.2 }}>
            {loading
              ? "Loading…"
              : `${formatCount(stats.totalLeads)} leads · ${formatCount(stats.totalCalls)} calls${truncated ? " (showing first 500)" : ""}`}
          </Typography>
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          sx={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: "8px",
            px: 0.75,
            py: 0.4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#6b7280",
            "&:hover": { background: "#f3f4f6" },
          }}
        >
          <Close sx={{ fontSize: 14 }} />
        </Box>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.25, py: 1.5 }}>
          <CircularProgress size={14} />
          <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
            Fetching called leads…
          </Typography>
        </Stack>
      ) : error ? (
        <Typography sx={{ fontSize: "12px", color: "#dc2626", px: 1.25, py: 1.5 }}>
          {error}
        </Typography>
      ) : leads.length === 0 ? (
        <Typography sx={{ fontSize: "12px", color: "#6b7280", px: 1.25, py: 1.5 }}>
          No leads were called in this period.
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
          {leads.map((lead) => {
            const stage = STAGE_COLORS[lead.leadStage];
            const status = STATUS_COLORS[lead.leadStatus];
            return (
              <Box
                key={lead._id}
                sx={{
                  px: 1.25,
                  py: 0.9,
                  borderBottom: "1px solid #f1f5f9",
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                      {lead.fullName || "Unnamed lead"}
                    </Typography>
                    {lead.phone && (
                      <Typography sx={{ fontSize: "11px", color: "#4b5563", fontVariantNumeric: "tabular-nums" }}>
                        {lead.phone}
                      </Typography>
                    )}
                    {stage && <Chip label={lead.leadStage} {...stage} />}
                    {status && <Chip label={lead.leadStatus} {...status} />}
                  </Stack>
                  <Typography sx={{ fontSize: "10px", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {lead.callCount > 1 ? `${lead.callCount} calls · ` : ""}
                    last {formatIstTime(lead.lastCalledAt)}
                  </Typography>
                </Stack>

                <Box sx={{ mt: 0.5, pl: 0.25 }}>
                  {(lead.calls || []).map((call, i) => (
                    <Stack
                      key={`${lead._id}-${i}`}
                      direction="row"
                      spacing={0.75}
                      alignItems="baseline"
                      sx={{ mt: i === 0 ? 0 : 0.3 }}
                    >
                      <Typography
                        sx={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          minWidth: 62,
                          whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatIstTime(call.calledAt)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#7c3aed",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {titleCase(call.agentName)}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: call.remark ? "#374151" : "#9ca3af" }}>
                        {call.remark || "— no remark —"}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/**
 * Super-admin only: how many calls each agent made today vs yesterday, and
 * clicking any count drills into which leads were talked to (with remarks).
 * Counts come from /api/admin/call-stats, the drill-down from
 * /api/admin/agent-called-leads — both use IST day boundaries.
 */
export default function AgentCallStatsPanel({
  rows = [],
  totalToday = 0,
  totalYesterday = 0,
  loading = false,
  onRefresh,
}) {
  const [selection, setSelection] = useState(null);
  const [leadsState, setLeadsState] = useState({
    loading: false,
    error: "",
    leads: [],
    stats: { totalLeads: 0, totalCalls: 0 },
    truncated: false,
  });

  const agents = [...rows].sort(
    (a, b) =>
      (b.today || 0) - (a.today || 0) || (b.yesterday || 0) - (a.yesterday || 0),
  );

  const toggleSelection = useCallback((next) => {
    setSelection((prev) =>
      prev &&
      prev.period === next.period &&
      (prev.agentName || "") === (next.agentName || "")
        ? null
        : next,
    );
  }, []);

  useEffect(() => {
    if (!selection) return;

    const adminEmail =
      localStorage.getItem("adminEmail") || localStorage.getItem("email");
    if (!adminEmail) {
      setLeadsState((s) => ({ ...s, loading: false, error: "Admin email not found." }));
      return;
    }

    let cancelled = false;
    setLeadsState((s) => ({ ...s, loading: true, error: "" }));

    const params = new URLSearchParams({
      email: adminEmail,
      period: selection.period,
    });
    if (selection.agentName) params.set("agentName", selection.agentName);

    fetch(`/api/admin/agent-called-leads?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setLeadsState({
            loading: false,
            error: data.error || "Failed to load called leads.",
            leads: [],
            stats: { totalLeads: 0, totalCalls: 0 },
            truncated: false,
          });
          return;
        }
        setLeadsState({
          loading: false,
          error: "",
          leads: data.leads || [],
          stats: data.stats || { totalLeads: 0, totalCalls: 0 },
          truncated: Boolean(data.truncated),
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch called leads:", err);
        setLeadsState({
          loading: false,
          error: "Failed to load called leads.",
          leads: [],
          stats: { totalLeads: 0, totalCalls: 0 },
          truncated: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selection]);

  const isSelected = (agentName, period) =>
    Boolean(
      selection &&
        selection.period === period &&
        (selection.agentName || "") === (agentName || ""),
    );

  return (
    <Card
      elevation={0}
      sx={{
        border: "2px solid #d1d5db",
        borderRadius: "12px",
        p: 1.5,
        mb: 1.5,
        background: "#fafafa",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        mb={1.5}
        flexWrap="wrap"
        useFlexGap
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneInTalk sx={{ fontSize: 18, color: "#7c3aed" }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#111827",
              }}
            >
              Agent Call Activity
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "#6b7280", mt: 0.2 }}>
              Calls today vs yesterday (IST) — click any number to see which
              leads were talked to
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TotalChip
            label="Today"
            value={totalToday}
            color="#7c3aed"
            bg="#f5f3ff"
            active={isSelected(null, "today")}
            onClick={() =>
              toggleSelection({ agentName: null, displayName: "", period: "today" })
            }
          />
          <TotalChip
            label="Yesterday"
            value={totalYesterday}
            color="#0284c7"
            bg="#f0f9ff"
            active={isSelected(null, "yesterday")}
            onClick={() =>
              toggleSelection({ agentName: null, displayName: "", period: "yesterday" })
            }
          />
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={loading}
              size="small"
              variant="outlined"
              startIcon={
                loading ? (
                  <CircularProgress size={12} />
                ) : (
                  <Refresh sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                minWidth: "auto",
                flexShrink: 0,
                px: 1.2,
                py: 0.4,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "10px",
                fontWeight: 700,
                borderColor: "#e5e7eb",
                color: "#374151",
              }}
            >
              Refresh
            </Button>
          )}
        </Stack>
      </Stack>

      {loading && agents.length === 0 ? (
        <Typography sx={{ fontSize: "12px", color: "#6b7280", py: 1 }}>
          Loading agent call stats…
        </Typography>
      ) : agents.length === 0 ? (
        <Typography sx={{ fontSize: "12px", color: "#6b7280", py: 1 }}>
          No calls logged today or yesterday.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 420,
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              fontFamily: "var(--font-inter)",
              "& th, & td": {
                px: 1.25,
                py: 0.9,
                fontSize: "12px",
                textAlign: "right",
                borderBottom: "1px solid #f1f5f9",
                whiteSpace: "nowrap",
              },
              "& th": {
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "#6b7280",
                background: "#f9fafb",
              },
              "& th:first-of-type, & td:first-of-type": { textAlign: "left" },
              "& tr:last-of-type td": { borderBottom: "none" },
            }}
          >
            <thead>
              <tr>
                <th>Agent</th>
                <th>Today</th>
                <th>Yesterday</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const today = a.today || 0;
                const yesterday = a.yesterday || 0;
                const diff = today - yesterday;
                const diffColor =
                  diff > 0 ? "#059669" : diff < 0 ? "#dc2626" : "#9ca3af";
                return (
                  <Box component="tr" key={a.agentName || a.displayName}>
                    <td>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {titleCase(a.displayName || a.agentName)}
                      </Typography>
                    </td>
                    <td>
                      <CountButton
                        value={today}
                        color="#7c3aed"
                        active={isSelected(a.agentName, "today")}
                        onClick={() =>
                          toggleSelection({
                            agentName: a.agentName,
                            displayName: a.displayName || a.agentName,
                            period: "today",
                          })
                        }
                      />
                    </td>
                    <td>
                      <CountButton
                        value={yesterday}
                        color="#0284c7"
                        active={isSelected(a.agentName, "yesterday")}
                        onClick={() =>
                          toggleSelection({
                            agentName: a.agentName,
                            displayName: a.displayName || a.agentName,
                            period: "yesterday",
                          })
                        }
                      />
                    </td>
                    <td>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: diffColor,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </Typography>
                    </td>
                  </Box>
                );
              })}
            </tbody>
          </Box>
        </Box>
      )}

      {selection && (
        <CalledLeadsList
          selection={selection}
          state={leadsState}
          onClose={() => setSelection(null)}
        />
      )}
    </Card>
  );
}
