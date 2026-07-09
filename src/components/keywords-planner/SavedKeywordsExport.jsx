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
  ThumbsUp,
  ThumbsDown,
  Clock,
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

const APPROVAL_META = {
  approved: {
    label: "Approved",
    icon: ThumbsUp,
    cls: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    icon: ThumbsDown,
    cls: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
  pending: {
    label: "Pending Review",
    icon: Clock,
    cls: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
};

function ApprovalSection({ approvalStatus, updateApprovalStatus, isUpdatingApproval }) {
  const meta = APPROVAL_META[approvalStatus] || APPROVAL_META.pending;
  const Icon = meta.icon;

  return (
    <div className="mt-4 pt-4 border-t border-black/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black text-black uppercase tracking-widest">
          Report Status
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${meta.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => updateApprovalStatus("approved")}
          disabled={isUpdatingApproval || approvalStatus === "approved"}
          className="py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <ThumbsUp className="w-3 h-3" /> Approve
        </button>
        <button
          onClick={() => updateApprovalStatus("pending")}
          disabled={isUpdatingApproval || approvalStatus === "pending"}
          className="py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          <Clock className="w-3 h-3" /> Pending
        </button>
        <button
          onClick={() => updateApprovalStatus("rejected")}
          disabled={isUpdatingApproval || approvalStatus === "rejected"}
          className="py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <ThumbsDown className="w-3 h-3" /> Reject
        </button>
      </div>

      {approvalStatus === "rejected" && (
        <p className="text-[8px] font-bold text-slate-400 tracking-wide mt-2 text-center normal-case">
          Client ne changes maange — naye keywords add karke PDF dobara generate karein.
        </p>
      )}
    </div>
  );
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
  approvalStatus,
  updateApprovalStatus,
  isUpdatingApproval,
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

      {pdfStatus === "generated" && (
        <ApprovalSection
          approvalStatus={approvalStatus}
          updateApprovalStatus={updateApprovalStatus}
          isUpdatingApproval={isUpdatingApproval}
        />
      )}

      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">
        WhatsApp sends to your account mobile number
      </p>
    </div>
  );
}
