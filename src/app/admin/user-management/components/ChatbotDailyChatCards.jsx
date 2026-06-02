"use client";

import {
  Box,
  Button,
  Card,
  CardActionArea,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";

import {
  SmartToy,
  Refresh,
  ChevronRight,
  ChatBubbleOutline,
} from "@mui/icons-material";

export default function ChatbotDailyChatCards({
  stats,
  loading,
  activeDay,
  activeKey,
  onRefresh,
  onSelectDay,
  onSelectCard,
  title = "WhatsApp Chatbot Leads",
  subtitle = "Only chat-started users appear below",
  cards,
}) {
  const effectiveActiveKey = activeDay ?? activeKey;
  const handleSelect = (key) => {
    if (typeof onSelectDay === "function") return onSelectDay(key);
    if (typeof onSelectCard === "function") return onSelectCard(key);
  };

  const rawCards =
    cards ?? [
      {
        key: "today",
        title: "Today",
        hint: "Today chatbot users",
        count: stats?.today?.count ?? 0,
        color: "#10b981",
        bg: "#ecfdf5",
      },
      {
        key: "yesterday",
        title: "Yesterday",
        hint: "Yesterday chatbot users",
        count: stats?.yesterday?.count ?? 0,
        color: "#7c3aed",
        bg: "#f5f3ff",
      },
      {
        key: "new",
        title: "New",
        hint: "New stage leads",
        count: stats?.new?.count ?? 0,
        color: "#3b82f6",
        bg: "#eff6ff",
      },
      {
        key: "contacted",
        title: "Contacted",
        hint: "Contacted stage leads",
        count: stats?.contacted?.count ?? 0,
        color: "#f59e0b",
        bg: "#fffbeb",
      },
      {
        key: "interested",
        title: "Interested",
        hint: "Interested stage leads",
        count: stats?.interested?.count ?? 0,
        color: "#8b5cf6",
        bg: "#f5f3ff",
      },
      {
        key: "demo",
        title: "Demo Scheduled",
        hint: "Demo scheduled leads",
        count: stats?.demo?.count ?? 0,
        color: "#06b6d4",
        bg: "#ecfeff",
      },
      {
        key: "proposal",
        title: "Proposal Sent",
        hint: "Proposal sent leads",
        count: stats?.proposal?.count ?? 0,
        color: "#ec4899",
        bg: "#fdf2f8",
      },
      {
        key: "won",
        title: "Won",
        hint: "Deals won",
        count: stats?.won?.count ?? 0,
        color: "#10b981",
        bg: "#ecfdf5",
        metricLabel: "deals",
      },
      {
        key: "lost",
        title: "Lost",
        hint: "Deals lost",
        count: stats?.lost?.count ?? 0,
        color: "#ef4444",
        bg: "#fef2f2",
        metricLabel: "deals",
      },
      {
        key: "followup",
        title: "Follow-up",
        hint: "Follow-up pending leads",
        count: stats?.followup?.count ?? 0,
        color: "#f97316",
        bg: "#fff7ed",
      },
    ];

  const cardsData = rawCards;

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
      {/* Header */}
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
              background: "linear-gradient(135deg, #d1fae5 0%, #e0e7ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SmartToy sx={{ fontSize: 18, color: "#4f46e5" }} />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#111827",
                fontFamily: "var(--font-inter)",
                "& *": {
                  fontFamily: "var(--font-inter)",
                },
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize: "10px",
                color: "#6b7280",
                mt: 0.2,
                lineHeight: 1.3,
                fontFamily: "var(--font-inter)",
                "& *": {
                  fontFamily: "var(--font-inter)",
                },
              }}
            >
              {subtitle}
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

      {/* Cards */}
      {cardsData.length === 0 ? (
        loading ? (
          <Stack alignItems="center" justifyContent="center" py={2.5}>
            <CircularProgress size={20} />
          </Stack>
        ) : (
          <Typography
            sx={{
              textAlign: "center",
              fontSize: "12px",
              color: "#9ca3af",
              py: 2,
            }}
          >
            No active leads right now.
          </Typography>
        )
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 1,
          }}
        >
          {cardsData.map((card) => {
            const active = effectiveActiveKey === card.key;

            return (
              <Card
                key={card.key}
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: active
                    ? `1.5px solid ${card.color}`
                    : "1px solid #e5e7eb",
                  background: active ? card.color : "#fff",
                  transition: "0.2s",
                  overflow: "hidden",
                  fontFamily: "var(--font-inter)",
                  "& *": {
                    fontFamily: "var(--font-inter)",
                  },
                }}
              >
                <CardActionArea
                  disabled={loading}
                  onClick={() => handleSelect(card.key)}
                  sx={{
                    p: 1.2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        background: active
                          ? "rgba(255,255,255,0.18)"
                          : card.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChatBubbleOutline
                        sx={{
                          fontSize: 15,
                          color: active ? "#fff" : card.color,
                        }}
                      />
                    </Box>

                    <ChevronRight
                      sx={{
                        fontSize: 16,
                        color: active ? "#fff" : "#9ca3af",
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: active ? "rgba(255,255,255,0.85)" : "#6b7280",
                    }}
                  >
                    {card.prefix
                      ? `${card.prefix} • ${card.title}`
                      : card.title}
                  </Typography>

                  <Stack
                    direction="row"
                    alignItems="flex-end"
                    spacing={0.5}
                    mt={0.4}
                  >
                    <Typography
                      sx={{
                        fontSize: "24px",
                        fontWeight: 900,
                        lineHeight: 1,
                        color: active ? "#fff" : "#111827",
                      }}
                    >
                      {loading ? "..." : card.count}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "10px",
                        fontWeight: 700,
                        mb: 0.2,
                        color: active ? "rgba(255,255,255,0.8)" : "#6b7280",
                      }}
                    >
                      {card.metricLabel || "leads"}
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: "9px",
                      color: active ? "rgba(255,255,255,0.8)" : "#6b7280",
                      lineHeight: 1.3,
                    }}
                  >
                    {card.hint}
                  </Typography>

                  <Chip
                    label={active ? "Showing in table" : "Click to view"}
                    size="small"
                    sx={{
                      mt: 1,
                      height: 20,
                      fontSize: "9px",
                      fontWeight: 700,
                      background: active
                        ? "rgba(255,255,255,0.18)"
                        : card.bg,
                      color: active ? "#fff" : card.color,
                      borderRadius: "6px",
                    }}
                  />
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
