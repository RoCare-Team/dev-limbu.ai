"use client";

import {
  CheckCircle,
  Clock,
  ImageIcon,
  Rocket,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

export default function DashboardStats({ users = [], stats: statsProp }) {
  const today = new Date().toDateString();

  const totalUsers = statsProp?.totalUsers ?? users.length;
  const activeUsers =
    statsProp?.activeUsers ??
    users.filter((u) => u.leadStage === "Active").length;
  const followUpUsers =
    statsProp?.followUpUsers ??
    users.filter((u) => u.leadStage === "Follow Up").length;
  const inactiveUsers =
    statsProp?.inactiveUsers ??
    users.filter((u) => u.leadStage === "Inactive").length;
  const onboardUsers =
    statsProp?.onboardUsers ??
    users.filter((u) => u.leadStage === "Onboard").length;
  const usersToday =
    statsProp?.usersToday ??
    users.filter((u) => new Date(u.createdAt).toDateString() === today).length;
  const totalPosts =
    statsProp?.totalPosts ??
    users.reduce(
      (sum, user) => sum + (Array.isArray(user.posts) ? user.posts.length : 0),
      0,
    );

  const cards = [
    {
      label: "TOTAL USERS",
      value: totalUsers,
      icon: Users,
      color: "text-gray-950",
      bg: "bg-white",
    },
    {
      label: "ACTIVE USERS",
      value: activeUsers,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-white",
    },
    {
      label: "FOLLOW UP",
      value: followUpUsers,
      icon: Clock,
      color: "text-gray-950",
      bg: "bg-white",
    },
    {
      label: "INACTIVE",
      value: inactiveUsers,
      icon: UserX,
      color: "text-gray-950",
      bg: "bg-white",
    },
    {
      label: "ONBOARDED",
      value: onboardUsers,
      icon: Rocket,
      color: "text-gray-950",
      bg: "bg-white",
    },
    {
      label: "Total Posts",
      value: totalPosts,
      icon: ImageIcon,
      color: "text-gray-950",
      bg: "bg-white",
    },
    {
      label: "Users Today",
      value: usersToday,
      icon: UserCheck,
      color: "text-gray-950",
      bg: "bg-white",
    },
  ];

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={`${card.bg} rounded-lg border border-gray-300 p-3 shadow-sm`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold ${card.color}`}>
                  {card.label}
                </p>
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <Icon className={card.color} size={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
