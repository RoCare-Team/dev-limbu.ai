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
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toPng, toBlob } from "html-to-image";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GBPAuditCard({ audit }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Handle potential nested structure from input (audit[""] or direct audit)
  const router = useRouter();
  const auditData = audit[""] || audit;
  const guidanceText = audit.output?.[0]?.content?.[0]?.text || "";

  const {
    totalScore,
    status,
    dataSnapshot,
    scoreBreakdown,
    recommendationSignals,
  } = auditData;

  // Animate score on mount
  useEffect(() => {
    let start = 0;
    const end = totalScore;
    const duration = 2000; // 2 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [totalScore]);

  const getStatusColor = (score) => {
    if (score >= 90)
      return {
        bg: "rgba(34, 197, 94, 0.1)",
        text: "#16a34a",
        label: "Elite Ranking",
        icon: <Trophy className="w-4 h-4" />,
      };
    if (score >= 60)
      return {
        bg: "rgba(250, 204, 21, 0.1)",
        text: "var(--lemon-hover)",
        label: "Moderate Visibility",
        icon: <Zap className="w-4 h-4" />,
      };
    return {
      bg: "rgba(239, 68, 68, 0.1)",
      text: "#dc2626",
      label: "Critical Attention Required",
      icon: <ShieldAlert className="w-4 h-4" />,
    };
  };

  const statusInfo = getStatusColor(totalScore);

  const date = new Date().toLocaleString();
  const reportId = `GBP-AUDIT-${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")}`;

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const options = {
      quality: 0.98,
      backgroundColor: "#ffffff",
      pixelRatio: 2.5,
    };

    // --- Load Logo ---
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

    // --- PDF Page Generation Helpers ---
    const addPageFromElement = async (elementId, pdfInstance) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      const dataUrl = await toPng(element, options);
      const imgProps = pdfInstance.getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdfInstance.addImage(dataUrl, "PNG", 0, 0, pdfWidth, imgHeight);
    };

    const addFooter = (pdfInstance, pageNum, totalPages) => {
      const pageHeight = pdfInstance.internal.pageSize.getHeight();
      if (logoDataUrl) {
        pdfInstance.addImage(logoDataUrl, "PNG", 15, pageHeight - 20, 15, 15);
      }
      pdfInstance.setFontSize(9);
      pdfInstance.setTextColor(150, 150, 150);
      pdfInstance.text("Powered by Limbu.ai", 35, pageHeight - 13);
      pdfInstance.text(
        `Page ${pageNum} of ${totalPages}`,
        pdfWidth - 30,
        pageHeight - 13,
      );
    };

    // --- Generate Pages ---
    await addPageFromElement("pdf-page-1", pdf);
    addFooter(pdf, 1, 3);

    pdf.addPage();
    await addPageFromElement("pdf-page-2", pdf);
    addFooter(pdf, 2, 3);

    pdf.addPage();
    await addPageFromElement("pdf-page-3", pdf);
    addFooter(pdf, 3, 3);

    // --- Save PDF ---
    pdf.save(`GBP-Audit-${dataSnapshot.businessName.replace(/\s+/g, "-")}.pdf`);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("Web Share API is not supported in your browser.");
      return;
    }
    const element = document.getElementById("audit-card-content");
    if (!element) return;

    try {
      const blob = await toBlob(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 1.5,
      });
      const file = new File(
        [blob],
        `GBP-Audit-${dataSnapshot.businessName}.png`,
        { type: blob.type },
      );

      await navigator.share({
        title: `Google Business Profile Audit for ${dataSnapshot.businessName}`,
        text: `Here is the GMB audit report for ${dataSnapshot.businessName}, generated by Limbu.ai.`,
        files: [file],
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        alert("Oops! Something went wrong while trying to share the report.");
      }
    }
  };

  // Process Recommendation Signals for "Action Required"
  const actionItems = [];
  if (recommendationSignals) {
    Object.entries(recommendationSignals).forEach(([key, data]) => {
      if (data && data.reason) {
        actionItems.push({
          text: data.reason,
          subtext: data.impact,
          severity: data.severity || "medium",
          signalKey: key,
        });
      }
    });
  }

  // Sort by severity: High -> Medium -> Low
  const severityRank = { high: 1, medium: 2, low: 3 };
  actionItems.sort(
    (a, b) =>
      (severityRank[a.severity?.toLowerCase()] || 99) -
      (severityRank[b.severity?.toLowerCase()] || 99),
  );

  // Process Successes for "What You're Doing Right"
  const successItems = [];
  if (scoreBreakdown) {
    scoreBreakdown.forEach((item) => {
      // If score is perfect or high (>= 80%)
      if (item.outOf > 0 && item.score / item.outOf >= 0.8) {
        successItems.push(item.factor);
      }
    });
  }

  const categories = [
    dataSnapshot.primaryCategory,
    ...(dataSnapshot.additionalCategories || []),
  ].filter(Boolean);

  const services = dataSnapshot.services || [];

  const handleRedirect = (key) => {
    const routes = {
      reviews: "/review-management",
      posts: "/post-management",
      media: "/post-management",
      services: "#services",
    };
    if (routes[key]) {
      if (routes[key] === "#services") {
        setShowServiceModal(true);
      } else {
        router.push(routes[key]);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto font-sans">
      <div
        id="audit-card-content"
        className="bg-white rounded-[1.5rem] shadow-xl overflow-hidden mb-6 border border-slate-200"
      >
        <div id="pdf-page-1" className="bg-white">
          {/* Header */}
          <div
            className="relative text-slate-900 p-6 overflow-hidden border-b border-slate-100"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* ── Subtle background grid ── */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(250, 204, 21, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 204, 21, 0.3) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: "rgba(250, 204, 21, 0.1)",
                    border: "1px solid rgba(250, 204, 21, 0.2)",
                  }}
                >
                  <Trophy
                    className="w-4 h-4"
                    style={{ color: "var(--lemon-hover)" }}
                  />
                </div>
                <h2
                  className="font-bold uppercase tracking-tight"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.1rem",
                  }}
                >
                  GBP{" "}
                  <span style={{ color: "var(--lemon-hover)" }}>
                    Performance Audit
                  </span>{" "}
                  Report
                </h2>
                {/* Audit Meta */}
                <div className="flex justify-between items-end gap-3">
                  {/* Report ID */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-slate-200"
                    style={{ backgroundColor: "#f8fafc", color: "#64748b" }}
                  >
                    <Calendar
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--lemon-hover)" }}
                    />
                    <span>
                      Report ID:{" "}
                      {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </span>
                  </div>

                  {/* Generated Date + Time (Same UI) */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-slate-200"
                    style={{ backgroundColor: "#f8fafc", color: "#64748b" }}
                  >
                    <Calendar
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--lemon-hover)" }}
                    />
                    <span>Generated On: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4">
                {/* Business Info Glass Card */}
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <MapPin className="w-4 h-4 text-[var(--lemon-hover)]" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-bold text-base text-slate-900 mb-1">
                          {dataSnapshot.businessName}
                        </span>
                        <span className="text-xs text-slate-500 leading-relaxed max-w-sm">
                          {dataSnapshot.storeAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-200 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[var(--lemon-hover)]" />
                        <span className="text-[11px] text-slate-600 font-bold">
                          {dataSnapshot.phone}
                        </span>
                      </div>
                      {dataSnapshot.website && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[var(--lemon-hover)]" />
                          <span className="text-[11px] text-slate-600 font-bold truncate max-w-[150px]">
                            {dataSnapshot.website}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Speedometer Gauge Section */}
          <div
            className="flex flex-col items-center py-10 relative overflow-hidden"
            style={{
              background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
            }}
          >
            <div className="relative z-10 w-full max-w-xl mx-auto px-6">
              <div className="relative w-80 h-48 mx-auto">
                <Speedometer score={animatedScore} />
              </div>

              <div className="text-center mt-4">
                <div
                  className="font-black leading-none mb-2"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(3rem, 6vw, 4rem)",
                    color: "var(--cyber-black)",
                  }}
                >
                  {animatedScore}
                  <span className="text-2xl opacity-30">/100</span>
                </div>

                <div
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase shadow-sm transition-all duration-500"
                  style={{
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.text,
                    border: `1.5px solid ${statusInfo.text}30`,
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

              <p
                className="mt-6 text-[12px] max-w-md mx-auto text-center font-semibold leading-relaxed"
                style={{ color: "var(--tech-gray)" }}
              >
                Based on{" "}
                <span className="text-black font-black underline decoration-[var(--lemon-glow)] decoration-2 underline-offset-4">
                  24 distinct signals
                </span>
                , your profile currently captures{" "}
                <span className="text-black font-black text-sm">
                  {animatedScore}%
                </span>{" "}
                of its local search potential.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-6 pb-10">
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              title="Reviews"
              value={dataSnapshot.totalReviews}
              color="#3b82f6"
            />
            <StatCard
              icon={<Star className="w-5 h-5" />}
              title="Rating"
              value={dataSnapshot.averageRating ?? "N/A"}
              color="#eab308"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              title="Posts"
              value={dataSnapshot.totalPosts}
              color="#8b5cf6"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              title="Recent"
              value={dataSnapshot.postsLast30Days}
              color="#10b981"
            />
            <StatCard
              icon={<ImageIcon className="w-5 h-5" />}
              title="Media"
              value={dataSnapshot.totalMedia}
              color="#ec4899"
            />
          </div>
        </div>

        <div id="pdf-page-2" className="bg-white p-8">
          {/* Categories Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            {categories.length > 0 && (
              <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--tech-silver)",
                    }}
                  >
                    Core Categories
                  </h3>
                  <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    {categories.length} Total
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map((cat, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${i === 0 ? "bg-black text-white border-black" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      {cat}{" "}
                      {i === 0 && (
                        <span className="opacity-50 ml-1 text-[9px] font-medium">
                          (Primary)
                        </span>
                      )}
                    </span>
                  ))}
                  {categories.length > 4 && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-400 border border-slate-200 hover:border-black transition-all cursor-pointer"
                    >
                      +{categories.length - 4} More
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Services Section */}
            {services.length > 0 && (
              <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--tech-silver)",
                    }}
                  >
                    Identified Services
                  </h3>
                  <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    {services.length} Listed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.slice(0, 4).map((service, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-600 border-slate-200"
                    >
                      {typeof service === "string"
                        ? service
                        : service?.displayName || service}
                    </span>
                  ))}
                  {services.length > 4 && (
                    <button
                      onClick={() => setShowServiceModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-400 border border-slate-200 hover:border-black transition-all cursor-pointer"
                    >
                      +{services.length - 4} More
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div>
            <div className="text-center mb-10">
              <h3
                className="font-bold uppercase tracking-tight mb-2"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.75rem",
                  color: "var(--cyber-black)",
                }}
              >
                Deep <span style={{ color: "var(--lemon-hover)" }}>Signal</span>{" "}
                Analysis
              </h3>
              <div className="w-12 h-1 bg-black mx-auto rounded-full" />
            </div>

            <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 px-1 snap-x custom-scroll">
              {scoreBreakdown.map((item) => (
                <ScoreItem
                  key={item.factor}
                  factor={item.factor}
                  score={item.score}
                  outOf={item.outOf}
                  details={item.details || []}
                  dataSnapshot={dataSnapshot}
                />
              ))}
            </div>
          </div>
        </div>

        <div id="pdf-page-3" className="bg-white p-6">
          {/* AI Guidance Section */}
          {guidanceText && (
            <div className="mb-8">
              <div className="rounded-2xl p-6 border border-slate-200 relative overflow-hidden bg-slate-50">
                {/* Subtle Grid */}
                <div
                  className="pointer-events-none absolute inset-0 z-0 opacity-50"
                  style={{
                    backgroundImage:
                      "radial-gradient(#e2e8f0 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-200">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                      <FileText className="w-5 h-5 text-slate-800" />
                    </div>
                    <h3
                      className="text-lg font-bold uppercase tracking-widest text-slate-900"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Strategic{" "}
                      <span style={{ color: "var(--lemon-hover)" }}>
                        Insights
                      </span>
                    </h3>
                  </div>

                  <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium">
                    {guidanceText.split("\n").map((line, i) => {
                      if (line.startsWith("###"))
                        return (
                          <h4
                            key={i}
                            className="text-base font-bold uppercase tracking-widest mt-6 mb-3 text-slate-900"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {line.replace(/###/g, "").trim()}
                          </h4>
                        );
                      if (line.startsWith("**") && line.endsWith("**"))
                        return (
                          <h5
                            key={i}
                            className="font-bold mt-4 mb-2 text-slate-800 text-xs uppercase tracking-wider"
                          >
                            {line.replace(/\*/g, "").trim()}
                          </h5>
                        );
                      if (line.startsWith("•"))
                        return (
                          <li key={i} className="ml-5 list-disc mb-2">
                            {line.replace("•", "").trim()}
                          </li>
                        );
                      if (line.includes("---"))
                        return <hr key={i} className="my-6 border-slate-200" />;
                      if (!line.trim()) return <br key={i} />;
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={i} className="mb-2">
                          {parts.map((part, j) =>
                            part.startsWith("**") ? (
                              <strong key={j} className="text-slate-800">
                                {part.replace(/\*/g, "")}
                              </strong>
                            ) : (
                              part
                            ),
                          )}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="grid sm:grid-cols-2 gap-6 mb-4">
            <ActionBox
              title="Action Required"
              danger
              items={actionItems}
              onRedirect={handleRedirect}
            />

            <ActionBox title="What You're Doing Right" items={successItems} />
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pb-8 px-6">
        <Link
          href="/dashboard"
          target="_blank"
          className="flex-1 max-w-[240px]"
        >
          <button
            className="w-full h-full py-3.5 rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
            style={{ background: "var(--lemon-glow)", color: "#000" }}
          >
            Improve Rank ↗
          </button>
        </Link>

        <button
          onClick={handleDownloadPDF}
          className="flex-1 max-w-[240px] py-3.5 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase transition-all border-2 border-slate-200 hover:border-slate-300 text-slate-700 bg-white flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Save PDF
        </button>

        <button
          onClick={handleShare}
          className="flex-1 max-w-[240px] py-3.5 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase transition-all bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Link
        </button>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fadeIn"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3
                className="font-bold uppercase tracking-wider text-sm"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Business Categories
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-black transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${i === 0 ? "bg-black text-white border-black" : "bg-white text-slate-600 border-slate-200"}`}
                  >
                    {cat}{" "}
                    {i === 0 && (
                      <span className="opacity-50 ml-1 text-[10px] font-medium">
                        (Primary)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fadeIn"
          onClick={() => setShowServiceModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3
                className="font-bold uppercase tracking-wider text-sm"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Service Inventory
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-black transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {services.map((service, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-white text-slate-600 border-slate-200"
                  >
                    {typeof service === "string"
                      ? service
                      : service.displayName || service}
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

/* Score Breakdown Item */
const ScoreItem = ({ factor, score, outOf, details, dataSnapshot }) => {
  const percentage = outOf > 0 ? Math.round((score / outOf) * 100) : 0;
  const circumference = 2 * Math.PI * 28; // 2 * pi * r
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = (percentage) => {
    if (percentage >= 90) return "#22c55e"; // green
    if (percentage >= 60) return "#fb923c"; // orange
    return "#ef4444"; // red
  };

  const strokeColor = getStrokeColor(percentage);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col text-center transition-all hover:shadow-lg hover:scale-105 h-full">
      <div className="flex-grow">
        <div className="relative w-20 h-20 mb-3 mx-auto">
          <svg className="w-full h-full" viewBox="0 0 60 60">
            <circle
              className="text-gray-200"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="28"
              cx="30"
              cy="30"
            />
            <circle
              className="transform -rotate-90 origin-center"
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
            className="absolute inset-0 flex items-center justify-center text-lg font-bold"
            style={{ color: strokeColor }}
          >
            {percentage}%
          </span>
        </div>
        <h4 className="font-bold text-gray-800 text-sm leading-tight">
          {factor}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {score}/{outOf} pts
        </p>
      </div>

      {details && details.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 w-full space-y-3 text-left">
          {details.map((detail, index) => (
            <div key={index} className="text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">{detail.item}</span>
                <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  {detail.score}/{detail.outOf}
                </span>
              </div>
              <div className="text-right text-gray-500 text-[11px] mt-0.5">
                {detail.item === "Post Consistency (30 Days)" &&
                  `(${detail.postsLast30Days} in 30d / ${dataSnapshot.totalPosts} total)`}
                {detail.item === "Photos & Media" &&
                  `(${detail.mediaLast90Days} in 90d / ${detail.totalMedia} total)`}
                {detail.item === "Services Coverage" &&
                  `(${detail.totalServices} services listed)`}
                {detail.item === "Additional Categories" &&
                  `(${detail.totalAdditionalCategories} categories)`}
                {detail.item === "Total Reviews" &&
                  `(${detail.total} total reviews)`}
                {detail.item === "Reply Rate" &&
                  `(${detail.replyRate}% reply rate)`}
                {detail.item === "Business Description" &&
                  `(${detail.length} characters)`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Speedometer Component */
function Speedometer({ score }) {
  const radius = 140;
  const strokeWidth = 24;
  const center = 160;

  // Helper to calculate coordinates
  const getCoords = (angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  };

  // Angles (0 score = 180 deg, 100 score = 360 deg)
  // Red: 0-60 score -> 180 to 288 deg
  // Orange: 60-80 score -> 288 to 324 deg
  // Green: 80-100 score -> 324 to 360 deg

  const start = getCoords(180);
  const endRed = getCoords(288);
  const endOrange = getCoords(324);
  const endGreen = getCoords(360);

  // Needle
  const needleAngle = 180 + (score / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 20;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  // Labels
  const labels = [0, 25, 50, 75, 100];

  return (
    <svg width="320" height="200" viewBox="0 0 320 200" className="mx-auto">
      {/* Red section (0-60) */}
      <path
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${endRed.x} ${endRed.y}`}
        fill="none"
        stroke="#ef4444"
        strokeWidth={strokeWidth}
      />

      {/* Orange section (60-80) */}
      <path
        d={`M ${endRed.x} ${endRed.y} A ${radius} ${radius} 0 0 1 ${endOrange.x} ${endOrange.y}`}
        fill="none"
        stroke="#fb923c"
        strokeWidth={strokeWidth}
      />

      {/* Green section (80-100) */}
      <path
        d={`M ${endOrange.x} ${endOrange.y} A ${radius} ${radius} 0 0 1 ${endGreen.x} ${endGreen.y}`}
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
      />

      {/* Labels */}
      {labels.map((val) => {
        const a = 180 + (val / 100) * 180;
        // Adjust text position slightly inward
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
            className="text-xs font-bold"
            fill="#6b7280"
            style={{ fontSize: "12px" }}
          >
            {val}
          </text>
        );
      })}

      {/* Center circle (decorative, darker) */}
      <circle cx={center} cy={center} r="45" fill="#1f2937" />

      {/* Needle */}
      <line
        x1={center}
        y1={center}
        x2={needleX}
        y2={needleY}
        stroke="#1f2937"
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-all duration-2000 ease-out"
      />

      {/* Center dot */}
      <circle cx={center} cy={center} r="6" fill="#ef4444" />
    </svg>
  );
}

/* Stat Card */
function StatCard({ icon, title, value, color }) {
  return (
    <div
      className="group p-5 rounded-2xl border border-slate-100 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden bg-white"
      style={{
        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)",
      }}
    >
      {/* Decorative background circle */}
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-500"
        style={{ backgroundColor: color }}
      />

      <div
        className="inline-flex p-2.5 rounded-xl mb-3 transition-colors duration-300"
        style={{
          backgroundColor: `${color}10`,
          color: color,
        }}
      >
        {icon}
      </div>

      <div className="text-2xl font-black text-slate-900 leading-none">
        {value}
      </div>

      <div className="text-[10px] mt-1.5 font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
        {title}
      </div>
    </div>
  );
}

/* Action Box */
function ActionBox({ title, items, danger, onRedirect }) {
  const bgStyle = danger
    ? {
        background: "linear-gradient(to bottom right, #fef2f2, #fff7ed)",
        borderColor: "#fecaca",
      }
    : {
        background: "linear-gradient(to bottom right, #f0fdf4, #ecfdf5)",
        borderColor: "#bbf7d0",
      };

  const titleColor = danger ? "#b91c1c" : "#15803d";

  return (
    <div className="rounded-xl p-5 border-2" style={bgStyle}>
      <h4
        className="font-bold mb-4 text-lg flex items-center gap-2"
        style={{ color: titleColor }}
      >
        {danger ? "❌" : "✓"} {title}
      </h4>
      <ul className="space-y-3 text-sm">
        {items.filter(Boolean).map((item, i) => {
          const isObj = typeof item === "object";
          const text = isObj ? item.text : item;
          const subtext = isObj ? item.subtext : null;
          const severity = isObj ? item.severity : null;
          const signalKey = isObj ? item.signalKey : null;

          let severityBadge = null;
          if (danger && severity) {
            const badgeColors = {
              high: "bg-red-100 text-red-700 border-red-200",
              medium: "bg-orange-100 text-orange-700 border-orange-200",
              low: "bg-yellow-100 text-yellow-700 border-yellow-200",
            };
            severityBadge = (
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColors[severity.toLowerCase()] || badgeColors.low}`}
              >
                {severity}
              </span>
            );
          }

          return (
            <li
              key={i}
              className={`flex gap-3 items-start ${danger && signalKey ? "cursor-pointer hover:bg-red-100 p-1.5 -mx-1.5 rounded-lg transition-colors group" : ""}`}
              onClick={() => {
                if (danger && signalKey && onRedirect) onRedirect(signalKey);
              }}
            >
              <div className="mt-0.5">
                {danger ? (
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#dc2626" }}
                  />
                ) : (
                  <CheckCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#16a34a" }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {text}
                    {danger && signalKey && (
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </span>
                  {severityBadge}
                </div>
                {subtext && (
                  <span className="text-xs text-slate-500 font-medium">
                    {subtext}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {danger && (
        <p className="text-[11px] mt-4 font-bold flex items-center gap-2 text-red-600/70 italic uppercase tracking-wider">
          <TrendingDown className="w-3.5 h-3.5" />
          Fixing these can significantly improve your local ranking.
        </p>
      )}
    </div>
  );
}
