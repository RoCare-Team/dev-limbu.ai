"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  User,
  X,
  Upload,
  Building2,
} from "lucide-react";

const USER_ID_KEY = "limbu_ai_chat_user_id";
const WELCOME_MSG_ID = "limbu-welcome";
/** Clean entry: OAuth → home with chat + GMB sync (saveBussiness) */
export const LIMBU_CONNECT_BUSINESS_PATH = "/connect-google-business";
const MAX_FILES = 6;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT_ATTR =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";

function formatTime(isoDate) {
  try {
    return new Date(isoDate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getOrCreateUserId() {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return `session_${Date.now()}`;
  }
}

function mapListingsToLocationDetails(listings) {
  return listings.map((item) => {
    const locationId = item.name.split("/")[1];
    const accountId = item.accountId || "";
    const locality = item.storefrontAddress?.locality || "";
    const address = item.storefrontAddress?.addressLines?.[0] || "";
    const title = item.title || "";
    const isVerified = item.hasVoiceOfMerchant === true;
    const websiteUrl = item.websiteUri || "";
    const reviewUri = item.metadata?.newReviewUri || "";
    const businessProfileId = item.name || "";
    return {
      locationId,
      accountId,
      locality,
      address,
      title,
      websiteUrl,
      reviewUri,
      isVerified,
      businessProfileId,
      name: item.name,
      websiteUri: item.websiteUri,
      storefrontAddress: item.storefrontAddress,
      phoneNumbers: item.phoneNumbers,
      categories: item.categories,
      openInfo: item.openInfo,
      metadata: item.metadata,
    };
  });
}

/** User asked how to link / save Google Business — answer locally with connect URL */
function wantsBusinessConnectHelp(text) {
  if (!text?.trim()) return false;
  return /connect.*(business|gmb|google)|business.*connect|gmb.*(link|connect)|google business|save.*(listing|business)|बिजनेस.*कनेक्ट|कनेक्ट.*बिजनेस|link.*gmb|url.*connect/i.test(
    text
  );
}

function greetingLine(firstName) {
  const h = new Date().getHours();
  let part = "Good evening";
  if (h < 12) part = "Good morning";
  else if (h < 17) part = "Good afternoon";
  const nameBit = firstName ? `, ${firstName}` : "";
  return `${part}${nameBit}! Main Limbu AI hoon — bilkul real assistant ki tarah yahin hoon.\n\nGMB, local SEO, ya Limbu.ai par kuch bhi poochho. 📎 Files ya images paste (Ctrl+V) ya drag & drop bhi kar sakte ho.\n\nNeeche se Google Business Profile connect kar sakte ho — sign-in ke baad yahin chat par wapas aa kar listings save ho jati hain.`;
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFC107] text-[#0B0F19] ring-2 ring-white shadow-sm">
        <Bot className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span
          className="h-2 w-2 rounded-full bg-[#FFC107] animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[#FFC107] animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[#FFC107] animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </motion.div>
  );
}

function FilePreviewPill({ attachment, onRemove, isUser = false }) {
  if (attachment.isImage) {
    return (
      <div className="group relative inline-block">
        <img
          src={attachment.previewUrl || attachment.url}
          alt={attachment.name}
          className="h-36 max-w-[220px] rounded-xl object-cover border border-black/10 shadow-sm block"
        />
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="max-w-[140px] truncate">{attachment.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(attachment.id)}
          className="ml-1 rounded-full text-slate-400 hover:text-slate-700"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function LimbuAiChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const firstName =
    session?.user?.name?.trim()?.split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const gmbSyncStartedRef = useRef(false);

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [uploadPhase, setUploadPhase] = useState(false);
  const [userId, setUserId] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [gmbSyncBusy, setGmbSyncBusy] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState("");

  const connectHref = LIMBU_CONNECT_BUSINESS_PATH;

  useEffect(() => {
    if (typeof window !== "undefined") setSiteOrigin(window.location.origin);
  }, []);

  // Welcome message (updates when firstName changes)
  useEffect(() => {
    setMessages((prev) => {
      const createdAt =
        prev.find((m) => m.id === WELCOME_MSG_ID)?.createdAt ||
        new Date().toISOString();
      const welcome = {
        id: WELCOME_MSG_ID,
        role: "assistant",
        text: greetingLine(firstName || ""),
        linkCta: {
          href: connectHref,
          label: "Continue with Google",
          sub: "Same window · wapas yahin chat",
        },
        createdAt,
      };
      if (prev.length === 0) return [welcome];
      if (prev[0]?.id === WELCOME_MSG_ID) {
        return [welcome, ...prev.slice(1)];
      }
      return prev;
    });
  }, [firstName, connectHref]);

  // Deep link: open chat from ?limbu_chat=1 (e.g. after OAuth return)
  useEffect(() => {
    if (pathname !== "/") return;
    if (searchParams.get("limbu_chat") === "1") setIsOpen(true);
  }, [pathname, searchParams]);

  // After Google OAuth: sync GMB + saveBussiness, then strip query (keep chat open)
  useEffect(() => {
    if (pathname !== "/") return;
    if (searchParams.get("gmb_sync") !== "1") return;
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.accessToken) {
      if (status === "unauthenticated") {
        router.replace("/?limbu_chat=1", { scroll: false });
      }
      return;
    }
    if (gmbSyncStartedRef.current) return;
    gmbSyncStartedRef.current = true;
    setIsOpen(true);
    setGmbSyncBusy(true);

    (async () => {
      try {
        const res = await fetch("/api/gmb/sync-and-save", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) gmbSyncStartedRef.current = false;
          throw new Error(data?.error || "Sync failed");
        }

        if (data.listings?.length) {
          try {
            localStorage.setItem(
              "locationDetails",
              JSON.stringify(mapListingsToLocationDetails(data.listings))
            );
            localStorage.setItem(
              "reviewUrl",
              data.listings[0]?.metadata?.newReviewUri || ""
            );
          } catch {}
        }

        const n = data.count ?? data.listings?.length ?? 0;
        const line =
          n > 0
            ? `Google Business connect ho gaya. ${n} listing${n === 1 ? "" : "s"} save ho chuki hain (saveBussiness). Ab aap GMB / dashboard features use kar sakte ho.`
            : "Sign-in ho gaya, lekin is account mein koi Business Profile location nahi mili. Google Business Center mein check karke dubara try karein.";

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: line,
            linkCta: {
              href: connectHref,
              label: "Dobara connect / refresh",
              sub: "Agar multiple accounts hon",
            },
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text:
              e?.message ||
              "Listings save nahi ho payin — thodi der baad dubara try karein.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setGmbSyncBusy(false);
        router.replace("/?limbu_chat=1", { scroll: false });
      }
    })();
  }, [
    pathname,
    searchParams,
    status,
    session?.accessToken,
    router,
    connectHref,
  ]);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, attachments.length, isOpen, scrollToBottom]);

  const revokeAttachment = useCallback((item) => {
    if (item.previewUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {}
    }
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList || []).filter(Boolean);
      if (!incoming.length) return;
      setAttachments((prev) => {
        const next = [...prev];
        for (const file of incoming) {
          if (next.length >= MAX_FILES) break;
          if (file.size > MAX_FILE_BYTES) continue;
          const isImage = file.type.startsWith("image/");
          next.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: isImage ? URL.createObjectURL(file) : null,
            name: file.name,
            mime: file.type || "application/octet-stream",
            isImage,
          });
        }
        return next;
      });
    },
    []
  );

  const removeAttachment = useCallback(
    (id) => {
      setAttachments((prev) => {
        const found = prev.find((a) => a.id === id);
        if (found) revokeAttachment(found);
        return prev.filter((a) => a.id !== id);
      });
    },
    [revokeAttachment]
  );

  const uploadAttachments = async (items) => {
    const results = [];
    for (const item of items) {
      const fd = new FormData();
      fd.append("file", item.file);
      const res = await fetch("/api/limbu-chat-attachment", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      results.push({ url: data.url, name: data.name || item.name });
    }
    return results;
  };

  const buildPayloadMessage = (text, uploaded) => {
    const lines = uploaded.map((u) => `• ${u.name}: ${u.url}`).join("\n");
    if (lines && text) return `${text}\n\n📎 Attachments:\n${lines}`;
    if (lines)
      return `📎 Shared files:\n${lines}\n\n(Batao inke baare mein kya help chahiye?)`;
    return text;
  };

  const handleSend = async () => {
    const text = message.trim();
    const pending = [...attachments];
    if ((!text && pending.length === 0) || isSending) return;

    const uid = userId || getOrCreateUserId();
    if (!userId) setUserId(uid);

    const optimisticAttachments = pending.map((p) => ({
      id: p.id,
      url: p.previewUrl,
      previewUrl: p.previewUrl,
      name: p.name,
      isImage: p.isImage,
    }));

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || "",
      attachments: optimisticAttachments,
      createdAt: new Date().toISOString(),
    };

    if (wantsBusinessConnectHelp(text) && pending.length === 0) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Ek hi clean link — Google sign-in ke baad aap seedhe isi chat par wapas aa jate ho; listings backend par save ho jati hain (saveBussiness).",
          linkCta: {
            href: connectHref,
            label: "Continue with Google",
            sub: "Limbu.ai / localhost — same flow",
          },
          createdAt: new Date().toISOString(),
        },
      ]);
      setMessage("");
      setAttachments([]);
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setAttachments([]);
    setIsSending(true);

    let uploadedMeta = [];
    let committed = false;

    try {
      if (pending.length > 0) {
        setUploadPhase(true);
        uploadedMeta = await uploadAttachments(pending);
        setUploadPhase(false);
      }

      pending.forEach(revokeAttachment);

      const remoteAttachments = uploadedMeta.map((u, i) => ({
        url: u.url,
        previewUrl: u.url,
        name: u.name,
        isImage: pending[i]?.isImage,
      }));

      if (remoteAttachments.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id
              ? { ...m, attachments: remoteAttachments }
              : m
          )
        );
      }
      committed = true;

      const payloadText = buildPayloadMessage(text, uploadedMeta);
      const response = await fetch("/api/limbu-ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payloadText, user_id: uid }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.error || "Unable to send message.");

      const replyText =
        data?.reply ||
        data?.data?.response ||
        data?.message ||
        "No reply received.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: replyText,
          intent: data?.intent,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setUploadPhase(false);
      pending.forEach(revokeAttachment);
      setMessages((prev) => {
        const base = committed
          ? prev
          : prev.filter((m) => m.id !== userMsg.id);
        return [
          ...base,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text:
              error?.message ||
              "Arre, kuch issue aa gaya — thodi der baad try karna ya file chhoti karke bhejo.",
            createdAt: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setIsSending(false);
      setUploadPhase(false);
    }
  };

  const onPaste = (e) => {
    const files = e.clipboardData?.files;
    if (files?.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave" || e.type === "drop") setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer?.files);
  };

  const canSend =
    (message.trim().length > 0 || attachments.length > 0) &&
    !isSending &&
    !uploadPhase;

  /* Marketing home only — hide on /admin, /dashboard, etc. */
  if (pathname !== "/") return null;

  return (
    <div className="fixed bottom-5 right-5 z-[1000] font-sans antialiased flex flex-col items-end gap-3">
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 rounded-full bg-[#0B0F19] px-5 py-3.5 text-white shadow-[0_12px_40px_-8px_rgba(11,15,25,0.55)]"
            aria-label="Open Limbu AI chat"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFC107] text-[#0B0F19] ring-2 ring-amber-200/50 shadow-inner">
              <Bot className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Limbu AI
            </span>
            <MessageCircle className="h-4 w-4 text-amber-300/80" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative flex w-[min(100vw-1.25rem,400px)] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_32px_80px_-16px_rgba(15,23,42,0.35)]"
            style={{ height: "580px" }}
            role="dialog"
            aria-label="Limbu AI chat"
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            {/* Drag overlay */}
            {dragActive && (
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-[#FFC107] bg-amber-50/95 backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC107]/20">
                  <Upload className="h-8 w-8 text-[#0B0F19]" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold text-[#0B0F19]">
                  Yahan chhod do
                </p>
                <p className="text-xs text-amber-800">Images & files</p>
              </div>
            )}

            {/* Header */}
            <header className="flex shrink-0 items-center gap-3 bg-[#0B0F19] px-4 py-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#FFC107] text-[#0B0F19] shadow-lg">
                <Sparkles className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-white">
                  Limbu AI
                </p>
                {firstName && (
                  <p className="text-[11px] font-medium text-amber-200">
                    Hey {firstName} 👋
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online · limbubot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {gmbSyncBusy && (
              <div className="flex shrink-0 items-center gap-2 border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-950">
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin"
                  strokeWidth={2.5}
                />
                Google Business listings save ho rahi hain…
              </div>
            )}

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#F0F2F5] px-3 py-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent",
              }}
            >
              <AnimatePresence initial={false}>
                {messages.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex items-end gap-2 ${
                      item.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white shadow-sm ${
                        item.role === "user"
                          ? "bg-[#374151] text-white"
                          : "bg-[#FFC107] text-[#0B0F19]"
                      }`}
                    >
                      {item.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`flex max-w-[78%] flex-col gap-1 ${
                        item.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          item.role === "user"
                            ? "rounded-br-sm bg-[#FFC107] text-[#0B0F19]"
                            : "rounded-bl-sm border border-slate-100 bg-white text-slate-800"
                        }`}
                      >
                        {/* Intent badge */}
                        {item.intent && item.role === "assistant" && (
                          <span className="mb-1.5 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            {item.intent}
                          </span>
                        )}

                        {/* Attachments */}
                        {item.attachments?.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {item.attachments.map((att, idx) =>
                              att.isImage ? (
                                <img
                                  key={att.url || idx}
                                  src={att.previewUrl || att.url}
                                  alt={att.name}
                                  className="max-h-40 max-w-[210px] rounded-xl border border-black/10 object-cover shadow-sm block"
                                />
                              ) : (
                                <a
                                  key={att.url || idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium ${
                                    item.role === "user"
                                      ? "bg-black/10 text-[#0B0F19]"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  <span className="max-w-[150px] truncate">
                                    {att.name}
                                  </span>
                                </a>
                              )
                            )}
                          </div>
                        )}

                        {/* Text */}
                        {item.text && (
                          <p className="whitespace-pre-wrap break-words">
                            {item.text}
                          </p>
                        )}
                        {item.role === "assistant" && item.linkCta?.href && (
                          <div className="mt-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm ring-1 ring-slate-100/80">
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#FFC107] shadow-inner">
                                <Building2
                                  className="h-4 w-4"
                                  strokeWidth={2.25}
                                />
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Google Business Profile
                                </p>
                                {item.linkCta.sub && (
                                  <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                                    {item.linkCta.sub}
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={item.linkCta.href}
                              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-3 py-2.5 text-center text-[13px] font-semibold text-[#FFC107] shadow-md transition hover:bg-slate-800"
                            >
                              {item.linkCta.label || "Continue"}
                            </a>
                            {siteOrigin &&
                              item.linkCta.href === LIMBU_CONNECT_BUSINESS_PATH && (
                                <p
                                  className="mt-2 break-all text-center font-mono text-[10px] leading-snug text-slate-400"
                                  title="Is link ko team / clients ko bhej sakte ho"
                                >
                                  {siteOrigin}
                                  {item.linkCta.href}
                                </p>
                              )}
                          </div>
                        )}
                      </div>

                      <p
                        className={`text-[10px] text-slate-400 px-1 ${
                          item.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {item.role === "user" ? "You" : "Limbu AI"} ·{" "}
                        {formatTime(item.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isSending && <TypingIndicator />}
            </div>

            {/* Pending attachment previews */}
            {attachments.length > 0 && (
              <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 bg-white px-3 pt-2">
                {attachments.map((a) => (
                  <div key={a.id} className="group relative">
                    {a.isImage ? (
                      <>
                        <img
                          src={a.previewUrl}
                          alt={a.name}
                          className="h-14 w-14 rounded-xl border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="relative flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-1">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <p className="line-clamp-2 text-center text-[9px] text-slate-500">
                          {a.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer / input */}
            <footer className="shrink-0 border-t border-slate-100 bg-white px-3 pb-3 pt-2.5">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || attachments.length >= MAX_FILES}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                  title="Attach file"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept={ACCEPT_ATTR}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onPaste={onPaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend) handleSend();
                    }
                  }}
                  placeholder="Message… paste screenshot or drop files"
                  disabled={isSending}
                  className="flex-1 resize-none rounded-[12px] border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-snug text-slate-900 shadow-none outline-none transition placeholder:text-slate-400 focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 disabled:opacity-60"
                  style={{ minHeight: 40, maxHeight: 100 }}
                  onInput={(e) => {
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height =
                      Math.min(el.scrollHeight, 100) + "px";
                  }}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0B0F19] text-[#FFC107] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  {uploadPhase || isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] leading-snug text-slate-400">
                Drag & drop · paste screenshot · Hinglish ·{" "}
                <span className="font-medium">limbubot</span>
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}