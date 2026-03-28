"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

const TABS = [
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
  { id: "location", label: "Location" },
  { id: "hours", label: "Hours" },
  { id: "more", label: "More" },
  { id: "optimization", label: "Optimization" },
];

function ModalToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        height: 28,
        width: 56,
        alignItems: "center",
        borderRadius: 14,
        border: "none",
        outline: "none",
        background: checked ? "#4285f4" : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .25s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 4,
          left: checked ? 30 : 4,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
          transition: "left .2s cubic-bezier(.4,0,.2,1)",
          display: "block",
        }}
      />
    </button>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#202124" }}>{children}</span>
      {action}
    </div>
  );
}

/**
 * layout="modal" — overlay dialog (open / onClose).
 * layout="embedded" — full page block; use onBack for header; manageLocations=false hides GMB toggles (Settings owns locations).
 */
export default function BusinessInformationModal({
  layout = "modal",
  open = true,
  onClose,
  onBack,
  manageLocations = true,
  savePending = false,
  platformGmb,
  setPlatformGmb,
  selectedLocations,
  setSelectedLocations,
  gmbLocations,
  selectedBusiness,
  userData,
  automationKeywords = [],
  profileDescription,
  onConfirmProfileDescription,
}) {
  const [tab, setTab] = useState("about");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (layout === "modal" && !open) return;
    setDescriptionDraft(profileDescription || "");
    setAiError("");
    if (layout === "modal") setTab("about");
  }, [layout, open, profileDescription]);

  const primaryLoc = useMemo(() => {
    if (selectedLocations?.length) return selectedLocations[0];
    if (gmbLocations?.length) return gmbLocations[0];
    return null;
  }, [selectedLocations, gmbLocations]);

  const businessName = useMemo(() => {
    return (
      selectedBusiness?.title ||
      selectedBusiness?.name ||
      primaryLoc?.name ||
      primaryLoc?.title ||
      "Your business"
    );
  }, [selectedBusiness, primaryLoc]);

  const categoryHint = useMemo(() => {
    const t = userData?.topic || "";
    if (!t) return [];
    return t.split(/[,;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  }, [userData?.topic]);

  const buildAiPayload = useCallback(() => {
    const loc = primaryLoc || {};
    return {
      businessName,
      address: loc.address || selectedBusiness?.address || "",
      locality: loc.locality || selectedBusiness?.locality || "",
      website: loc.websiteUrl || selectedBusiness?.websiteUrl || userData?.website || "",
      phone: userData?.phone || userData?.mobile || "",
      categories:
        categoryHint.length > 0
          ? categoryHint
          : Array.isArray(automationKeywords) && automationKeywords.length
            ? automationKeywords.slice(0, 8).map(String)
            : selectedKeywordsToCategories(userData),
      existingDescription: descriptionDraft || "",
    };
  }, [businessName, primaryLoc, selectedBusiness, userData, categoryHint, descriptionDraft, automationKeywords]);

  const runAiGenerate = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-business-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAiPayload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (data.description) setDescriptionDraft(data.description);
    } catch (e) {
      setAiError(e.message || "Could not generate");
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirmProfileDescription?.(descriptionDraft);
    if (layout === "modal") onClose?.();
  };

  const isEmbedded = layout === "embedded";

  if (layout === "modal" && !open) return null;

  const cardStyle = {
    width: "100%",
    maxWidth: 520,
    maxHeight: isEmbedded ? "none" : "min(640px, 92vh)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: isEmbedded ? "0 4px 24px rgba(0,0,0,.08)" : "0 8px 40px rgba(0,0,0,.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
    border: isEmbedded ? "1px solid #e8eaed" : "none",
  };

  const inner = (
    <div style={cardStyle} onMouseDown={(e) => layout === "modal" && e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={isEmbedded ? onBack : onClose}
            aria-label="Back"
            style={{ border: "none", background: "none", padding: 4, cursor: "pointer", color: "#5f6368", display: "flex" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 id="biz-info-title" style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#202124", flex: 1 }}>
            Business information
          </h2>
          {!isEmbedded && (
            <button type="button" aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", padding: 4, cursor: "pointer", color: "#5f6368" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, paddingLeft: 8, paddingRight: 8, borderBottom: "1px solid #e8eaed", overflowX: "auto", flexShrink: 0 }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  flex: "0 0 auto",
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#1a73e8" : "#5f6368",
                  background: "none",
                  border: "none",
                  borderBottom: active ? "2px solid #1a73e8" : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", minHeight: 0 }}>
          {tab === "about" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#202124", marginBottom: 16 }}>About your business</div>

              <div style={{ borderBottom: "1px solid #e8eaed", paddingBottom: 16, marginBottom: 16 }}>
                <SectionLabel>Business name</SectionLabel>
                <div style={{ fontSize: 14, color: "#5f6368", lineHeight: 1.5 }}>{businessName}</div>
              </div>

              <div style={{ borderBottom: "1px solid #e8eaed", paddingBottom: 16, marginBottom: 16 }}>
                <SectionLabel>Business category</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categoryHint.length > 0 ? (
                    categoryHint.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 16,
                          background: i === 0 ? "#e8eaed" : "#f1f3f4",
                          color: "#3c4043",
                          fontWeight: i === 0 ? 700 : 500,
                        }}
                      >
                        {c}
                        {i === 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10, textTransform: "uppercase", color: "#5f6368" }}>Primary</span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: "#80868b" }}>Add topics in your profile or keywords in automation.</span>
                  )}
                </div>
              </div>

              <div>
                <SectionLabel
                  action={
                    <button
                      type="button"
                      onClick={runAiGenerate}
                      disabled={aiLoading}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1a73e8",
                        background: "#e8f0fe",
                        border: "1px solid #aecbfa",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: aiLoading ? "wait" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {aiLoading ? "Generating…" : "AI generate"}
                    </button>
                  }
                >
                  Description
                </SectionLabel>
                {aiError && (
                  <div style={{ fontSize: 12, color: "#c5221f", marginBottom: 8 }}>{aiError}</div>
                )}
                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Describe your business for customers on Google…"
                  rows={10}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "#3c4043",
                    border: "1px solid #dadce0",
                    borderRadius: 8,
                    padding: 12,
                    resize: "vertical",
                    minHeight: 160,
                    fontFamily: "inherit",
                  }}
                />
                <p style={{ fontSize: 11, color: "#80868b", marginTop: 8, marginBottom: 0 }}>
                  {isEmbedded
                    ? "Uses your business name, location, and categories. Tap Save description below to store this text on your plan."
                    : "Uses your business name, location, and categories. Edit the text, then tap Confirm below to save with your automation settings."}
                </p>
              </div>
            </div>
          )}

          {tab === "contact" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#202124", marginBottom: 16 }}>Contact information</div>
              <div style={{ borderBottom: "1px solid #e8eaed", paddingBottom: 14, marginBottom: 14 }}>
                <SectionLabel>Phone number</SectionLabel>
                <div style={{ fontSize: 14, color: "#5f6368" }}>{userData?.phone || userData?.mobile || "—"}</div>
              </div>
              <div style={{ borderBottom: "1px solid #e8eaed", paddingBottom: 14, marginBottom: 14 }}>
                <SectionLabel>Website</SectionLabel>
                <div style={{ fontSize: 14, color: "#1a73e8", wordBreak: "break-all" }}>
                  {primaryLoc?.websiteUrl || selectedBusiness?.websiteUrl || userData?.website || "—"}
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#80868b", lineHeight: 1.5 }}>
                Values come from your connected profile and first selected location. Update them in Google Business Profile to change live listings.
              </p>
            </div>
          )}

          {tab === "location" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#202124", marginBottom: 12 }}>
                {manageLocations ? "Google Business locations" : "Location and areas"}
              </div>
              {manageLocations ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      border: platformGmb ? "2px solid #1a73e8" : "1px solid #dadce0",
                      borderRadius: 10,
                      background: platformGmb ? "#e8f0fe" : "#fafafa",
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🗺</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1967d2" }}>Post to Google Business</div>
                      <div style={{ fontSize: 11, color: "#5f6368" }}>When enabled, automation can publish to the locations you select below.</div>
                    </div>
                    <ModalToggle checked={platformGmb} onChange={setPlatformGmb} />
                  </div>

                  {gmbLocations.length > 0 ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLocations(
                              gmbLocations.map((loc) => ({
                                locationId: loc.locationId || "",
                                accountId: loc.accountId || "",
                                name: loc.title || loc.name || "",
                                address: loc.address || "",
                                locality: loc.locality || "",
                                websiteUrl: loc.websiteUrl || "",
                                isVerified: loc.isVerified || false,
                              }))
                            )
                          }
                          style={{ fontSize: 11, fontWeight: 600, color: "#1967d2", background: "#e8f0fe", border: "1px solid #aecbfa", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLocations([])}
                          style={{ fontSize: 11, fontWeight: 600, color: "#5f6368", background: "#fff", border: "1px solid #dadce0", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          None
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {gmbLocations.map((loc, i) => {
                          const locId = loc.locationId || "";
                          const isChecked = selectedLocations.some((l) => l.locationId === locId);
                          const toggle = () => {
                            if (isChecked) {
                              setSelectedLocations((prev) => prev.filter((l) => l.locationId !== locId));
                            } else {
                              setSelectedLocations((prev) => [
                                ...prev,
                                {
                                  locationId: locId,
                                  accountId: loc.accountId || "",
                                  name: loc.title || loc.name || "",
                                  address: loc.address || "",
                                  locality: loc.locality || "",
                                  websiteUrl: loc.websiteUrl || "",
                                  isVerified: loc.isVerified || false,
                                },
                              ]);
                            }
                          };
                          return (
                            <div
                              key={i}
                              role="button"
                              tabIndex={0}
                              onClick={toggle}
                              onKeyDown={(e) => e.key === "Enter" && toggle()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                border: isChecked ? "2px solid #1a73e8" : "1px solid #dadce0",
                                borderRadius: 10,
                                cursor: "pointer",
                                background: isChecked ? "#e8f0fe" : "#fff",
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  border: isChecked ? "2px solid #1a73e8" : "2px solid #dadce0",
                                  background: isChecked ? "#1a73e8" : "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isChecked && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>{loc.title || loc.name || "Location"}</div>
                                <div style={{ fontSize: 12, color: "#5f6368" }}>{[loc.address, loc.locality].filter(Boolean).join(", ") || locId}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "#fef7e0", border: "1px solid #fdd663", borderRadius: 10, padding: 14, fontSize: 13, color: "#663c00" }}>
                      No locations loaded. Connect Google Business from the dashboard and reload this page.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "#5f6368", marginBottom: 14, lineHeight: 1.55 }}>
                    To change which locations receive posts, open <strong>Settings</strong>, turn on Google Business, and select locations under the toggle.
                  </p>
                  {selectedLocations && selectedLocations.length > 0 ? (
                    selectedLocations.map((loc, i) => (
                      <div key={i} style={{ padding: "12px 14px", border: "1px solid #dadce0", borderRadius: 10, marginBottom: 8, background: "#fafafa" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#202124" }}>{loc.name || "Location"}</div>
                        <div style={{ fontSize: 12, color: "#5f6368", marginTop: 4 }}>{[loc.address, loc.locality].filter(Boolean).join(", ") || loc.locationId}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ background: "#fef7e0", border: "1px solid #fdd663", borderRadius: 10, padding: 14, fontSize: 13, color: "#663c00" }}>
                      No locations saved for automation yet. Configure them in Settings.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "hours" && (
            <div>
              <p style={{ fontSize: 14, color: "#3c4043", lineHeight: 1.6 }}>
                Opening hours and special hours are managed in Google Business Profile. This app does not edit hours directly.
              </p>
            </div>
          )}

          {tab === "more" && (
            <div>
              <p style={{ fontSize: 14, color: "#3c4043", lineHeight: 1.6 }}>
                Additional attributes (services, accessibility, etc.) can be updated in the Google Business Profile manager.
              </p>
            </div>
          )}

          {tab === "optimization" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#202124", marginBottom: 12 }}>Optimization</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#3c4043", lineHeight: 1.7 }}>
                {isEmbedded ? (
                  <>
                    <li>Use <strong>About → AI generate</strong> to draft a Google-style description, edit it, then <strong>Save description</strong>.</li>
                    <li>Posting locations and the Google toggle live on the <strong>Settings</strong> page (under the Google Business switch).</li>
                  </>
                ) : (
                  <>
                    <li>Turn on Google posting and select locations in the <strong>Location</strong> tab.</li>
                    <li>Use <strong>About → AI generate</strong> to draft a description from your business details, then edit and confirm.</li>
                    <li>Save automation on the main settings page to persist your description and locations.</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid #e8eaed",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#fff",
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: 12, color: "#3c4043", flex: 1, lineHeight: 1.45 }}>
            {isEmbedded
              ? "Review your description, then save. Locations are edited in Settings → Google Business."
              : "Review and edit your business information to improve your presence on Google. Tap Confirm to apply the description and close."}
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={savePending || aiLoading}
            style={{
              flexShrink: 0,
              background: savePending || aiLoading ? "#dadce0" : "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: savePending || aiLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {savePending ? "Saving…" : isEmbedded ? "Save description" : "Confirm"}
          </button>
        </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
        {inner}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="biz-info-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(32,33,36,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {inner}
    </div>
  );
}

function selectedKeywordsToCategories(userData) {
  const kws = userData?.keywords;
  if (Array.isArray(kws) && kws.length) return kws.slice(0, 6).map(String);
  return [];
}
