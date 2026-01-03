"use client";

import { useEffect, useState } from "react";
import { Facebook, Instagram } from "lucide-react";

export default function MetaConnectCard() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meta/status")
      .then(res => res.json())
      .then(data => {
        if (data.connected) setMeta(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const connectMeta = () => {
    window.location.href = "/api/meta/login";
  };

  if (loading) return (
    <div className="border rounded-xl p-6 bg-white shadow-sm h-full flex items-center justify-center min-h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          <Instagram className="w-5 h-5 text-pink-600" />
          Facebook & Instagram
        </h3>

        {!meta ? (
          <p className="text-sm text-gray-600 mb-4">
            Connect your Facebook Page and Instagram Business account to automate posts and manage comments.
          </p>
        ) : (
          <div className="text-sm text-gray-700 space-y-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="flex justify-between"><b>Page:</b> <span>{meta.pageName}</span></p>
            <p className="flex justify-between"><b>Instagram:</b> <span>@{meta.instagramUsername}</span></p>
          </div>
        )}
      </div>

      {!meta ? (
        <button onClick={connectMeta} className="w-full bg-[#1877F2] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#166fe5] transition">
          Connect Now
        </button>
      ) : (
        <span className="block w-full text-center py-2 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200">✅ Connected</span>
      )}
    </div>
  );
}