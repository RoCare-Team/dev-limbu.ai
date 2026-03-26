function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${checked ? "bg-amber-400" : "bg-gray-200"}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? "translate-x-8" : "translate-x-1"}`} />
    </button>
  );
}

export default Toggle;

