"use client";

import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white/90 px-8 py-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Loading admin dashboard...</p>
      </div>
    </div>
  );
}
