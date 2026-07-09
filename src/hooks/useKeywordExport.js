"use client";
import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export function useKeywordExport({ businessName, locationName, slug, keywordCount }) {
  const [reportId, setReportId] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfStatus, setPdfStatus] = useState("pending");
  const [whatsappStatus, setWhatsappStatus] = useState("pending");
  const [emailStatus, setEmailStatus] = useState("pending");
  const [approvalStatus, setApprovalStatus] = useState("pending");
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

  const canGeneratePdf = keywordCount > 0;
  const canSend = pdfStatus === "generated" && !!pdfUrl;

  // 👇 Restore last saved report (status + PDF) on load / when location changes,
  //    so an approved report stays "approved" even after a refresh.
  useEffect(() => {
    const userId = getLocalStorage("userId");
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ userId });
        if (slug) qs.set("slug", slug);
        const res = await fetch(`/api/keyword-research/export/status?${qs.toString()}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.success && data.data) {
          setReportId(data.data.reportId);
          setPdfUrl(data.data.pdfUrl || "");
          setPdfStatus(data.data.pdfStatus === "generated" ? "generated" : "pending");
          setApprovalStatus(data.data.approvalStatus || "pending");
        } else {
          // No report for this location yet — reset to a clean slate
          setReportId(null);
          setPdfUrl("");
          setPdfStatus("pending");
          setApprovalStatus("pending");
        }
      } catch (err) {
        console.error("Failed to restore report state:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const generatePdf = useCallback(async () => {
    const userId = getLocalStorage("userId");
    if (!userId) {
      toast.error("Please log in first");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfStatus("generating");

    try {
      const res = await fetch("/api/keyword-research/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          businessName,
          locationName,
          slug,
          reportId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setPdfStatus("failed");
        toast.error(data.error || "PDF generation failed");
        return;
      }

      setReportId(data.data.reportId);
      setPdfUrl(data.data.pdfUrl);
      setPdfStatus("generated");
      setApprovalStatus(data.data.approvalStatus || "pending");
      setWhatsappStatus("pending");
      setEmailStatus("pending");
      toast.success("PDF report generated!");
    } catch (err) {
      console.error("PDF error:", err);
      setPdfStatus("failed");
      toast.error("PDF generation failed. Please retry.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [businessName, locationName, slug, reportId]);

  const sendWhatsApp = useCallback(async () => {
    if (!reportId) return;

    const userId = getLocalStorage("userId");
    setIsSendingWhatsApp(true);
    setWhatsappStatus("sending");

    try {
      const res = await fetch("/api/keyword-research/export/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, userId }),
      });

      const data = await res.json();

      if (!data.success) {
        setWhatsappStatus("failed");
        toast.error(data.error || "WhatsApp send failed");
        return;
      }

      setWhatsappStatus("sent");
      toast.success(data.message || "Report sent on your WhatsApp!");
    } catch (err) {
      console.error("WhatsApp error:", err);
      setWhatsappStatus("failed");
      toast.error("WhatsApp send failed. Please retry.");
    } finally {
      setIsSendingWhatsApp(false);
    }
  }, [reportId]);

  const updateApprovalStatus = useCallback(async (nextStatus, note = "") => {
    if (!reportId) return;

    const userId = getLocalStorage("userId");
    const prev = approvalStatus;
    setApprovalStatus(nextStatus); // optimistic
    setIsUpdatingApproval(true);

    try {
      const res = await fetch("/api/keyword-research/export/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, userId, approvalStatus: nextStatus, approvalNote: note }),
      });

      const data = await res.json();

      if (!data.success) {
        setApprovalStatus(prev);
        toast.error(data.error || "Could not update status");
        return;
      }

      const label =
        nextStatus === "approved" ? "Approved" : nextStatus === "rejected" ? "Rejected" : "Pending";
      toast.success(`Report marked as ${label}`);
    } catch (err) {
      console.error("Approval status error:", err);
      setApprovalStatus(prev);
      toast.error("Could not update status. Please retry.");
    } finally {
      setIsUpdatingApproval(false);
    }
  }, [reportId, approvalStatus]);

  const sendEmail = useCallback(async () => {
    if (!reportId) return;

    const userId = getLocalStorage("userId");
    setIsSendingEmail(true);
    setEmailStatus("sending");

    try {
      const res = await fetch("/api/keyword-research/export/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, userId }),
      });

      const data = await res.json();

      if (!data.success) {
        setEmailStatus("failed");
        toast.error(data.error || "Email send failed");
        return;
      }

      setEmailStatus("sent");
      toast.success(data.message || "Report sent to your email!");
    } catch (err) {
      console.error("Email error:", err);
      setEmailStatus("failed");
      toast.error("Email send failed. Please retry.");
    } finally {
      setIsSendingEmail(false);
    }
  }, [reportId]);

  return {
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
  };
}
