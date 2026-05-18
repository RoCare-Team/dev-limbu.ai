"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Link2,
  ArrowLeft,
  Activity,
  Target,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserActivityShowing() {
  const router = useRouter();

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, [date]);

  const fetchActivity = async () => {
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const res = await fetch(
        `/api/admin/user-activity?userId=${userId}&date=${date}`
      );

      const result = await res.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------
      STATUS BADGE
  -------------------------------- */

  const renderStatus = (enabled) =>
    enabled ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={14} />
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        Pending
      </span>
    );

  /* --------------------------------
      VALID ITEM CHECK
  -------------------------------- */

  const isValidItem = (item) => {
    if (!item) return false;

    const touched =
      item.enabled === true ||
      (item.enabled === false && item._touched);

    const hasActivity =
      item.done > 0 ||
      item.target > 0 ||
      item.notes ||
      item.link ||
      item.count;

    return touched || hasActivity;
  };

  /* --------------------------------
      STATS
  -------------------------------- */

  const getStats = () => {
    if (!data) return null;

    const socialKeys = ["gmb", "facebook", "instagram"];

    let totalTarget = 0;
    let totalDone = 0;
    let completed = 0;

    socialKeys.forEach((key) => {
      const item = data.activities[key];

      if (!isValidItem(item)) return;

      if (item.target) {
        totalTarget += item.target;
        totalDone += item.done;
      }

      if (item.enabled) completed++;
    });

    return { totalTarget, totalDone, completed };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 rounded-3xl border border-yellow-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:scale-105 hover:bg-yellow-500 active:scale-95"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                Daily Activity Report
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Monitor all completed tasks and progress updates.
              </p>
            </div>
          </div>

          {/* DATE PICKER */}
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm">
            <Calendar size={18} className="text-yellow-700" />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
            />
          </div>
        </div>

        {/* LOADER */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-300 border-t-yellow-500"></div>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !data && (
          <div className="rounded-3xl border border-yellow-100 bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
              <Activity className="text-yellow-600" size={36} />
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-800">
              No Activity Found
            </h2>

            <p className="text-gray-500">
              There is no activity available for{" "}
              <span className="font-semibold">{date}</span>.
            </p>
          </div>
        )}

        {data && (() => {
          const stats = getStats();

          return (
            <>
              {/* STATS */}
              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Total Target"
                  value={stats.totalTarget}
                  icon={<Target size={24} />}
                />

                <StatCard
                  title="Posts Done"
                  value={stats.totalDone}
                  icon={<Activity size={24} />}
                />

                <StatCard
                  title="Completed"
                  value={stats.completed}
                  icon={<BadgeCheck size={24} />}
                />
              </div>

              {/* TABLE */}
              <div className="overflow-hidden rounded-3xl border border-yellow-100 bg-white shadow-xl">
                {/* TABLE HEADER */}
                <div className="border-b border-yellow-100 bg-gradient-to-r from-yellow-400 to-amber-400 px-6 py-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    Activity Details
                  </h2>

                  <p className="mt-1 text-sm text-gray-800">
                    Complete overview of all daily activities.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-yellow-50 text-xs uppercase tracking-wider text-gray-600">
                        <th className="px-6 py-4 text-left font-bold">
                          Activity
                        </th>

                        <th className="px-6 py-4 text-center font-bold">
                          Status
                        </th>

                        <th className="px-6 py-4 text-center font-bold">
                          Progress
                        </th>

                        <th className="px-6 py-4 text-left font-bold">
                          Notes / Details
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-yellow-50 text-sm">
                      {/* SOCIAL POSTS */}
                      {["gmb", "facebook", "instagram"]
                        .map((key) => data.activities[key])
                        .filter(isValidItem)
                        .map((item, i) => (
                          <tr
                            key={i}
                            className="transition-all hover:bg-yellow-50/60"
                          >
                            <td className="px-6 py-5">
                              <div className="font-semibold text-gray-800">
                                {item.label}
                              </div>
                            </td>

                            <td className="px-6 py-5 text-center">
                              {renderStatus(item.enabled)}
                            </td>

                            <td className="px-6 py-5 text-center">
                              <div className="font-semibold text-gray-700">
                                {item.target
                                  ? `${item.done} / ${item.target}`
                                  : "-"}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              {item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-100 px-3 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-200"
                                >
                                  <ExternalLink size={15} />
                                  View Post
                                </a>
                              ) : item.notes ? (
                                <span className="text-gray-600">
                                  {item.notes}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}

                      {/* SEO / MAINTENANCE */}
                      {["citations", "services", "category"]
                        .map((key) => data.activities[key])
                        .filter(isValidItem)
                        .map((item, i) => (
                          <tr
                            key={i}
                            className="transition-all hover:bg-yellow-50/60"
                          >
                            <td className="px-6 py-5 font-semibold text-gray-800">
                              {item.label}
                            </td>

                            <td className="px-6 py-5 text-center">
                              {renderStatus(item.enabled)}
                            </td>

                            <td className="px-6 py-5 text-center font-semibold text-gray-700">
                              {item.count || "-"}
                            </td>

                            <td className="px-6 py-5 text-gray-600">
                              {item.notes || (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}

                      {/* CUSTOM FIELDS */}
                      {data.customFields
                        ?.filter((f) => f.value)
                        .map((f, i) => (
                          <tr
                            key={i}
                            className="transition-all hover:bg-yellow-50/60"
                          >
                            <td className="px-6 py-5 font-semibold text-gray-800">
                              {f.label}
                            </td>

                            <td className="px-6 py-5 text-center">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                <CheckCircle2 size={14} />
                                Completed
                              </span>
                            </td>

                            <td className="px-6 py-5 text-center">-</td>

                            <td className="px-6 py-5 text-gray-600">
                              {f.value}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

/* --------------------------------
    STAT CARD
-------------------------------- */

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="group rounded-3xl border border-yellow-100 bg-white p-5 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            {value}
          </h2>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-gray-900 shadow-md transition-all group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
};