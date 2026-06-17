"use client";

import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { BarChart, Refresh } from "@mui/icons-material";

const METRIC_STYLES = {
  chatsCreated: { color: "#2563eb", bg: "#eff6ff" },
  gmbConnected: { color: "#059669", bg: "#ecfdf5" },
  gmbHealth: { color: "#7c3aed", bg: "#f5f3ff" },
  magicQr: { color: "#c026d3", bg: "#fdf4ff" },
  gmbInsights: { color: "#0284c7", bg: "#f0f9ff" },
  websitesBuilt: { color: "#d97706", bg: "#fffbeb" },
  demoBooked: { color: "#e11d48", bg: "#fff1f2" },
};

export const CHATBOT_METRIC_CARD_DEFS = [
  {
    id: "chatsCreated",
    label: "Chats Created",
    shortLabel: "Chats Created",
    showAgentLeads: true,
  }, // 👈 sirf yahan
  { id: "gmbConnected", label: "GMB Connected", shortLabel: "GMB Connected" },
  { id: "gmbHealth", label: "GMB Health Generated", shortLabel: "GMB Health" },
  { id: "magicQr", label: "Magic QR Created", shortLabel: "Magic QR" },
  {
    id: "gmbInsights",
    label: "GMB Insights Generated",
    shortLabel: "GMB Insights",
  },
  {
    id: "websitesBuilt",
    label: "Websites Built",
    shortLabel: "Websites Built",
  },
  { id: "demoBooked", label: "Demo Booked", shortLabel: "Demo Booked" },
];

function formatCount(count) {
  return Number(count || 0).toLocaleString("en-IN");
}

function PeriodCell({
  period,
  label,
  count,
  loading,
  metricId,
  cardKey,
  active,
  onSelect,
  style,
}) {
  const isToday = period === "today";

  return (
    <Box
      component="button"
      type="button"
      disabled={loading}
      onClick={() =>
        onSelect?.({
          metricId,
          period,
          title: `${isToday ? "Today" : "Total"} ${label}`,
          cardKey,
        })
      }
      sx={{
        flex: 1,
        minWidth: 0,
        width: "50%",
        border: "none",
        cursor: loading ? "default" : "pointer",
        py: 1.5,
        px: 1,
        textAlign: "center",
        transition: "background 0.15s ease, border-color 0.15s ease",
        background: active ? style.bg : "#fff",
        borderRight: isToday ? "none" : `2px solid ${style.color}30`,
        fontFamily: "var(--font-inter)",
        outline: active ? `2px solid ${style.color}` : "none",
        outlineOffset: -2,
        "&:hover:not(:disabled)": {
          background: style.bg,
        },
        "&:disabled": { opacity: 0.7 },
      }}
    >
      <Typography
        sx={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: style.color,
          lineHeight: 1,
        }}
      >
        {isToday ? "Today" : "Total"}
      </Typography>
      <Typography
        component="p"
        sx={{
          mt: 0.75,
          fontSize: "clamp(16px, 2.2vw, 22px)",
          fontWeight: 800,
          lineHeight: 1.1,
          color: "#111827",
          fontVariantNumeric: "tabular-nums",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
        title={loading ? "" : formatCount(count)}
      >
        {loading ? "…" : formatCount(count)}
      </Typography>
    </Box>
  );
}

function MetricBlock({
  metricId,
  label,
  shortLabel,
  total,
  today,
  loading,
  activeCardKey,
  onSelect,
  agentTodayLeads = null, // 👈 ADD
  role = null, // 👈 ADD
}) {
  const style = METRIC_STYLES[metricId] || METRIC_STYLES.chatsCreated;
  const totalKey = `${metricId}:total`;
  const todayKey = `${metricId}:today`;
  const isActive = activeCardKey === totalKey || activeCardKey === todayKey;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "10px",
        border: isActive
          ? `2px solid ${style.color}`
          : `1.5px solid ${style.color}55`,
        background: "#fff",
        overflow: "hidden",
        minWidth: 0,
        fontFamily: "var(--font-inter)",
        "& *": { fontFamily: "var(--font-inter)" },
      }}
    >
      <Box
        sx={{
          px: 1.25,
          py: 0.85,
          borderBottom: `2px solid ${style.color}40`,
          background: style.bg,
        }}
      >
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: style.color,
            textAlign: "center",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={label}
        >
          {shortLabel || label}
        </Typography>
      </Box>

      <Stack
        direction="row"
        sx={{
          minWidth: 0,
          borderTop: `1px solid ${style.color}25`,
        }}
      >
        <PeriodCell
          period="total"
          label={label}
          count={total}
          loading={loading}
          metricId={metricId}
          cardKey={totalKey}
          active={activeCardKey === totalKey}
          onSelect={onSelect}
          style={style}
        />
        <PeriodCell
          period="today"
          label={label}
          count={today}
          loading={loading}
          metricId={metricId}
          cardKey={todayKey}
          active={activeCardKey === todayKey}
          onSelect={onSelect}
          style={style}
        />
      </Stack>

      {/* 👇 Sirf agent ke liye, sirf chatsCreated card mein */}
      {role === "agent" && agentTodayLeads !== null && (
        <Box
          sx={{
            borderTop: `2px solid ${style.color}30`,
            py: 1.25,
            px: 1,
            textAlign: "center",
            background: style.bg,
          }}
        >
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: style.color,
              lineHeight: 1,
            }}
          >
           Today My Leads
          </Typography>

          <Typography
            sx={{
              mt: 0.75,
              fontSize: "clamp(16px, 2.2vw, 22px)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#111827",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {loading ? "…" : formatCount(agentTodayLeads)}
          </Typography>
        </Box>
      )}
    </Card>
  );
}

export default function ChatbotSummaryMetrics({
  totals = {},
  today = {},
  loading = false,
  activeCardKey = "",
  onRefresh,
  onSelectCard,
  agentTodayLeads = null, // 👈 NEW PROP
  role = null, // 👈 NEW PROP
}) {
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
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart sx={{ fontSize: 18, color: "#2563eb" }} />
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
              WhatsApp Chatbot Overview
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "#6b7280", mt: 0.2 }}>
              Total left · Today right — click to filter leads below
            </Typography>
          </Box>
        </Stack>
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
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(140px, 1fr))",
            md: "repeat(3, minmax(160px, 1fr))",
            lg: "repeat(4, minmax(170px, 1fr))",
            xl: "repeat(4, minmax(180px, 1fr))",
          },
          gap: 1.25,
        }}
      >
        {CHATBOT_METRIC_CARD_DEFS.map((row) => (
          <MetricBlock
            key={row.id}
            metricId={row.id}
            label={row.label}
            shortLabel={row.shortLabel}
            total={totals[row.id]}
            today={today[row.id]}
            loading={loading}
            activeCardKey={activeCardKey}
            onSelect={onSelectCard}
            agentTodayLeads={row.showAgentLeads ? agentTodayLeads : null} // 👈 ADD
            role={role} // 👈 PASS ROLE
          />
        ))}
      </Box>
    </Card>
  );
}
