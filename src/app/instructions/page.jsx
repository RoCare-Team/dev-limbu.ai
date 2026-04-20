"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  readIncludedMap,
  writeIncludedMap,
  readExtraNotes,
  writeExtraNotes,
  readAppendToPrompt,
  writeAppendToPrompt,
  mergeIncludedMapForIds,
} from "@/lib/postManagementInstructionsStorage";

export default function InstructionsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [includedMap, setIncludedMap] = useState({});
  const [extraNotes, setExtraNotes] = useState("");
  const [appendToPrompt, setAppendToPrompt] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/instructions");
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Could not load instructions");
        return;
      }
      const items = data.instructions || [];
      setList(items);
      const ids = items.map((i) => i._id).filter(Boolean);
      const merged = mergeIncludedMapForIds(readIncludedMap(), ids);
      setIncludedMap(merged);
    } catch (e) {
      console.error(e);
      toast.error("Could not load instructions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setExtraNotes(readExtraNotes());
    setAppendToPrompt(readAppendToPrompt());
    load();
  }, [load]);

  const persistIncluded = (next) => {
    setIncludedMap(next);
    writeIncludedMap(next);
  };

  const toggleIncluded = (id) => {
    const currentlyOn = includedMap[id] !== false;
    persistIncluded({ ...includedMap, [id]: !currentlyOn });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      toast.error("Title and details are required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, description: b }),
      });
      const data = await res.json();
      if (data.success && data.instruction) {
        setTitle("");
        setBody("");
        const id = data.instruction._id;
        setList((prev) => [data.instruction, ...prev]);
        persistIncluded({ ...includedMap, [id]: true });
        toast.success("Instruction saved");
      } else {
        toast.error(data.error || "Could not save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this instruction?")) return;
    try {
      const res = await fetch("/api/instructions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setList((prev) => prev.filter((x) => x._id !== id));
        const next = { ...includedMap };
        delete next[id];
        persistIncluded(next);
        toast.success("Deleted");
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/post-management"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-label="Back to Post Management"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white shadow-md shadow-indigo-200">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Instructions
                </h1>
              </div>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Add rules and notes stored in your account. Use the checkboxes to choose
                which items are appended under &quot;Instructions:&quot; when you generate
                posts in Post Management. Extra note is saved only on this browser.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Plus className="h-4 w-4 text-indigo-600" />
              Add instruction
            </h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short label"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 focus:border-indigo-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Details
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Full instruction text…"
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500/20 focus:border-indigo-400 focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                Saved instructions ({list.length})
              </h2>
              <button
                type="button"
                onClick={load}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Refresh
              </button>
            </div>

            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <input
                type="checkbox"
                checked={appendToPrompt}
                onChange={(e) => {
                  const v = e.target.checked;
                  setAppendToPrompt(v);
                  writeAppendToPrompt(v);
                }}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">
                When generating in Post Management, append checked instructions (and extra
                note) to the prompt under &quot;Instructions:&quot;.
              </span>
            </label>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                No instructions yet. Add one above.
              </p>
            ) : (
              <ul className="space-y-3">
                {list.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4"
                  >
                    <input
                      type="checkbox"
                      checked={includedMap[item._id] !== false}
                      onChange={() => toggleIncluded(item._id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      title="Include in generate prompt"
                      aria-label={`Include "${item.title}" in prompt`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="shrink-0 self-start rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Extra note</h2>
            <p className="mb-3 text-xs text-slate-600">
              Optional text appended with your checked instructions. Stored only in this
              browser (not synced to the server).
            </p>
            <textarea
              value={extraNotes}
              onChange={(e) => {
                const v = e.target.value;
                setExtraNotes(v);
                writeExtraNotes(v);
              }}
              placeholder="e.g. One-off tweaks for this device only…"
              rows={3}
              className="w-full resize-y rounded-xl border border-amber-200/80 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </section>

          {/* <p className="text-center text-xs text-slate-500">
            <Link
              href="/post-management"
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              Open Post Management
            </Link>
            {" · "}
            API: <code className="rounded bg-slate-100 px-1">GET/POST /api/instructions</code>
          </p> */}
        </div>
      </div>
    </div>
  );
}
