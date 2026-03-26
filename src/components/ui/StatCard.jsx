function StatCard({ label, value, accent }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className={`text-sm font-bold ${accent || "text-gray-800"}`}>{value || "—"}</span>
    </div>
  );
}

export default StatCard;

