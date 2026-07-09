"use client";
import React, { useRef, useState } from "react";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Bulk-import keywords from an Excel (.xlsx/.xls) or CSV file.
 * Expected columns (header row, case-insensitive): keyword (required), volume, competition
 */
export default function KeywordImport({ importKeywords, isImporting }) {
  const inputRef = useRef(null);
  const [parsing, setParsing] = useState(false);

  const pickKey = (row, names) => {
    const keys = Object.keys(row);
    for (const name of names) {
      const found = keys.find((k) => k.trim().toLowerCase() === name);
      if (found) return row[found];
    }
    return undefined;
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const rows = json
        .map((row) => ({
          keyword: (pickKey(row, ["keyword", "keywords", "search word", "term"]) ?? "").toString().trim(),
          volume: pickKey(row, ["volume", "popularity", "searches", "avg monthly searches"]),
          competition: pickKey(row, ["competition", "difficulty"]),
        }))
        .filter((r) => r.keyword);

      if (rows.length === 0) {
        toast.error("File mein 'keyword' column nahi mila ya khaali hai");
        return;
      }

      await importKeywords(rows);
    } catch (err) {
      console.error("Excel parse error:", err);
      toast.error("File padh nahi paaye. .xlsx / .csv try karein.");
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const busy = parsing || isImporting;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border-2 border-black/10 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-lemon-glow/10 rounded-xl border border-lemon-glow/20">
            <FileSpreadsheet className="w-4 h-4 text-lemon-hover" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Import from Excel
            </h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              Columns: keyword · volume · competition
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="hidden"
          disabled={busy}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-lemon shrink-0 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {parsing ? "Reading..." : isImporting ? "Importing..." : "Upload File"}
        </button>
      </div>
    </div>
  );
}
