function BackButton({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium group">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className="group-hover:-translate-x-0.5 transition-transform">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}

export default BackButton;

