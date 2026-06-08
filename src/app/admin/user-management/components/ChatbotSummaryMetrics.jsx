"use client";

import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { BarChart, Refresh } from "@mui/icons-material";

const METRIC_STYLES = {
  chatsCreated: { color: "#2563eb", bg: "#dbeafe" },
  gmbConnected: { color: "#059669", bg: "#d1fae5" },
  gmbHealth: { color: "#8b5cf6", bg: "#ede9fe" },
  magicQr: { color: "#d946ef", bg: "#f5d0fe" },
  gmbInsights: { color: "#0ea5e9", bg: "#d0f2fe" },
  websitesBuilt: { color: "#f59e0b", bg: "#fef3c7" },
  demoBooked: { color: "#e11d48", bg: "#ffe4e6" },
};

export const CHATBOT_METRIC_CARD_DEFS = [
  { id: "chatsCreated", totalTitle: "Total Chats Created", todayTitle: "Today Chats Created" },
  { id: "gmbConnected", totalTitle: "Total GMB Connected", todayTitle: "Today GMB Connected" },
  {
    id: "gmbHealth",
    totalTitle: "Total GMB Health Generated",
    todayTitle: "Today GMB Health Generated",
  },
  {
    id: "magicQr",
    totalTitle: "Total Magic QR Created",
    todayTitle: "Today Magic QR Created",
  },
  {
    id: "gmbInsights",
    totalTitle: "Total GMB Insights Generated",
    todayTitle: "Today GMB Insights Generated",
  },
  {
    id: "websitesBuilt",
    totalTitle: "Total Websites Built",
    todayTitle: "Today Websites Built",
  },
  {
    id: "demoBooked",
    totalTitle: "Total Demo Booked",
    todayTitle: "Today Demo Booked",
  },
];

function MetricCard({
  title,
  count,
  loading,
  variant = "total",
  metricId,
  cardKey,
  active,
  onSelect,
}) {
  const style = METRIC_STYLES[metricId] || METRIC_STYLES.chatsCreated;
  const isToday = variant === "today";
  const highlighted = active;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "12px",
        border: highlighted
          ? `2px solid ${style.color}`
          : isToday
            ? `1.5px solid ${style.color}`
            : "1px solid #e5e7eb",
        background: highlighted ? style.color : isToday ? style.bg : "#fff",
        overflow: "hidden",
        fontFamily: "var(--font-inter)",
        "& *": { fontFamily: "var(--font-inter)" },
      }}
    >
      <CardActionArea
        disabled={loading}
        onClick={() => onSelect?.({ metricId, period: variant, title, cardKey })}
        sx={{ p: 1.25, minHeight: 96 }}
      >
        <Typography
          sx={{
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: highlighted ? "rgba(255,255,255,0.9)" : "#6b7280",
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            mt: 0.75,
            fontSize: "26px",
            fontWeight: 900,
            lineHeight: 1,
            color: highlighted ? "#fff" : isToday ? style.color : "#111827",
          }}
        >
          {loading ? "…" : Number(count || 0).toLocaleString("en-IN")}
        </Typography>
        <Chip
          label={highlighted ? "Showing in table" : "Click to view"}
          size="small"
          sx={{
            mt: 1,
            height: 20,
            fontSize: "9px",
            fontWeight: 700,
            background: highlighted ? "rgba(255,255,255,0.2)" : style.bg,
            color: highlighted ? "#fff" : style.color,
            borderRadius: "6px",
          }}
        />
      </CardActionArea>
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
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        p: 1.5,
        mb: 1.5,
        background: "#fff",
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
              Click any card to view leads in the table below
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
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
            xl: "repeat(7, minmax(0, 1fr))",
          },
          gap: 1,
        }}
      >
        {CHATBOT_METRIC_CARD_DEFS.flatMap((row) => [
          <MetricCard
            key={`${row.id}-total`}
            cardKey={`${row.id}:total`}
            metricId={row.id}
            title={row.totalTitle}
            count={totals[row.id]}
            loading={loading}
            variant="total"
            active={activeCardKey === `${row.id}:total`}
            onSelect={onSelectCard}
          />,
          <MetricCard
            key={`${row.id}-today`}
            cardKey={`${row.id}:today`}
            metricId={row.id}
            title={row.todayTitle}
            count={today[row.id]}
            loading={loading}
            variant="today"
            active={activeCardKey === `${row.id}:today`}
            onSelect={onSelectCard}
          />,
        ])}
      </Box>
    </Card>
  );
}
