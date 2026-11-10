/** Centered eyebrow + title + text used by every section on /website-development. */
export default function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">{eyebrow}</span>
      <h2
        className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h2>
      {text && <p className="mt-3 text-base font-medium text-slate-500">{text}</p>}
    </div>
  );
}
