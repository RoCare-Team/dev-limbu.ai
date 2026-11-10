/** Strip for the in-house Pinterest account: how many city boards are mapped, and an edit button. */
export default function InhousePinterestBanner({ mappingCount, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-red-700">Inhouse Pinterest</p>
        <p className="truncate text-xs font-semibold text-red-500/80">
          {mappingCount} city board mapping(s) saved
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-xl bg-[#E60023] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#c5001f]"
      >
        Edit Mapping
      </button>
    </div>
  );
}
