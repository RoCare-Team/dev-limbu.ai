"use client";

import {
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Download,
  FileText,
  Phone,
  Globe,
  Share2,
  Trophy,
  Activity,
  Zap,
  Star,
  MessageSquare,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Tag,
  Search,
  ExternalLink,
  Reply,
  CalendarDays,
  Loader2, // बेहतर बटन UX के लिए स्पिनर इम्पोर्ट किया गया
  MessageCircle,
  Mail,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { getLocalStorage } from "@/utils/storage";

export default function GBPAuditCard({ audit }) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const router = useRouter();

  // ── v2 AuditResponse (gmb-auditor.limbutech.in) ──
  const {
    total_score: totalScore = 0,
    status,
    business_type: businessType,
    profile_snapshot: profile = {},
    score_breakdown: scoreBreakdown = [],
    review_intelligence: reviews = {},
    post_consistency: posts = {},
    media_consistency: media = {},
    keyword_analysis: keywords = {},
    priority_actions: priorityActions = [],
    ai_narrative: guidanceText = "",
  } = audit || {};

  const businessName = profile.business_name || "Your Business";
  const date = new Date().toLocaleString();
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  // returnBase64=true → resolve the PDF as a data-URI string (for email/WhatsApp)
  // instead of triggering a browser download.
  const handleDownloadPDF = useCallback(async (returnBase64 = false) => {
    try {
      setIsExporting(true);
      const { jsPDF } = await import("jspdf");
      const { toCanvas } = await import("html-to-image");

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const FOOTER_MM = 20; // reserved bottom strip for the footer
      const contentHeightMM = pageHeight - FOOTER_MM;

      const options = {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      };

      const logoUrl = "/images/bg-logo.png";
      let logoDataUrl = "";
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Could not load logo for PDF", error);
      }

      const addFooter = (pdfInstance, pageNum, totalPages) => {
        if (logoDataUrl) {
          pdfInstance.addImage(logoDataUrl, "PNG", 15, pageHeight - 20, 15, 15);
        }
        pdfInstance.setFontSize(9);
        pdfInstance.setTextColor(150, 150, 150);
        pdfInstance.text("Powered by Limbu.ai", 35, pageHeight - 13);
        pdfInstance.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - 30, pageHeight - 13);
      };

      // Faint centered logo watermark, drawn on top at low opacity.
      let wmAspect = 1;
      if (logoDataUrl) {
        try {
          const p = pdf.getImageProperties(logoDataUrl);
          wmAspect = p.height / p.width;
        } catch {
          /* keep default aspect */
        }
      }
      const addWatermark = (pdfInstance) => {
        if (!logoDataUrl) return;
        try {
          const wmWidth = pdfWidth * 0.6;
          const wmHeight = wmWidth * wmAspect;
          const x = (pdfWidth - wmWidth) / 2;
          const y = (pageHeight - wmHeight) / 2;
          pdfInstance.setGState(pdfInstance.GState({ opacity: 0.05 }));
          pdfInstance.addImage(logoDataUrl, "PNG", x, y, wmWidth, wmHeight, undefined, "FAST");
          pdfInstance.setGState(pdfInstance.GState({ opacity: 1 }));
        } catch (e) {
          console.error("watermark failed", e);
        }
      };

      // Render each section to a canvas so we can paginate tall content.
      const sectionIds = ["pdf-page-1", "pdf-page-2", "pdf-page-3"];

      // Treat near-white/very-light rows (page bg + slate-50 gutters) as safe cut lines.
      const makeRowScanner = (canvas) => {
        const w = canvas.width;
        const h = canvas.height;
        let data = null;
        try {
          data = canvas.getContext("2d").getImageData(0, 0, w, h).data;
        } catch {
          data = null; // tainted canvas → fall back to hard slicing
        }
        const isBlankRow = (rowY) => {
          if (!data || rowY < 0 || rowY >= h) return false;
          const base = rowY * w * 4;
          let nonBlank = 0;
          for (let x = 0; x < w; x += 4) {
            const i = base + x * 4;
            if (data[i] < 244 || data[i + 1] < 244 || data[i + 2] < 244) {
              if (++nonBlank > 2) return false;
            }
          }
          return true;
        };
        const isBlankRange = (y0, y1) => {
          if (!data) return false;
          for (let yy = y0; yy < y1; yy += 3) if (!isBlankRow(yy)) return false;
          return true;
        };
        return { isBlankRow, isBlankRange, hasData: !!data };
      };

      // ── Phase 1: compute clean slice ranges across every section ──
      const slices = [];
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;
        const canvas = await toCanvas(element, options);
        const mmPerPx = pdfWidth / canvas.width;
        const slicePx = Math.floor(contentHeightMM / mmPerPx);
        const { isBlankRow, isBlankRange, hasData } = makeRowScanner(canvas);

        let y = 0;
        while (y < canvas.height) {
          let cutY = Math.min(y + slicePx, canvas.height);

          // If this cut lands inside content, walk up to the nearest blank
          // gutter so we never slice through a card/text line.
          if (hasData && cutY < canvas.height) {
            const window = Math.floor(slicePx * 0.22);
            const minCut = y + Math.floor(slicePx * 0.5); // avoid tiny pages
            for (let yy = cutY; yy > cutY - window && yy > minCut; yy--) {
              if (isBlankRow(yy)) {
                cutY = yy;
                break;
              }
            }
          }

          // Skip fully-blank regions so we never emit an empty page.
          if (!(hasData && isBlankRange(y, cutY))) {
            slices.push({ canvas, mmPerPx, y, sliceH: cutY - y });
          }
          y = cutY;
        }
      }

      const totalPages = slices.length;

      // ── Phase 2: render each slice onto its own A4 page ──
      slices.forEach(({ canvas, mmPerPx, y, sliceH }, idx) => {
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width;
        tmp.height = sliceH;
        const ctx = tmp.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const dataUrl = tmp.toDataURL("image/jpeg", 0.9);

        if (idx > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, sliceH * mmPerPx, undefined, "FAST");
        addWatermark(pdf);
        addFooter(pdf, idx + 1, totalPages);
      });

      if (returnBase64) {
        return pdf.output("datauristring");
      }
      pdf.save(`Business-Health-${businessName.replace(/\s+/g, "-")}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      if (returnBase64) throw error;
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [businessName]);

  const handleSendWhatsApp = useCallback(async () => {
    const userId = getLocalStorage("userId");
    if (!userId) {
      toast.error("Please log in first");
      return;
    }
    setIsSendingWa(true);
    toast.loading("Preparing report & sending on WhatsApp...", { id: "gh-wa" });
    try {
      // Build the SAME full PDF as "Save PDF" and send it as a titled document.
      let pdfBase64 = "";
      try {
        pdfBase64 = await handleDownloadPDF(true);
      } catch (pdfErr) {
        console.error("PDF build for WhatsApp failed:", pdfErr);
      }

      const res = await fetch("/api/gmb-health/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessName, monthLabel, pdfBase64 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Report sent on WhatsApp!", { id: "gh-wa" });
      } else {
        toast.error(data.error || "WhatsApp send failed", { id: "gh-wa" });
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      toast.error("WhatsApp send failed. Please retry.", { id: "gh-wa" });
    } finally {
      setIsSendingWa(false);
    }
  }, [businessName, monthLabel, handleDownloadPDF]);

  const handleSendEmail = useCallback(async () => {
    const userId = getLocalStorage("userId");
    if (!userId) {
      toast.error("Please log in first");
      return;
    }
    setIsSendingEmail(true);
    toast.loading("Preparing report & sending email...", { id: "gh-email" });
    try {
      let pdfBase64 = "";
      try {
        pdfBase64 = await handleDownloadPDF(true);
      } catch (pdfErr) {
        console.error("PDF build for email failed:", pdfErr);
      }

      const res = await fetch("/api/gmb-health/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessName, monthLabel, pdfBase64 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Report sent to your email!", { id: "gh-email" });
      } else {
        toast.error(data.error || "Email send failed", { id: "gh-email" });
      }
    } catch (error) {
      console.error("Email send error:", error);
      toast.error("Email send failed. Please retry.", { id: "gh-email" });
    } finally {
      setIsSendingEmail(false);
    }
  }, [businessName, monthLabel, handleDownloadPDF]);

  const handleShare = useCallback(async () => {
    if (!navigator.share) {
      alert("Web Share API is not supported in your browser.");
      return;
    }

    try {
      setIsExporting(true);
      const { toBlob } = await import("html-to-image");
      const element = document.getElementById("audit-card-content");
      if (!element) return;

      const blob = await toBlob(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 1.5,
      });
      const file = new File([blob], `Business-Health-${businessName}.png`, {
        type: blob.type,
      });

      await navigator.share({
        title: `Business Health Report for ${businessName}`,
        text: `Here is the health check report for ${businessName}, generated by Limbu.ai.`,
        files: [file],
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        alert("Oops! Something went wrong while trying to share the report.");
      }
    } finally {
      setIsExporting(false);
    }
  }, [businessName]);

  // Priority Actions
  const severityRank = { high: 1, medium: 2, low: 3 };
  const actionItems = [...priorityActions].sort(
    (a, b) =>
      (severityRank[a.priority?.toLowerCase()] || 99) -
      (severityRank[b.priority?.toLowerCase()] || 99),
  );

  // Success items
  const successItems = scoreBreakdown
    .filter((item) => item.out_of > 0 && item.score / item.out_of >= 0.8)
    .map((item) => item.factor);

  const categories = [
    profile.primary_category,
    ...(profile.additional_categories || []),
  ].filter(Boolean);

  const handleRedirect = useCallback(
    (action) => {
      const text = (action || "").toLowerCase();
      if (text.includes("review")) router.push("/review-management");
      else if (text.includes("post") || text.includes("photo") || text.includes("media"))
        router.push("/post-management");
    },
    [router],
  );

  return (
    <div className="max-w-7xl mx-auto font-sans px-4 sm:px-6 lg:px-8 py-8">
      <div
        id="audit-card-content"
        className="bg-white rounded-[1.5rem] shadow-2xl overflow-hidden mb-8 border border-slate-100"
      >
        {/* ─────────────── PAGE 1 — Score & Snapshot ─────────────── */}
        <div id="pdf-page-1" className="bg-white">
          <div className="relative text-slate-900 p-6 sm:p-8 overflow-hidden border-b border-slate-100">
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(234, 179, 8, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 179, 8, 0.3) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 shadow-sm">
                    <Activity className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="font-extrabold uppercase tracking-tight text-slate-900 text-lg sm:text-xl">
                    Business <span className="text-amber-500">Health</span> Report
                  </h2>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {businessType && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-slate-200 bg-slate-50 text-slate-600 shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      {businessType}
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-slate-200 bg-slate-50 text-slate-500 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{date}</span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="w-full bg-slate-50/70 border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm transition-all hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm shrink-0">
                    <MapPin className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex flex-col w-full">
                    <h3 className="font-extrabold text-xl text-slate-950 mb-1 leading-tight">
                      {businessName}
                    </h3>
                    {profile.address && (
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {profile.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-5 border-t border-slate-200/60 mt-5">
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors">
                      <Phone className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold">{profile.phone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                      <Globe className="w-4 h-4 text-amber-500" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold truncate max-w-[220px]"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.maps_link && (
                    <a
                      href={profile.maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-slate-700 font-bold hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      View on Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Speedometer */}
          <AnimatedSpeedometer targetScore={Math.round(totalScore)} statusText={status} />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-6 sm:px-8 pb-10">
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Reviews"
              value={reviews.total_reviews ?? 0}
              color="#3b82f6"
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              title="Rating"
              value={reviews.average_rating != null ? reviews.average_rating.toFixed(1) : "N/A"}
              color="#eab308"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              title="Posts"
              value={posts.total_posts ?? 0}
              color="#8b5cf6"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              title="Posts / 30d"
              value={posts.posts_last_30_days ?? 0}
              color="#10b981"
            />
            <StatCard
              icon={<ImageIcon className="w-5 h-5" />}
              title="Media"
              value={media.total_media ?? 0}
              color="#ec4899"
            />
          </div>
        </div>

        {/* ─────────────── PAGE 2 — Categories, Keywords, Score Breakdown ─────────────── */}
        <div id="pdf-page-2" className="bg-white p-6 sm:p-8 border-t border-slate-100">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                    Core Categories
                  </h3>
                  <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                    {categories.length} Total
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map((cat, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] ${
                        i === 0
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {cat}{" "}
                      {i === 0 && (
                        <span className="opacity-65 ml-1 text-[9px] font-medium">(Primary)</span>
                      )}
                    </span>
                  ))}
                  {categories.length > 4 && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
                    >
                      +{categories.length - 4} More
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Profile completeness */}
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/80 shadow-sm">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-4">
                Profile Completeness
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FactChip ok={profile.has_regular_hours} label="Regular Hours" />
                <FactChip ok={profile.has_special_hours} label="Special Hours" />
                <FactChip
                  ok={(profile.description_length ?? 0) >= 250}
                  label={`Description (${profile.description_length ?? 0} chars)`}
                />
                <FactChip
                  ok={(profile.total_services_or_menu_items ?? 0) > 0}
                  label={`Services (${profile.total_services_or_menu_items ?? 0})`}
                />
              </div>
            </div>
          </div>

          {/* Keyword Analysis */}
          {keywords?.expected_keywords?.length > 0 && <KeywordAnalysis keywords={keywords} />}

          {/* Score Breakdown */}
          <div>
            <div className="text-center mb-8 mt-10">
              <h3 className="font-extrabold uppercase tracking-tight mb-2 text-2xl text-slate-900">
                Detailed <span className="text-amber-500">Performance</span> Check
              </h3>
              <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
              {scoreBreakdown.map((item) => (
                <div key={item.factor} className="w-full">
                  <ScoreItem
                    factor={item.factor}
                    score={item.score}
                    outOf={item.out_of}
                    details={item.details || []}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────── PAGE 3 — Intelligence, Advice, Actions ─────────────── */}
        <div id="pdf-page-3" className="bg-white p-6 sm:p-8 border-t border-slate-100">
          {/* Intelligence panels */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <ReviewIntelligence reviews={reviews} />
            <div className="flex flex-col gap-6">
              <PostConsistency posts={posts} />
              <MediaConsistency media={media} />
            </div>
          </div>

          {/* AI Guidance */}
          {guidanceText && (
            <div className="mb-8">
              <div className="rounded-2xl p-6 border border-slate-200 relative overflow-hidden bg-slate-50/70 shadow-sm">
                <div
                  className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]"
                  style={{
                    backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <FileText className="w-5 h-5 text-slate-800" />
                    </div>
                    <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                      Smart <span className="text-amber-500">Advice</span>
                    </h3>
                  </div>
                  <NarrativeBody text={guidanceText} />
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <ActionBox
              title="Priority Actions"
              danger
              items={actionItems}
              onRedirect={handleRedirect}
            />
            <ActionBox title="What You're Doing Right" items={successItems} />
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pb-12">
        <Link href="/dashboard" target="_blank" className="w-full sm:w-auto flex-1 max-w-[240px]">
          <button className="w-full py-4 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black">
            Improve Rank ↗
          </button>
        </Link>

        <button
          onClick={() => handleDownloadPDF()}
          disabled={isExporting}
          className="w-full sm:w-auto flex-1 max-w-[240px] py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border-2 border-slate-200 hover:border-slate-350 text-slate-700 bg-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Processing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Save PDF
            </>
          )}
        </button>

        <button
          onClick={handleSendWhatsApp}
          disabled={isSendingWa}
          className="w-full sm:w-auto flex-1 max-w-[240px] py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
        >
          {isSendingWa ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Sending...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp
            </>
          )}
        </button>

        <button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className="w-full sm:w-auto flex-1 max-w-[240px] py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all border-2 border-slate-200 hover:border-slate-350 text-slate-700 bg-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {isSendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Email
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          disabled={isExporting}
          className="w-full sm:w-auto flex-1 max-w-[240px] py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Processing...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share Link
            </>
          )}
        </button>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-fadeIn"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold uppercase tracking-wider text-sm text-slate-900">
                Business Categories
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      i === 0
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {cat}{" "}
                    {i === 0 && (
                      <span className="opacity-60 ml-1 text-[10px] font-medium">(Primary)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- SUB-COMPONENTS -------------------- */

const FactChip = React.memo(({ ok, label }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
      ok
        ? "bg-emerald-50 border-emerald-150 text-emerald-700"
        : "bg-rose-50 border-rose-100 text-rose-600"
    }`}
  >
    {ok ? (
      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
    ) : (
      <XCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
    )}
    <span className="leading-tight">{label}</span>
  </div>
));
FactChip.displayName = "FactChip";

const KeywordAnalysis = React.memo(({ keywords }) => {
  const found = new Set([
    ...(keywords.found_in_description || []),
    ...(keywords.found_in_services || []),
    ...(keywords.found_in_categories || []),
  ]);
  const missing = keywords.missing_keywords || [];
  const expected = keywords.expected_keywords || [];
  const coverage = expected.length ? Math.round((found.size / expected.length) * 100) : 0;

  const matchBars = [
    { label: "Description", value: keywords.description_match_score },
    { label: "Services", value: keywords.services_match_score },
    { label: "Categories", value: keywords.categories_match_score },
  ].filter((b) => typeof b.value === "number");

  return (
    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/80 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-5">
        <Search className="w-4 h-4 text-amber-500" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">
          Keyword Coverage
        </h3>
        <span className="ml-auto text-xs font-extrabold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
          {coverage}% covered
        </span>
      </div>

      {matchBars.length > 0 && (
        <div className="flex flex-col gap-4 mb-6">
          {matchBars.map((b) => {
            const pct = Math.round(b.value);
            const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f97316" : "#ef4444";
            return (
              <div key={b.label} className="w-full">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <span>{b.label}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {found.size > 0 && (
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Include Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...found].map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 transition-all hover:bg-emerald-100"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Missing Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((k, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 transition-all hover:bg-rose-100"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
KeywordAnalysis.displayName = "KeywordAnalysis";

const ReviewIntelligence = React.memo(({ reviews }) => {
  const dist = reviews.rating_distribution || {};
  const rows = [
    { star: 5, count: dist.five_star || 0 },
    { star: 4, count: dist.four_star || 0 },
    { star: 3, count: dist.three_star || 0 },
    { star: 2, count: dist.two_star || 0 },
    { star: 1, count: dist.one_star || 0 },
  ];
  const maxCount = Math.max(1, ...rows.map((r) => r.count));
  const replyRate = Math.round(reviews.reply_rate_percent ?? 0);

  return (
    <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">
          Review Intelligence
        </h3>
      </div>

      <div className="flex items-center gap-6 mb-5">
        <div className="text-center shrink-0">
          <div className="text-4xl font-extrabold text-slate-900 leading-none">
            {reviews.average_rating != null ? reviews.average_rating.toFixed(1) : "—"}
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3.5 h-3.5"
                fill={s <= Math.round(reviews.average_rating || 0) ? "#eab308" : "none"}
                stroke="#eab308"
              />
            ))}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-2">
            {reviews.total_reviews ?? 0} reviews
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {rows.map((r) => (
            <div key={r.star} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 w-3">{r.star}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 w-6 text-right">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <MiniStat
          icon={<Reply className="w-4 h-4" />}
          label="Reply Rate"
          value={`${replyRate}%`}
          good={replyRate >= 80}
        />
        <MiniStat
          icon={<AlertCircle className="w-4 h-4" />}
          label="Unreplied"
          value={reviews.unreplied_count ?? 0}
          good={(reviews.unreplied_count ?? 0) === 0}
        />
      </div>
    </div>
  );
});
ReviewIntelligence.displayName = "ReviewIntelligence";

const PostConsistency = React.memo(({ posts }) => {
  const wb = posts.weekly_breakdown || {};
  const weeks = [
    { label: "W1", count: wb.week_1 || 0 },
    { label: "W2", count: wb.week_2 || 0 },
    { label: "W3", count: wb.week_3 || 0 },
    { label: "W4", count: wb.week_4 || 0 },
  ];
  const good = /good|consistent|excellent|strong/i.test(posts.pattern_status || "");

  const posts30 = posts.posts_last_30_days ?? 0;
  const target = posts.alternate_day_target ?? 0;
  const weeklyTarget = target > 0 ? target / 4 : 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((posts30 / target) * 100)) : 0;
  const scaleMax = Math.max(1, ...weeks.map((w) => w.count), weeklyTarget);

  const progressColor = progressPct >= 80 ? "#10b981" : progressPct >= 40 ? "#8b5cf6" : "#f97316";

  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-violet-500" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-800">
          Post Consistency
        </h3>
        {posts.pattern_status && (
          <span
            className={`ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
              good
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-orange-50 text-orange-700 border-orange-200"
            }`}
          >
            {posts.pattern_status}
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 leading-none">{posts30}</span>
            {target > 0 && <span className="text-xs font-bold text-slate-400">/ {target} goal</span>}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              in 30 days
            </span>
          </div>
          {target > 0 && (
            <span className="text-xs font-extrabold" style={{ color: progressColor }}>
              {progressPct}%
            </span>
          )}
        </div>
        {target > 0 && (
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%`, backgroundColor: progressColor }}
            />
          </div>
        )}
      </div>

      <div className="relative h-20 mb-2">
        {weeklyTarget > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-violet-300 z-10 flex justify-end"
            style={{ bottom: `${(weeklyTarget / scaleMax) * 100}%` }}
          >
            <span className="text-[8px] font-bold text-violet-450 -mt-2.5 bg-white px-1">
              goal ~{Math.round(weeklyTarget)}/wk
            </span>
          </div>
        )}
        <div className="flex items-end justify-between gap-3 h-full">
          {weeks.map((w) => {
            const meets = weeklyTarget > 0 && w.count >= weeklyTarget;
            return (
              <div
                key={w.label}
                className="flex-1 flex flex-col items-center justify-end h-full gap-1"
              >
                <span className="text-[10px] font-bold text-slate-700">{w.count}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max(6, (w.count / scaleMax) * 100)}%`,
                    backgroundColor: meets ? "#8b5cf6" : "#c4b5fd",
                  }}
                />
                <span className="text-[9px] font-bold text-slate-400">{w.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 mt-auto border-t border-slate-100 text-center">
        <div>
          <div className="text-sm font-bold text-slate-800 leading-none">
            {posts.total_posts ?? 0}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            Total
          </div>
        </div>
        <div>
          <div
            className={`text-sm font-bold leading-none ${
              (posts.longest_gap_days ?? 0) > 7 ? "text-orange-600" : "text-slate-800"
            }`}
          >
            {posts.longest_gap_days ?? 0}d
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            Longest Gap
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800 leading-none">
            {posts.last_post_days_ago != null ? `${posts.last_post_days_ago}d` : "—"}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            Last Post
          </div>
        </div>
      </div>
    </div>
  );
});
PostConsistency.displayName = "PostConsistency";

const MediaConsistency = React.memo(({ media }) => {
  const good = /fresh|good|active|recent/i.test(media.freshness_status || "");
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-pink-500" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-800">
          Media Freshness
        </h3>
        {media.freshness_status && (
          <span
            className={`ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
              good
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-orange-50 text-orange-700 border-orange-200"
            }`}
          >
            {media.freshness_status}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniBlock value={media.total_media ?? 0} label="Total" />
        <MiniBlock value={media.added_last_90_days ?? 0} label="New 90d" />
        <MiniBlock
          value={media.last_upload_days_ago != null ? `${media.last_upload_days_ago}d` : "—"}
          label="Last Up"
        />
      </div>
    </div>
  );
});
MediaConsistency.displayName = "MediaConsistency";

const MiniStat = React.memo(({ icon, label, value, good }) => (
  <div
    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
      good ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"
    }`}
  >
    <span className={good ? "text-emerald-600" : "text-slate-400"}>{icon}</span>
    <div>
      <div className="text-sm font-bold text-slate-800 leading-none">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
        {label}
      </div>
    </div>
  </div>
));
MiniStat.displayName = "MiniStat";

const MiniBlock = React.memo(({ value, label }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 py-3 transition-colors hover:bg-slate-100/50">
    <div className="text-lg font-extrabold text-slate-800 leading-none">{value}</div>
    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
      {label}
    </div>
  </div>
));
MiniBlock.displayName = "MiniBlock";

const renderInline = (str, keyPrefix = "") =>
  str
    .split(/(\*\*.*?\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={`${keyPrefix}b${j}`} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
        return (
          <em key={`${keyPrefix}i${j}`} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      return <React.Fragment key={`${keyPrefix}t${j}`}>{part}</React.Fragment>;
    });

const NarrativeBody = React.memo(({ text }) => {
  const lines = text.split("\n");

  return (
    <div className="text-slate-600 leading-relaxed font-medium text-sm">
      {lines.map((raw, i) => {
        const line = raw.trim();

        if (/^-{3,}$|^\*{3,}$/.test(line)) return <hr key={i} className="my-5 border-slate-200" />;

        if (!line) return <div key={i} className="h-2.5" />;

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading)
          return (
            <h4
              key={i}
              className="text-sm font-black uppercase tracking-wider mt-5 mb-2.5 text-slate-900"
            >
              {renderInline(heading[2], `h${i}`)}
            </h4>
          );

        if (/^\*\*[^*].*\*\*:?$/.test(line))
          return (
            <h5 key={i} className="font-bold mt-4 mb-2 text-slate-800 text-xs uppercase tracking-wider">
              {line.replace(/^\*\*|\*\*:?$/g, "").trim()}
              {line.endsWith(":") ? ":" : ""}
            </h5>
          );

        const bullet = line.match(/^[*\-•]\s+(.*)$/);
        if (bullet)
          return (
            <div key={i} className="flex gap-2.5 items-start mb-2.5 pl-1.5">
              <span className="mt-2.2 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="flex-1">{renderInline(bullet[1], `l${i}`)}</span>
            </div>
          );

        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered)
          return (
            <div key={i} className="flex gap-2.5 items-start mb-2.5 pl-1.5">
              <span className="mt-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 flex-shrink-0">
                {numbered[1]}
              </span>
              <span className="flex-1">{renderInline(numbered[2], `n${i}`)}</span>
            </div>
          );

        return (
          <p key={i} className="mb-2">
            {renderInline(line, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
});
NarrativeBody.displayName = "NarrativeBody";

const AnimatedSpeedometer = React.memo(({ targetScore, statusText }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = targetScore / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [targetScore]);

  const getStatusColor = (score) => {
    if (score >= 90)
      return {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#059669",
        border: "rgba(16, 185, 129, 0.25)",
        label: statusText || "Great Shape",
        icon: <Trophy className="w-4 h-4" />,
      };
    if (score >= 60)
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#d97706",
        border: "rgba(245, 158, 11, 0.25)",
        label: statusText || "Needs Work",
        icon: <Zap className="w-4 h-4" />,
      };
    return {
      bg: "rgba(239, 68, 68, 0.1)",
      text: "#dc2626",
      border: "rgba(239, 68, 68, 0.25)",
      label: statusText || "Needs Urgent Fixes",
      icon: <ShieldAlert className="w-4 h-4" />,
    };
  };

  const statusInfo = getStatusColor(targetScore);

  return (
    <div
      className="flex flex-col items-center py-10 relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #ffffff, #f8fafc)" }}
    >
      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        <div className="relative w-80 h-48 mx-auto">
          <Speedometer score={animatedScore} />
        </div>

        <div className="text-center mt-6">
          <div className="font-extrabold leading-none mb-2 text-5xl sm:text-6xl text-slate-900 tracking-tight">
            {animatedScore}
            <span className="text-2xl text-slate-300 ml-1">/100</span>
          </div>

          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[11px] font-black tracking-wider uppercase shadow-sm transition-all duration-500"
            style={{
              backgroundColor: statusInfo.bg,
              color: statusInfo.text,
              border: `1.5px solid ${statusInfo.border}`,
            }}
          >
            {statusInfo.icon}
            {statusInfo.label}
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: statusInfo.text }}
            />
          </div>
        </div>

        <p className="mt-6 text-[12px] max-w-md mx-auto text-center font-semibold leading-relaxed text-slate-500">
          Based on{" "}
          <span className="text-slate-900 font-extrabold underline decoration-amber-300 decoration-2 underline-offset-4">
            key success factors
          </span>
          , your profile currently captures{" "}
          <span className="text-slate-900 font-extrabold text-sm">{animatedScore}%</span> of its
          potential customers.
        </p>
      </div>
    </div>
  );
});
AnimatedSpeedometer.displayName = "AnimatedSpeedometer";

const Speedometer = React.memo(({ score }) => {
  const radius = 140;
  const strokeWidth = 24;
  const center = 160;

  const getCoords = (angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  };

  const start = getCoords(180);
  const endRed = getCoords(288);
  const endOrange = getCoords(324);
  const endGreen = getCoords(360);

  const needleAngle = 180 + (score / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 20;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  const labels = [0, 25, 50, 75, 100];

  return (
    <svg width="320" height="200" viewBox="0 0 320 200" className="mx-auto">
      {/* SVG Arc Filters for smoother UI */}
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
        </filter>
      </defs>
      <path
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${endRed.x} ${endRed.y}`}
        fill="none"
        stroke="#f87171"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${endRed.x} ${endRed.y} A ${radius} ${radius} 0 0 1 ${endOrange.x} ${endOrange.y}`}
        fill="none"
        stroke="#fb923c"
        strokeWidth={strokeWidth}
      />
      <path
        d={`M ${endOrange.x} ${endOrange.y} A ${radius} ${radius} 0 0 1 ${endGreen.x} ${endGreen.y}`}
        fill="none"
        stroke="#34d399"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {labels.map((val) => {
        const a = 180 + (val / 100) * 180;
        const textRad = (a * Math.PI) / 180;
        const textR = radius - 35;
        const tx = center + textR * Math.cos(textRad);
        const ty = center + textR * Math.sin(textRad);
        return (
          <text
            key={val}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] font-extrabold"
            fill="#94a3b8"
          >
            {val}
          </text>
        );
      })}
      {/* 3D Pin Style Dial */}
      <circle cx={center} cy={center} r="40" fill="#1e293b" filter="url(#shadow)" />
      <line
        x1={center}
        y1={center}
        x2={needleX}
        y2={needleY}
        stroke="#1e293b"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx={center} cy={center} r="8" fill="#f87171" />
    </svg>
  );
});
Speedometer.displayName = "Speedometer";

const ScoreItem = React.memo(({ factor, score, outOf, details }) => {
  const percentage = outOf > 0 ? Math.round((score / outOf) * 100) : 0;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = (p) => {
    if (p >= 90) return "#10b981";
    if (p >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const strokeColor = getStrokeColor(percentage);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 min-w-[200px] h-full">
      <div className="flex-grow">
        <div className="relative w-20 h-20 mb-3 mx-auto">
          <svg className="w-full h-full" viewBox="0 0 60 60">
            <circle
              className="text-slate-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="30"
              cy="30"
            />
            <circle
              className="transform -rotate-90 origin-center text-slate-800"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke={strokeColor}
              fill="transparent"
              r="28"
              cx="30"
              cy="30"
              style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-base font-extrabold"
            style={{ color: strokeColor }}
          >
            {percentage}%
          </span>
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm leading-tight px-1">{factor}</h4>
        <p className="text-xs text-slate-400 font-bold mt-1.5">
          {score}/{outOf} pts
        </p>
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 w-full space-y-2.5 text-left">
          {details.map((detail, index) => (
            <div key={index} className="text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{detail.item}</span>
                <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-md text-[10px]">
                  {detail.score}/{detail.out_of}
                </span>
              </div>
              {detail.note && (
                <div className="text-right text-slate-400 text-[10px] mt-0.5 font-medium">
                  {detail.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
ScoreItem.displayName = "ScoreItem";

const StatCard = React.memo(({ icon, title, value, color }) => {
  return (
    <div
      className="group p-5 rounded-2xl border border-slate-100 text-center transition-all duration-350 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden bg-white"
      style={{ boxShadow: "0 4px 20px -5px rgba(0,0,0,0.03)" }}
    >
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500"
        style={{ backgroundColor: color }}
      />
      <div
        className="inline-flex p-3 rounded-xl mb-3 transition-colors duration-300"
        style={{ backgroundColor: `${color}12`, color: color }}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
      <div className="text-[10px] mt-2 font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
        {title}
      </div>
    </div>
  );
});
StatCard.displayName = "StatCard";

const ActionBox = React.memo(({ title, items, danger, onRedirect }) => {
  const bgStyle = danger
    ? {
        background: "linear-gradient(to bottom right, #fffafb, #fffbf7)",
        borderColor: "#fee2e2",
      }
    : {
        background: "linear-gradient(to bottom right, #fbfdfb, #f5fdf9)",
        borderColor: "#d1fae5",
      };

  const titleColor = danger ? "#991b1b" : "#065f46";

  return (
    <div className="rounded-2xl p-5 sm:p-6 border-2 shadow-sm" style={bgStyle}>
      <h4 className="font-extrabold mb-4 text-base sm:text-lg flex items-center gap-2" style={{ color: titleColor }}>
        {danger ? "❌" : "✓"} {title}
      </h4>
      <ul className="space-y-3.5 text-sm">
        {items.filter(Boolean).map((item, i) => {
          const isObj = typeof item === "object";
          const text = isObj ? item.action : item;
          const priority = isObj ? item.priority : null;
          const potentialPoints = isObj ? item.potential_points : null;

          let severityBadge = null;
          if (danger && priority) {
            const badgeColors = {
              high: "bg-red-50 text-red-700 border-red-200",
              medium: "bg-orange-50 text-orange-700 border-orange-200",
              low: "bg-yellow-50 text-yellow-700 border-yellow-200",
            };
            severityBadge = (
              <span
                className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border shadow-sm ${
                  badgeColors[priority.toLowerCase()] || badgeColors.low
                }`}
              >
                {priority}
              </span>
            );
          }

          return (
            <li
              key={i}
              className={`flex gap-3 items-start p-2 -mx-2 rounded-xl transition-all ${
                danger && onRedirect
                  ? "cursor-pointer hover:bg-rose-50/70 group"
                  : "hover:bg-slate-50/40"
              }`}
              onClick={() => {
                if (danger && onRedirect) onRedirect(text);
              }}
            >
              <div className="mt-0.5 shrink-0">
                {danger ? (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="font-bold text-slate-800 text-[13px] sm:text-sm flex items-center gap-1 leading-snug">
                    {text}
                    {danger && onRedirect && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                    )}
                  </span>
                  {severityBadge}
                </div>
                {danger && potentialPoints != null && potentialPoints > 0 && (
                  <span className="text-xs text-slate-550 font-bold flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    +{potentialPoints} points potential
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {danger && (
        <p className="text-[10px] mt-5 font-bold flex items-center gap-1.5 text-rose-600/80 italic uppercase tracking-wider">
          <TrendingDown className="w-3.5 h-3.5" />
          Fixing these can significantly improve your local ranking.
        </p>
      )}
    </div>
  );
});
ActionBox.displayName = "ActionBox";