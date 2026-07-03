// Pure helper functions extracted from user-management/page.jsx.
// These do not depend on any component state — behaviour is identical to the
// original inline definitions; they were only moved out to shrink page.jsx.

export const getLimbuBotHistoryUserId = (user = {}) => {
  const explicit =
    user.chatbotUserId ||
    user.whatsappUserId ||
    user.limbuBotUserId ||
    user.botUserId ||
    "";
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim().startsWith("wa_")
      ? explicit.trim()
      : `wa_${explicit.trim().replace(/\D/g, "")}`;
  }

  let phone = user.phone || user.mobileNumber || "";
  phone = String(phone).replace(/\D/g, "");
  if (!phone) return "";
  if (phone.length === 10) phone = `91${phone}`;
  return `wa_${phone}`;
};

export const getConversationStageFromHistory = (history = [], user = {}) => {
  const steps = [];
  const assistantMessages = history.filter(
    (item) => String(item?.role || "").toLowerCase() === "assistant",
  );
  const inboundUserMessageCount = history.filter(
    (item) =>
      String(item?.role || "").toLowerCase() === "user" &&
      String(item?.content || "").trim() !== "",
  ).length;

  const hasText = (...keywords) =>
    assistantMessages.some((item) => {
      const content = String(item?.content || "").toLowerCase();
      return keywords.some((keyword) =>
        content.includes(keyword.toLowerCase()),
      );
    });

  const hasConnectedStage = hasText(
    "Congrats! Apka Account connect ho gaya!",
    "Badhaai ho! Account connect ho gaya!",
    "Account connect ho gaya",
  );
  const downstreamSteps = [];

  if (hasText("Full Health report")) downstreamSteps.push("GMB Health");
  if (hasText("Magic QR ready hai!")) downstreamSteps.push("Magic QR");
  if (hasText("Full Report (PDF)")) downstreamSteps.push("GMB Insight");
  if (hasText("Website URL")) downstreamSteps.push("Build Website");

  if (inboundUserMessageCount >= 2) steps.push("Initial Conversation");
  if (hasConnectedStage || downstreamSteps.length > 0) {
    steps.push("GMB Connected");
  }
  steps.push(...downstreamSteps);

  // Agar koi activity nahi hai
  if (steps.length === 0 && history.length === 0) {
    return { label: "Not started", steps: [] };
  }

  return {
    label: steps.join(" ➔ "),
    steps: steps, // Hum array bhi bhej rahe hain easy checking ke liye
  };
};

export const getConversationStageKey = (user = {}) =>
  String(user.userId || getLimbuBotHistoryUserId(user) || user._id || "");

export const mapWhatsAppMessagesToHistory = (messages = []) =>
  (Array.isArray(messages) ? messages : []).map((message) => ({
    id: message.id,
    role:
      String(message.direction || "").toLowerCase() === "inbound"
        ? "user"
        : "assistant",
    type: message.type || "text",
    content: String(message.content || ""),
    status: message.status || "",
    time: message.sent_at || message.created_at || "",
    created_at: message.created_at || "",
  }));

export const normalizeWhatsAppPhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
};

export const phoneToLocalMobile = (value) => {
  const digits = normalizeWhatsAppPhone(value);
  return digits.startsWith("91") && digits.length >= 12
    ? digits.slice(2)
    : digits;
};

export const getLatestWhatsAppMessage = (messages = []) =>
  (Array.isArray(messages) ? [...messages] : []).sort((a, b) =>
    String(b?.sent_at || b?.created_at || "").localeCompare(
      String(a?.sent_at || a?.created_at || ""),
    ),
  )[0] || null;

export const hasGmbConnected = (user = {}) =>
  Boolean(
    user.isBusinessConnected ||
    user.connectedBusinessEmail ||
    user.gmbProjectId ||
    user.selectedBusiness?.name ||
    (Array.isArray(user.businessListings) && user.businessListings.length > 0),
  );

export const getAvatarColor = (name) => {
  if (!name) return "bg-gray-100 text-gray-600 border-gray-200";
  const colors = [
    "bg-red-50 text-red-700 border-red-200",
    "bg-orange-50 text-orange-700 border-orange-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-green-50 text-green-700 border-green-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-teal-50 text-teal-700 border-teal-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "bg-pink-50 text-pink-700 border-pink-200",
    "bg-rose-50 text-rose-700 border-rose-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getCalculatedDateRange = (filter) => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);

  if (filter === "Today") {
    // start is today
  } else if (filter === "Last 7 Days") {
    start.setDate(today.getDate() - 7);
  } else if (filter === "Last 30 Days") {
    start.setDate(today.getDate() - 30);
  } else if (filter === "This Month") {
    start.setDate(1);
  } else {
    return null;
  }

  const toLocalYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return { startDate: toLocalYMD(start), endDate: toLocalYMD(end) };
};

export const groupByDate = (data) => {
  return data.reduce((acc, item) => {
    const dateLabel = item.demoBooking?.selectedDate
      ? `Demo: ${item.demoBooking.selectedDateLabel || item.demoBooking.selectedDate}`
      : new Date(item.createdAt).toLocaleDateString("en-IN");

    if (!acc[dateLabel]) {
      acc[dateLabel] = [];
    }

    acc[dateLabel].push(item);
    return acc;
  }, {});
};
