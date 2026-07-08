"use client";
import React from "react";
import {
  FileText,
  Loader2,
  Check,
  MessageCircle,
  Mail,
  RefreshCw,
  Download,
} from "lucide-react";

function StatusBadge({ status }) {
  if (status === "sent") {
    return (
      <span className="text-[7px] font-black text-green-200 uppercase tracking-widest flex items-center gap-1">
        <Check className="w-3 h-3" /> Sent
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="text-[7px] font-black text-red-200 uppercase tracking-widest">Failed</span>
    );
  }
  return null;
}

export default function SavedKeywordsExport({
  canGeneratePdf,
  generatePdf,
  isGeneratingPdf,
  pdfUrl,
  pdfStatus,
  canSend,
  sendWhatsApp,
  sendEmail,
  isSendingWhatsApp,
  isSendingEmail,
  whatsappStatus,
  emailStatus,
}) {
  if (!canGeneratePdf) return null;

  return (
    <div className="mt-6 pt-6 border-t border-black/5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-black" />
        <h3 className="text-[10px] font-black text-black uppercase tracking-widest">
          Export & Share Report
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={generatePdf}
          disabled={isGeneratingPdf || pdfStatus === "generated"}
          className="btn-lemon w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isGeneratingPdf ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : pdfStatus === "generated" ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {pdfStatus === "generated" ? "PDF Generated" : "Generate PDF"}
        </button>

        {pdfStatus === "failed" && (
          <button
            onClick={generatePdf}
            className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry PDF
          </button>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-black/10 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>
        )}

        {canSend && (
          <>
            <button
              onClick={sendWhatsApp}
              disabled={isSendingWhatsApp || whatsappStatus === "sent"}
              className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#1da851] transition-colors disabled:opacity-60"
            >
              {isSendingWhatsApp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5" />
              )}
              Send on WhatsApp
              <StatusBadge status={whatsappStatus} />
            </button>

            {whatsappStatus === "failed" && (
              <button
                onClick={sendWhatsApp}
                className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry WhatsApp
              </button>
            )}

            <button
              onClick={sendEmail}
              disabled={isSendingEmail || emailStatus === "sent"}
              className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-black text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {isSendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              Send via Email
              <StatusBadge status={emailStatus} />
            </button>

            {emailStatus === "failed" && (
              <button
                onClick={sendEmail}
                className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1 py-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Email
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">
        WhatsApp sends to your account mobile number
      </p>
    </div>
  );
}
