import React from "react";
import { Sparkles, Wand2, X } from "lucide-react";

const FirstPostModal = ({ onClose, onCreate }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-purple-100">

        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-300 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl opacity-30 animate-pulse delay-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/60 hover:bg-white rounded-full transition z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="relative flex flex-col items-center text-center space-y-4 pt-4">

          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-spin-slow" />
            <div className="relative bg-white p-3 rounded-2xl shadow-xl border border-purple-100">
              <Wand2 className="w-10 h-10 text-dark animate-bounce" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-blue-400 animate-pulse delay-300" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900">
              Create Your First Magic Post ✨
            </h2>
            <p className="text-gray-600 font-medium">
              Follow these simple steps to generate your first AI-powered post.
            </p>
          </div>

          {/* STEPS TEXT ONLY */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200 rounded-2xl p-4 text-left space-y-2 text-sm text-gray-700 font-medium">
            <p>
              <span className="font-bold text-dark">Step 1:</span>{" "}
              Enter a Relevant Keyword.
            </p>

            {/* i10% */}

            <p>
              <span className="font-bold text-dark">Step 2:</span>{" "}
              Optionally add your business logo to make the post more branded.
            </p>

            <p>
              <span className="font-bold text-dark">Step 3:</span>{" "}
              Click <span className="font-semibold text-gray-900">Generate Post with Ai</span> and let AI generate a professional post for you.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              if (onCreate) onCreate();
              onClose();
            }}
            className="w-full py-3 bg-primary text-dark rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Create Magic Now
          </button>

        </div>
      </div>

      {/* Custom Animation */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FirstPostModal;
