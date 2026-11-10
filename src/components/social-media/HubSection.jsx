/** Titled block on the /social-media page. */
export default function HubSection({ title, text, children }) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
        {text && <p className="text-sm font-medium text-slate-500">{text}</p>}
      </div>
      {children}
    </section>
  );
}
