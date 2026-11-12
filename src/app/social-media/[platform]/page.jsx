"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import FacebookColumn from "@/components/dashboard/FacebookColumn";
import InstagramColumn from "@/components/dashboard/InstagramColumn";
import LinkedinColumn from "@/components/dashboard/LinkedinColumn";
import PinterestColumn from "@/components/dashboard/PinterestColumn";
import YouTubeColumn from "@/components/dashboard/YouTubeColumn";
import { useFacebook } from "@/hooks/useFacebook";
import { useInstagram } from "@/hooks/useInstagram";
import { useLinkedin } from "@/hooks/useLinkedin";
import { usePinterest } from "@/hooks/usePinterest";
import { useYouTube } from "@/hooks/useYouTube";

/**
 * /social-media/<platform> — "Manage" from the Social Media page.
 * One platform at a time: its connected pages/profiles, add another, create a
 * post, disconnect one or all. Same hooks and columns as the dashboard tabs.
 */

/** Disconnect every Facebook or Instagram page (revokes the Meta connection). */
async function disconnectAllMeta(platform, clear) {
  const userId = localStorage.getItem("userId");
  if (!userId) return toast.error("Login first");
  try {
    const res = await fetch(`/api/${platform}/disconnect?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // empty = all pages
    });
    const data = await res.json();
    if (!data.success) throw new Error();
    clear([]);
    toast.success(`Disconnected ${platform === "facebook" ? "Facebook" : "Instagram"}`);
  } catch {
    toast.error("Disconnect failed");
  }
}

function FacebookManage({ router, searchParams }) {
  const { facebookPages, setFacebookPages, handleDisconnectFacebook } = useFacebook(router, searchParams);
  const logout = useCallback(() => disconnectAllMeta("facebook", setFacebookPages), [setFacebookPages]);
  return (
    <FacebookColumn
      facebookPages={facebookPages}
      setFacebookPages={setFacebookPages}
      handleDisconnectFacebook={handleDisconnectFacebook}
      handleMetaLogout={logout}
    />
  );
}

function InstagramManage({ router, searchParams }) {
  const { instagramPages, setInstagramPages, handleDisconnectInstagram } = useInstagram(router, searchParams);
  const logout = useCallback(() => disconnectAllMeta("instagram", setInstagramPages), [setInstagramPages]);
  return (
    <InstagramColumn
      instagramPages={instagramPages}
      setInstagramPages={setInstagramPages}
      handleDisconnectInstagram={handleDisconnectInstagram}
      handleMetaLogout={logout}
    />
  );
}

function LinkedinManage({ router, searchParams }) {
  const { linkedinPages, setLinkedinPages, handleDisconnectLinkedin } = useLinkedin(router, searchParams);
  return (
    <LinkedinColumn
      linkedinPages={linkedinPages}
      setLinkedinPages={setLinkedinPages}
      handleDisconnectLinkedin={handleDisconnectLinkedin}
    />
  );
}

function PinterestManage({ router, searchParams }) {
  const { pinterestProfiles, setPinterestProfiles, handleDisconnectPinterest } = usePinterest(router, searchParams);
  return (
    <PinterestColumn
      pinterestProfiles={pinterestProfiles}
      setPinterestProfiles={setPinterestProfiles}
      handleDisconnectPinterest={handleDisconnectPinterest}
    />
  );
}

function YouTubeManage({ router, searchParams }) {
  const { youtubeChannels, setYoutubeChannels, handleDisconnectYouTube } = useYouTube(router, searchParams);
  return (
    <YouTubeColumn
      youtubeChannels={youtubeChannels}
      setYoutubeChannels={setYoutubeChannels}
      handleDisconnectYouTube={handleDisconnectYouTube}
    />
  );
}

const PLATFORMS = {
  facebook: { name: "Facebook", View: FacebookManage },
  instagram: { name: "Instagram", View: InstagramManage },
  linkedin: { name: "LinkedIn", View: LinkedinManage },
  pinterest: { name: "Pinterest", View: PinterestManage },
  youtube: { name: "YouTube", View: YouTubeManage },
};

function ManagePlatform() {
  const { platform } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const p = PLATFORMS[platform];
  if (!p) notFound();
  const { View } = p;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <nav className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
        <Link href="/social-media" className="hover:text-slate-900">
          Social Media
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-900">{p.name}</span>
      </nav>
      <View router={router} searchParams={searchParams} />
    </div>
  );
}

export default function ManagePlatformPage() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<div className="mx-auto mt-6 h-96 max-w-6xl animate-pulse rounded-3xl bg-slate-100" />}>
        <ManagePlatform />
      </Suspense>
    </>
  );
}
