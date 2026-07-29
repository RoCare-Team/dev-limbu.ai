"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import {
  canAccessBookings,
  getFranchiseAuthHeaders,
  getFranchiseUserFromStorage,
} from "@/lib/franchiseAuth";
import { LEAD_PLATFORMS, PLATFORM_KEYS } from "@/lib/franchiseLeadSources";
import { sourceBadgeClass, sourceLabel } from "@/lib/sourceBadge";

const STAGES = ["Active", "Follow Up", "Inactive", "Onboard"];
const TAGS = ["", "Hot", "Warm", "Cold"];

const formatDateTime = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const emptyForm = (platform = "meta") => ({
  platform,
  name: LEAD_PLATFORMS[platform]?.defaultName || "",
  credentials: {},
  defaultLeadStage: "Active",
  defaultLeadStatus: "",
  assignMode: "round-robin",
  fixedAgentId: "",
  isActive: true,
});

export default function FranchiseSettings() {
  const router = useRouter();
  const [sources, setSources] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [syncingId, setSyncingId] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    const user = getFranchiseUserFromStorage();
    if (!canAccessBookings(user?.role)) {
      router.replace("/franchise-panel/dashboard");
      return;
    }
    setAllowed(true);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sourceRes, teamRes] = await Promise.all([
        fetch("/api/franchise-panel/lead-sources", {
          headers: getFranchiseAuthHeaders(),
          cache: "no-store",
        }),
        fetch("/api/franchise-panel/team?status=active", {
          headers: getFranchiseAuthHeaders(),
        }),
      ]);

      const sourceJson = await sourceRes.json();
      setSources(sourceJson.success ? sourceJson.data || [] : []);

      const teamJson = await teamRes.json();
      setTeamMembers(teamJson.success ? teamJson.data || [] : []);
    } catch (error) {
      console.error("Settings load error:", error);
      toast.error("Could not load lead sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (source) => {
    setEditing(source);
    setForm({
      platform: source.platform,
      name: source.name,
      credentials: { ...(source.credentials || {}) },
      defaultLeadStage: source.defaultLeadStage || "Active",
      defaultLeadStatus: source.defaultLeadStatus || "",
      assignMode: source.assignMode || "round-robin",
      fixedAgentId: source.fixedAgentId || "",
      isActive: source.isActive,
    });
    setFormError("");
    setShowModal(true);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setCredential = (key, value) =>
    setForm((prev) => ({
      ...prev,
      credentials: { ...prev.credentials, [key]: value },
    }));

  const changePlatform = (platform) => {
    setForm((prev) => ({
      ...prev,
      platform,
      // Only replace the name while it is still the previous default.
      name:
        !prev.name || prev.name === LEAD_PLATFORMS[prev.platform]?.defaultName
          ? LEAD_PLATFORMS[platform]?.defaultName || ""
          : prev.name,
      credentials: {},
    }));
  };

  const handleSave = async () => {
    setFormError("");

    const platform = LEAD_PLATFORMS[form.platform];
    if (!form.name.trim()) {
      setFormError("Source name is required");
      return;
    }

    // Mandatory-field check mirrors the server so users see it immediately.
    const missing = (platform?.fields || [])
      .filter((field) => field.required)
      .filter((field) => {
        const value = String(form.credentials?.[field.key] || "").trim();
        if (editing && value.startsWith("••")) return false;
        return !value;
      });

    if (missing.length) {
      setFormError(`${missing[0].label} is required`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/franchise-panel/lead-sources", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...getFranchiseAuthHeaders(),
        },
        body: JSON.stringify(editing ? { id: editing._id, ...form } : form),
      });
      const json = await res.json();

      if (!json.success) {
        setFormError(json.message || "Could not save the source");
        return;
      }

      toast.success(editing ? "Source updated" : "Source connected");
      setShowModal(false);
      load();
    } catch (error) {
      console.error("Save source error:", error);
      setFormError("Could not save the source");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (source) => {
    const res = await fetch("/api/franchise-panel/lead-sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getFranchiseAuthHeaders() },
      body: JSON.stringify({ id: source._id, isActive: !source.isActive }),
    });
    const json = await res.json();

    if (json.success) {
      toast.success(source.isActive ? "Source paused" : "Source enabled");
      load();
    } else {
      toast.error(json.message || "Could not update the source");
    }
  };

  const handleSync = async (source) => {
    setSyncingId(source._id);
    try {
      const res = await fetch("/api/franchise-panel/lead-sources/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getFranchiseAuthHeaders(),
        },
        body: JSON.stringify({ id: source._id }),
      });
      const json = await res.json();

      if (json.success) toast.success(json.message);
      else toast.error(json.message || "Sync failed");

      load();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed");
    } finally {
      setSyncingId("");
    }
  };

  const handleDelete = async (source) => {
    if (
      !window.confirm(
        `Disconnect "${source.name}"? Leads already imported will stay in your list.`,
      )
    )
      return;

    const res = await fetch(
      `/api/franchise-panel/lead-sources?id=${source._id}`,
      { method: "DELETE", headers: getFranchiseAuthHeaders() },
    );
    const json = await res.json();

    if (json.success) {
      toast.success("Source disconnected");
      load();
    } else {
      toast.error(json.message || "Could not disconnect");
    }
  };

  const webhookUrl = (source) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://limbu.ai";
    return `${origin}/api/franchise-panel/lead-ingest?key=${source.ingestKey}`;
  };

  const copyWebhook = async (source) => {
    try {
      await navigator.clipboard.writeText(webhookUrl(source));
      setCopiedKey(source._id);
      setTimeout(() => setCopiedKey(""), 2000);
      toast.success("Webhook URL copied");
    } catch {
      toast.error("Could not copy — select the URL manually");
    }
  };

  if (!allowed) return null;

  return (
    <div className="p-2 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-950">
            <SettingsIcon size={22} className="text-gray-500" />
            Settings
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Connect Meta Ads and other platforms — their leads land in your Leads
            list automatically, tagged with the source name.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          <Plus size={16} />
          Connect Platform
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={26} />
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Plug className="mx-auto text-gray-400" size={32} />
          <h3 className="mt-3 text-lg font-bold text-gray-900">
            No lead source connected
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Connect Meta Ads, Google Ads, your website form or any other platform.
            Every lead that arrives is created in your Leads list, assigned to a
            team member, and tagged with the source name.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Plus size={16} />
            Connect your first platform
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => {
            const platform = LEAD_PLATFORMS[source.platform];

            return (
              <div
                key={source._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-950">
                        {source.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sourceBadgeClass(
                          source.name,
                        )}`}
                      >
                        {sourceLabel(source.name)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          source.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {source.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {platform?.label || source.platform}
                      {source.credentials?.formId
                        ? ` · ${source.credentials.formId}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {platform?.supportsSync && (
                      <button
                        type="button"
                        onClick={() => handleSync(source)}
                        disabled={syncingId === source._id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={14}
                          className={syncingId === source._id ? "animate-spin" : ""}
                        />
                        {syncingId === source._id ? "Syncing..." : "Sync Now"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleActive(source)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {source.isActive ? "Pause" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(source)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(source)}
                      className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                      title="Disconnect"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Leads Imported" value={source.totalLeads || 0} />
                  <Metric
                    label="Duplicates Skipped"
                    value={source.duplicateCount || 0}
                  />
                  <Metric label="Last Lead" value={formatDateTime(source.lastLeadAt)} small />
                  <Metric label="Last Sync" value={formatDateTime(source.lastSyncAt)} small />
                </div>

                {source.lastError && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {source.lastError}
                  </p>
                )}

                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-600">
                    <Link2 size={13} />
                    Webhook URL
                  </p>
                  <p className="mb-2 text-xs text-gray-500">
                    Paste this into {platform?.label || "the platform"} (or Zapier
                    / Make) to push leads here instantly.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-700">
                      {webhookUrl(source)}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyWebhook(source)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      {copiedKey === source._id ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SourceModal
          form={form}
          editing={editing}
          teamMembers={teamMembers}
          saving={saving}
          error={formError}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          setField={setField}
          setCredential={setCredential}
          changePlatform={changePlatform}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}

function Metric({ label, value, small }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 font-bold text-gray-950 ${
          small ? "text-sm" : "text-xl tabular-nums"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SourceModal({
  form,
  editing,
  teamMembers,
  saving,
  error,
  onClose,
  onSave,
  setField,
  setCredential,
  changePlatform,
}) {
  const platform = LEAD_PLATFORMS[form.platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              {editing ? "Edit Lead Source" : "Connect a Platform"}
            </h2>
            <p className="text-sm text-gray-500">
              Fields marked * are mandatory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Field label="Platform *">
            <select
              value={form.platform}
              disabled={!!editing}
              onChange={(e) => changePlatform(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            >
              {PLATFORM_KEYS.map((key) => (
                <option key={key} value={key}>
                  {LEAD_PLATFORMS[key].label}
                </option>
              ))}
            </select>
            {editing && (
              <p className="mt-1 text-xs text-gray-500">
                Platform cannot be changed — disconnect and add a new source
                instead.
              </p>
            )}
          </Field>

          <Field label="Source Name *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Meta Leads"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Every lead from here is tagged with this name in your Leads list.
            </p>
          </Field>

          {(platform?.fields || []).map((field) => (
            <Field
              key={field.key}
              label={`${field.label}${field.required ? " *" : ""}`}
            >
              <input
                type={field.secret && !editing ? "password" : "text"}
                value={form.credentials?.[field.key] || ""}
                onChange={(e) => setCredential(field.key, e.target.value)}
                placeholder={field.placeholder || ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-gray-900"
              />
              {field.help && (
                <p className="mt-1 text-xs text-gray-500">{field.help}</p>
              )}
              {editing && field.secret && (
                <p className="mt-1 text-xs text-gray-500">
                  Leave the masked value as-is to keep the stored token.
                </p>
              )}
            </Field>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Default Stage">
              <select
                value={form.defaultLeadStage}
                onChange={(e) => setField("defaultLeadStage", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default Tag">
              <select
                value={form.defaultLeadStatus}
                onChange={(e) => setField("defaultLeadStatus", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                {TAGS.map((tag) => (
                  <option key={tag || "none"} value={tag}>
                    {tag || "Untagged"}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Assign Incoming Leads">
            <select
              value={form.assignMode}
              onChange={(e) => setField("assignMode", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            >
              <option value="round-robin">
                Round robin (least loaded team member)
              </option>
              <option value="fixed">Always one team member</option>
              <option value="unassigned">Leave unassigned</option>
            </select>
          </Field>

          {form.assignMode === "fixed" && (
            <Field label="Team Member *">
              <select
                value={form.fixedAgentId || ""}
                onChange={(e) => setField("fixedAgentId", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                <option value="">Select a member</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving..." : editing ? "Save Changes" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
