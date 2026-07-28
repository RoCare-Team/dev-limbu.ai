"use client";

import { CheckCircle, Clock, Rocket, UserCheck, UserX, Users } from "lucide-react";

/**
 * Stage cards double as filter tabs — clicking one narrows the table to that
 * stage. `stage: null` is the "show everything" card.
 */
const STAGE_CARDS = [
  {
    stage: "",
    label: "Total Leads",
    statKey: "totalUsers",
    icon: Users,
    idle: "text-gray-900",
    active: "border-gray-900 bg-gray-900 text-white",
  },
  {
    stage: "Active",
    label: "Active",
    statKey: "activeUsers",
    icon: CheckCircle,
    idle: "text-blue-600",
    active: "border-blue-600 bg-blue-600 text-white",
  },
  {
    stage: "Follow Up",
    label: "Follow Up",
    statKey: "followUpUsers",
    icon: Clock,
    idle: "text-amber-600",
    active: "border-amber-500 bg-amber-500 text-white",
  },
  {
    stage: "Inactive",
    label: "Inactive",
    statKey: "inactiveUsers",
    icon: UserX,
    idle: "text-gray-500",
    active: "border-gray-500 bg-gray-500 text-white",
  },
  {
    stage: "Onboard",
    label: "Onboarded",
    statKey: "onboardUsers",
    icon: Rocket,
    idle: "text-emerald-600",
    active: "border-emerald-600 bg-emerald-600 text-white",
  },
];

export default function DashboardStats({
  users = [],
  stats: statsProp,
  activeStage = "",
  onSelectStage,
  todayActive = false,
  onSelectToday,
}) {
  const today = new Date().toDateString();

  const fallback = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.leadStage === "Active").length,
    followUpUsers: users.filter((u) => u.leadStage === "Follow Up").length,
    inactiveUsers: users.filter((u) => u.leadStage === "Inactive").length,
    onboardUsers: users.filter((u) => u.leadStage === "Onboard").length,
    usersToday: users.filter(
      (u) => new Date(u.createdAt).toDateString() === today,
    ).length,
  };

  const valueOf = (key) => statsProp?.[key] ?? fallback[key] ?? 0;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STAGE_CARDS.map((card) => {
        const Icon = card.icon;
        const isActive = activeStage === card.stage;

        return (
          <button
            key={card.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectStage?.(card.stage)}
            className={`group rounded-xl border p-3.5 text-left shadow-sm transition ${
              isActive
                ? `${card.active} shadow-md`
                : "border-gray-200 bg-white hover:border-gray-400 hover:shadow"
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
                isActive ? "text-white" : "text-gray-900"
              }`}
            >
              {valueOf(card.statKey)}
            </p>
          </button>
        );
      })}

      <button
        type="button"
        aria-pressed={todayActive}
        onClick={() => onSelectToday?.()}
        className={`rounded-xl border p-3.5 text-left shadow-sm transition ${
          todayActive
            ? "border-violet-600 bg-violet-600 text-white shadow-md"
            : "border-gray-200 bg-white hover:border-gray-400 hover:shadow"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-[11px] font-bold uppercase tracking-wide ${
              todayActive ? "text-white/80" : "text-gray-500"
            }`}
          >
            Joined Today
          </p>
          <UserCheck
            size={18}
            className={todayActive ? "text-white/90" : "text-violet-600"}
          />
        </div>
        <p
          className={`mt-1.5 text-2xl font-bold tabular-nums ${
            todayActive ? "text-white" : "text-gray-900"
          }`}
        >
          {valueOf("usersToday")}
        </p>
      </button>
    </div>
  );
}
