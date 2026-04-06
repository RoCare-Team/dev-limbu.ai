export default function ConnectModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000); // Auto-close after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 sm:p-10 relative transform transition-all animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-lightPrimary mb-6">
          <Rocket className="h-8 w-8 text-dark" />
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-3">
            Connect Your Business
            <span className="block text-lg sm:text-xl text-lightPrimary font-medium mt-1">
              — Hassle-Free & Instantly
            </span>
          </h2>
          <p className="text-gray-600 mb-8 text-sm sm:text-base max-w-sm mx-auto">
            Securely link your Google Business Profile with a single click to
            unlock powerful management tools.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-lightPrimary text-dark font-semibold px-8 py-4 rounded-xl hover:opacity-95 transition-opacity text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8C488 403.3 391.1 504 248 504C110.8 504 0 393.2 0 256S110.8 8 248 8c66.9 0 122.4 24.5 165.2 64.9l-66.8 64.9C318.6 109.9 285.1 96 248 96C150.6 96 72 174.6 72 272s78.6 176 176 176c90.1 0 148.4-51.8 160.3-124.6H248v-99.6h240C487.3 232.8 488 247.5 488 261.8z" />
            </svg>
            Connect Now with Bussiness
          </button>
        </div>
      </div>
    </div>
  );
}
