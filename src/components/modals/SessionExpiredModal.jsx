export default function SessionExpiredModal({ isOpen, onLogin }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative animate-scaleUp">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <LogOut className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Session Expired
        </h2>
        <p className="text-gray-600 mb-6">
          Please sign in again to continue managing your business.
        </p>
        <button
          onClick={onLogin}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg"
        >
          Sign In Again
        </button>
      </div>
    </div>
  );
}
