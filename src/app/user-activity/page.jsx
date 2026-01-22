"use client";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserActivityShowing() {
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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

  const renderStatus = (enabled) =>
    enabled ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
        <CheckCircle size={14} /> Done
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
        <XCircle size={14} /> Pending or not enabled in your plan
      </span>
    );

  /* -------------------------------
     SHOW ONLY USER-TOUCHED DATA
  -------------------------------- */
  const isValidItem = (item) => {
    if (!item) return false;

    const touched =
      item.enabled === true || (item.enabled === false && item._touched);

    const hasActivity =
      item.done > 0 ||
      item.target > 0 ||
      item.notes ||
      item.link ||
      item.count;

    return touched || hasActivity;
  };

  /* -------------------------------
     STATS (ONLY SHOWN ITEMS)
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* HEADER WITH BACK BUTTON */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold text-gray-800">
              Daily Activity Report
            </h1>
          </div>

          {/* Date Picker */}
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-3">
            <Calendar size={18} className="text-gray-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="outline-none text-gray-700 bg-transparent text-sm font-medium"
            />
          </div>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Data */}
        {!loading && !data && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 italic">
              No activity found for {date}.
            </p>
          </div>
        )}

        {data && (() => {
          const stats = getStats();

          return (
            <>
              {/* STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <Stat title="Total Target" value={stats.totalTarget} />
                <Stat title="Posts Done" value={stats.totalDone} green />
                <Stat title="Completed" value={stats.completed} blue />
              </div>

              {/* TABLE */}
              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-b">
                        <th className="py-4 px-6 font-semibold">Activity</th>
                        <th className="py-4 px-6 font-semibold text-center">
                          Status
                        </th>
                        <th className="py-4 px-6 font-semibold text-center">
                          Progress / Count
                        </th>
                        <th className="py-4 px-6 font-semibold">
                          Details & Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 text-sm">
                      {/* Social Posts */}
                      {["gmb", "facebook", "instagram"]
                        .map((key) => data.activities[key])
                        .filter(isValidItem)
                        .map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-3 px-6 font-medium text-gray-800">
                              {item.label}
                            </td>
                            <td className="py-3 px-6 text-center">
                              {renderStatus(item.enabled)}
                            </td>
                            <td className="py-3 px-6 text-center text-gray-600">
                              {item.target
                                ? `${item.done} / ${item.target}`
                                : "-"}
                            </td>
                            <td className="py-3 px-6">
                              {item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <Link2 size={14} /> View Post
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

                      {/* SEO / Maintenance */}
                      {["citations", "services", "category"]
                        .map((key) => data.activities[key])
                        .filter(isValidItem)
                        .map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-3 px-6 font-medium text-gray-800">
                              {item.label}
                            </td>
                            <td className="py-3 px-6 text-center">
                              {renderStatus(item.enabled)}
                            </td>
                            <td className="py-3 px-6 text-center text-gray-600">
                              {item.count || "-"}
                            </td>
                            <td className="py-3 px-6 text-gray-600">
                              {item.notes || (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}

                      {/* Custom Fields */}
                      {data.customFields
                        ?.filter((f) => f.value)
                        .map((f, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-3 px-6 font-medium text-gray-800">
                              {f.label}
                            </td>
                            <td className="py-3 px-6 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                <CheckCircle size={14} /> Completed
                              </span>
                            </td>
                            <td className="py-3 px-6 text-center">-</td>
                            <td className="py-3 px-6 text-gray-600">
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

/* ---------------- SMALL STAT CARD ---------------- */
const Stat = ({ title, value, green, blue }) => {
  let color = "text-gray-800 bg-white";
  if (green) color = "text-green-700 bg-green-50";
  if (blue) color = "text-blue-700 bg-blue-50";

  return (
    <div className={`p-4 rounded-xl shadow border ${color}`}>
      <p className="text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
};
