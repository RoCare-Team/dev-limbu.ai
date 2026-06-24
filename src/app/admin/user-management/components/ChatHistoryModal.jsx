"use client";

import React from "react";
import { Bot, MessageCircle, RefreshCw, User, X, LayoutTemplate } from "lucide-react";

const formatChatTime = (value) => {
  if (!value) return "";
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Try to parse message content as a WhatsApp-style template object.
// Returns the parsed template object if valid, otherwise null.
const parseTemplateContent = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && (parsed.__type === "template" || parsed.body || parsed.buttons)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

// Renders text with \n converted into actual line breaks,
// and bolds/emoji preserved as-is (WhatsApp doesn't use markdown bold here,
// so we just keep the raw characters but ensure real line breaks).
const TextWithBreaks = ({ text, className = "" }) => {
  if (!text) return null;
  const lines = String(text).split("\\n").join("\n").split("\n");
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
};

const TemplateBubble = ({ template, isUser }) => {
  const {
    template_name,
    header_type,
    header_content,
    body,
    footer,
    buttons = [],
  } = template;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Template label */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
        <LayoutTemplate size={12} className="text-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Template{template_name ? ` · ${template_name}` : ""}
        </span>
      </div>

      {/* Header (if text header) */}
      {header_type === "TEXT" && header_content ? (
        <div className="px-4 pt-3">
          <p className="text-sm font-bold text-slate-900">{header_content}</p>
        </div>
      ) : null}

      {/* Body */}
      {body ? (
        <div className="px-4 py-3">
          <TextWithBreaks text={body} className="text-sm leading-relaxed text-slate-800" />
        </div>
      ) : null}

      {/* Footer */}
      {footer ? (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-400">{footer}</p>
        </div>
      ) : null}

      {/* Buttons */}
      {Array.isArray(buttons) && buttons.length > 0 && (
        <div className="border-t border-slate-100">
          {buttons.map((btn, i) => (
            <button
              key={`${btn?.text || "btn"}-${i}`}
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-1.5 border-b border-slate-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 last:border-b-0 hover:bg-indigo-50/50"
            >
              {btn?.text || "Button"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ChatHistoryModal({
  open,
  onClose,
  user,
  userId,
  history = [],
  loading = false,
  error = "",
  onRetry,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <MessageCircle size={19} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900">
                  Conversation History
                </h2>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {user?.fullName || user?.name || "User"} - {userId || "No WhatsApp ID"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100/70 px-4 py-5">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-indigo-600">
              <RefreshCw size={28} className="animate-spin" />
              <p className="text-sm font-bold text-slate-600">Loading conversation...</p>
            </div>
          ) : error ? (
            <div className="mx-auto flex min-h-[240px] max-w-md flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-6 text-center">
              <p className="text-sm font-bold text-red-600">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-center">
              <MessageCircle size={26} className="mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-500">No conversation found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => {
                const isUser = item?.role === "user";
                const template = parseTemplateContent(item?.content);

                return (
                  <div
                    key={`${item?.time || "chat"}-${index}`}
                    className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Bot size={15} />
                      </div>
                    )}

                    <div className={`max-w-[82%] ${template ? "" : "shadow-sm"}`}>
                      {template ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {isUser ? "User" : "Assistant"}
                            </span>
                          </div>
                          <TemplateBubble template={template} isUser={isUser} />
                          <p
                            className={`px-1 text-[10px] font-semibold text-slate-400 ${
                              isUser ? "text-right" : "text-left"
                            }`}
                          >
                            {formatChatTime(item?.time)}
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isUser
                              ? "rounded-tr-md bg-indigo-600 text-white"
                              : "rounded-tl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-1.5">
                            {isUser && <User size={12} />}
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${
                                isUser ? "text-indigo-100" : "text-slate-400"
                              }`}
                            >
                              {isUser ? "User" : "Assistant"}
                            </span>
                          </div>
                          <TextWithBreaks
                            text={item?.content || ""}
                            className="text-sm leading-relaxed"
                          />
                          <p
                            className={`mt-2 text-right text-[10px] font-semibold ${
                              isUser ? "text-indigo-100" : "text-slate-400"
                            }`}
                          >
                            {formatChatTime(item?.time)}
                          </p>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white">
                        <User size={15} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}