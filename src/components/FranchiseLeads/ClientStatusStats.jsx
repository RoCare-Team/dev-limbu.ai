"use client";

import { AlertCircle, CalendarRange, CheckCircle2, Users } from "lucide-react";

import { CLIENT_STATUS_META } from "@/lib/clientExpiry";

const CARDS = [
  {
    status: "",
    label: "Total Clients",
    countKey: "total",
    hint: "Unique onboarded customers",
    icon: Users,
    active: "border-gray-900 bg-gray-900 text-white",
    idle: "text-gray-700",
  },
  {
    status: "active",
    label: "Active",
    countKey: "active",
    hint: "More than 7 days left",
    icon: CheckCircle2,
    active: "border-emerald-600 bg-emerald-600 text-white",
    idle: "text-emerald-600",
  },
  {
    status: "expiring",
    label: "Expiring in 7 Days",
    countKey: "expiring",
    hint: "Renew these first",
    icon: CalendarRange,
    active: "border-amber-500 bg-amber-500 text-white",
    idle: "text-amber-600",
  },
  {
    status: "expired",
    label: "Expired",
    countKey: "expired",
    hint: "Package already lapsed",
    icon: AlertCircle,
    active: "border-red-600 bg-red-600 text-white",
    idle: "text-red-600",
  },
];

/**
 * Subscription health for onboarded clients. Cards double as filters —
 * `activeStatus` is "" for "show everything".
 */
export default function ClientStatusStats({
  clients = [],
  stats,
  activeStatus = "",
  onSelectStatus,
}) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-950">
            Onboard Client Status
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Based on each client&apos;s latest package expiry. Click a card to
          filter.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = activeStatus === card.status;

          return (
            <button
              key={card.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectStatus?.(card.status)}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? `${card.active} shadow-md`
                  : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    isActive ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {card.label}
                </p>
                <Icon
                  size={18}
                  className={isActive ? "text-white/90" : card.idle}
                />
              </div>
              <p
                className={`mt-1.5 text-2xl font-bold tabular-nums ${
                  isActive ? "text-white" : "text-gray-950"
                }`}
              >
                {stats?.[card.countKey] ?? 0}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  isActive ? "text-white/70" : "text-gray-500"
                }`}
              >
                {card.hint}
              </p>
            </button>
          );
        })}
      </div>

      {stats?.unknown > 0 && (
        <button
          type="button"
          onClick={() => onSelectStatus?.("unknown")}
          className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            activeStatus === "unknown"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
          }`}
        >
          {stats.unknown} client{stats.unknown === 1 ? "" : "s"} without an
          expiry date
        </button>
      )}

      {(stats?.expiring > 0 || stats?.expired > 0) && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            Needs attention
          </p>
          <div className="flex flex-wrap gap-2">
            {clients
              .filter(
                (client) =>
                  client.status === "expiring" || client.status === "expired",
              )
              .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
              .slice(0, 12)
              .map((client) => (
                <span
                  key={client.key}
                  title={`${client.plan || "Package"} · ${client.email}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    CLIENT_STATUS_META[client.status].chip
                  }`}
                >
                  {client.name}
                  <span className="opacity-70">
                    {client.days < 0
                      ? `${Math.abs(client.days)}d ago`
                      : client.days === 0
                        ? "today"
                        : `${client.days}d`}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
