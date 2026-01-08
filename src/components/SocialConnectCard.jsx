import React from "react";
import {
  Facebook,
  Instagram,
  Building2,
  LogOut,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export default function SocialConnectCard({
  platform,
  isConnected,
  identity,
  onConnect,
  onDisconnect,
  onManage,
  loading = false,
}) {
  const config = {
    google: {
      icon: Building2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      ring: "ring-blue-100",
      btn: "bg-blue-600 hover:bg-blue-700",
      label: "Google Business",
      req: "Google login required",
    },
    facebook: {
      icon: Facebook,
      iconBg: "bg-blue-50",
      iconColor: "text-[#1877F2]",
      ring: "ring-blue-100",
      btn: "bg-[#1877F2] hover:bg-[#1463d6]",
      label: "Facebook Page",
      req: "Page permission required",
    },
    instagram: {
      icon: Instagram,
      iconBg: "bg-pink-50",
      iconColor: "text-[#E1306C]",
      ring: "ring-pink-100",
      btn: "bg-[#E1306C] hover:bg-[#c1275b]",
      label: "Instagram Business",
      req: "Linked with FB Page",
    },
  };

  const theme = config[platform];
  if (!theme) return null;
  const Icon = theme.icon;

  return (
    <div
      className={`
        relative bg-white rounded-xl p-3
        shadow-[0_6px_24px_rgba(0,0,0,0.05)]
        hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)]
        transition-all
        ${isConnected ? `ring-1 ${theme.ring}` : ""}
      `}
    >
      {/* Disconnect */}
      {isConnected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDisconnect?.();
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Icon */}
      <div
        className={`mx-auto w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${theme.iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="mt-2 text-[12px] font-semibold text-gray-900 text-center leading-tight">
        {theme.label}
      </h3>

      {/* Status */}
      {isConnected ? (
        <p
          className="text-[10px] text-gray-700 text-center mt-0.5 truncate"
          title={identity}
        >
          {platform === "instagram" ? `@${identity}` : identity}
        </p>
      ) : (
        <p className="text-[10px] text-gray-400 text-center mt-0.5">
          Not connected
        </p>
      )}

      {/* Button */}
      <div className="mt-3">
        {isConnected ? (
          <Link href="/post-management">
          <button
            onClick={onManage}
            className={`w-full ${theme.btn} text-white py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1`}
          >
            Publish
            <ArrowRight className="w-3 h-3" />
          </button>
          </Link>
        ) : (
          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"
          >
            {loading ? "Connecting..." : (
              <>
                <LinkIcon className="w-3 h-3" />
                Connect
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <p className="mt-2 text-[9px] text-gray-400 text-center leading-tight">
        {theme.req}
      </p>
    </div>
  );
}
