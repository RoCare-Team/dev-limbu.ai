import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Eye,
  Gift,
  Handshake,
  Loader2,
  Mail,
  Pencil,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  CUSTOM_EMAIL_TEMPLATE_ID,
  EMAIL_TEMPLATE_GROUPS,
  getEmailTemplatesForGroup,
} from "@/lib/limbuEmailTemplates";

const ICONS = {
  creditCard: CreditCard,
  sparkles: Sparkles,
  handshake: Handshake,
  trending: TrendingUp,
  gift: Gift,
  pencil: Pencil,
};

export default function EmailTemplateModal({
  isOpen,
  setIsOpen,
  selectedCount = 0,
  onSendTemplate,
  sendingTemplateId = "",
  /* Overridable so the franchise page can reuse this modal with its own set. */
  groups = EMAIL_TEMPLATE_GROUPS,
  templatesForGroup = getEmailTemplatesForGroup,
  heading = "Email Templates",
}) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  if (!isOpen) return null;

  const sending = !!sendingTemplateId;
  const groupMeta = groups.find((g) => g.id === selectedGroup);
  const isCustomGroup = selectedGroup === "custom";
  const templates = isCustomGroup ? [] : templatesForGroup(selectedGroup);

  const closeModal = () => {
    if (sending) return;
    setSelectedGroup(null);
    setPreviewTemplate(null);
    setIsOpen(false);
  };

  const sendCustom = () => {
    if (!customSubject.trim() || !customMessage.trim()) return;
    onSendTemplate?.({
      id: CUSTOM_EMAIL_TEMPLATE_ID,
      customSubject: customSubject.trim(),
      customMessage: customMessage.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-scaleIn">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedGroup && (
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                disabled={sending}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition disabled:opacity-50"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Mail size={28} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {groupMeta?.title || heading}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedCount} selected user{selectedCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={sending}
            className="h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {!selectedGroup && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
            {groups.map((group) => {
              const Icon = ICONS[group.icon] || Mail;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group.id)}
                  className={`w-full rounded-2xl border ${group.border} ${group.bg} px-6 py-6 flex items-center justify-between hover:shadow-lg transition-all duration-300`}
                >
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-800">
                      {group.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.subtitle}
                    </p>
                  </div>
                  <div
                    className={`h-14 w-14 rounded-2xl ${group.iconBg} flex items-center justify-center`}
                  >
                    <Icon size={24} className={group.iconColor} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedGroup && isCustomGroup && (
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. New features just launched on Limbu AI"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={8}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={
                    "Write your message here.\n\nLeave a blank line between paragraphs. It will be wrapped in the Limbu AI email design automatically."
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Every email is greeted with the lead&apos;s name automatically.
                </p>
              </div>

              <button
                type="button"
                disabled={sending || !customSubject.trim() || !customMessage.trim()}
                onClick={sendCustom}
                className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send to {selectedCount} lead{selectedCount === 1 ? "" : "s"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {selectedGroup && !isCustomGroup && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 max-h-[75vh] overflow-y-auto">
            {templates.map((template) => {
              const isSending = sendingTemplateId === template.id;
              return (
                <div
                  key={template.id}
                  className="rounded-2xl border border-gray-200 bg-slate-50 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-base font-bold text-gray-900">
                      {template.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.subtitle}
                    </p>
                  </div>

                  <div className="px-4 py-3 bg-white border-b border-gray-100">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                      Subject
                    </p>
                    <p className="text-sm text-gray-800 mt-1">
                      {template.subject}
                    </p>
                  </div>

                  <div className="flex-1 bg-[#eef2f7] p-3">
                    <div className="rounded-xl overflow-hidden bg-white shadow-sm">
                      <iframe
                        title={template.title}
                        srcDoc={template.html}
                        sandbox=""
                        className="w-full h-[260px] border-0 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white space-y-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Full preview
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => onSendTemplate?.(template)}
                      className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {previewTemplate.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {previewTemplate.subject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>
            <iframe
              title={`${previewTemplate.title} preview`}
              srcDoc={previewTemplate.html}
              sandbox=""
              className="w-full h-[70vh] border-0 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
