import React from "react";
import { CheckCircle2, Info, XCircle, AlertTriangle } from "lucide-react";

const Toast = ({ message, type = "success" }) => {
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          border: "border-emerald-100",
        };
      case "info":
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          border: "border-blue-100",
        };
      case "error":
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          border: "border-red-100",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          border: "border-amber-100",
        };
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          border: "border-emerald-100",
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`fixed top-4 sm:top-8 right-4 left-4 sm:left-auto sm:right-8 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border ${config.border} shadow-lg z-200 animate-slide-in`}
    >
      {/* Icon */}
      <div className="shrink-0 flex items-center justify-center">
        {config.icon}
      </div>

      {/* Message */}
      <p className="text-sm sm:text-[15px] font-medium text-gray-800 leading-snug">
        {message}
      </p>
    </div>
  );
};

export default Toast;