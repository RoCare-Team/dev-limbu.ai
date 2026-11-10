/** Numbered "how it works" steps. */
export default function StepList({ steps }) {
  if (!steps?.length) return null;
  return (
    <ol className="mt-6 space-y-3">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#facc15] text-xs font-black text-black">
            {i + 1}
          </span>
          <span className="text-sm font-semibold leading-snug text-slate-700 sm:text-[15px]">{step}</span>
        </li>
      ))}
    </ol>
  );
}
