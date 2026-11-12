import React from "react";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LinkedinColumn = React.memo(
  ({ linkedinPages, handleDisconnectLinkedin }) => {
    const router = useRouter();

    const connectLinkedin = (type) => {
      const userId = localStorage.getItem("userId");

      window.location.href = `/api/linkedin/login?type=${type}&userId=${userId}`;
    };

    return (
      <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden w-full h-[calc(100vh-220px)] min-h-[500px]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-3">
              <Image
                src="/social-icon/linkedin.png"
                alt="LinkedIn"
                width={32}
                height={32}
                className="object-contain"
              />

              <h2
                className="font-bold text-lg text-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                LinkedIn Connections
              </h2>

              {linkedinPages?.length > 0 && (
                <span className="ml-2 text-[10px] bg-black text-yellow-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {linkedinPages.length} Connected
                </span>
              )}
            </div>

            {/* Right Buttons - connect page or profile */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => connectLinkedin("page")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Connect LinkedIn Page
              </button>
              <button
                onClick={() => connectLinkedin("profile")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-yellow-400 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Connect LinkedIn Profile
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll flex-1 bg-slate-50/50">
          {linkedinPages?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {linkedinPages.map((page) => (
                <div
                  key={page.pageId}
                  className="bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Image */}
                      {page.image ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <Image
                            src={page.image}
                            alt={page.pageName}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Image
                            src="/social-icon/linkedin.png"
                            alt="LinkedIn"
                            width={20}
                            height={20}
                            className="object-contain opacity-50"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0">
                        <p
                          className="font-bold text-sm text-slate-800 uppercase tracking-tight line-clamp-1"
                          title={page.pageName}
                        >
                          {page.pageName}
                        </p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
                            {page.type === "organization"
                              ? "Company Page"
                              : "Personal Profile"}
                          </p>

                          <span
                            className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                              page.type === "organization"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {page.type === "organization" ? "PAGE" : "PROFILE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Disconnect */}
                    <button
                      onClick={() => handleDisconnectLinkedin(page.pageId)}
                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all ml-2"
                      title="Disconnect LinkedIn"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t-2 border-slate-100 mt-auto">
                    <button
                      onClick={() => router.push(`/post-management`)}
                      className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors ${
                        page.type === "organization"
                          ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      Create Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              {/* Logo */}
              <Image
                src="/social-icon/linkedin.png"
                alt="LinkedIn"
                width={80}
                height={80}
                className="object-contain mb-6"
              />

              {/* Title */}
              <h3 className="text-black font-black uppercase tracking-tight mb-2 text-lg">
                Professional Network
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Connect your LinkedIn profile or company page to share
                professional posts, articles, updates, and brand content
                directly from your dashboard.
              </p>

              {/* Connect buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => connectLinkedin("page")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105"
                >
                  Connect LinkedIn Page
                </button>
                <button
                  onClick={() => connectLinkedin("profile")}
                  className="bg-black hover:bg-slate-800 text-yellow-400 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm transition-all hover:scale-105"
                >
                  Connect LinkedIn Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

LinkedinColumn.displayName = "LinkedinColumn";

export default LinkedinColumn;