"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, ExternalLink, Heart, Lock, MessageCircle, RefreshCw, Share2, Users } from "lucide-react";
import { getUserId } from "@/components/social-automation/useAutomation";
import { AccessPanel, Card, Loading, PLATFORM, Shell } from "@/components/social-automation/parts";

const fmt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("en-IN"));

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        <Icon size={13} /> {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      {hint && <p className="text-[11px] font-medium text-slate-400">{hint}</p>}
    </div>
  );
}

function AccountInsights({ acc, userId }) {
  if (acc.error) {
    return (
      <Card title={acc.name || PLATFORM[acc.platform].name}>
        <p className="text-sm font-semibold text-rose-600">Could not load this account: {acc.error}. Try reconnecting it on the Social Media page.</p>
      </Card>
    );
  }
  const best = [...acc.posts].sort((x, y) => y.likes + y.comments + y.shares - (x.likes + x.comments + x.shares))[0];
  const engagementPerPost = acc.posts.length ? Math.round((acc.totals.likes + acc.totals.comments + acc.totals.shares) / acc.posts.length) : 0;
  return (
    <Card
      title={
        <span className="flex items-center gap-3">
          {acc.picture ? (
            <img src={acc.picture} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <Image src={PLATFORM[acc.platform].icon} alt="" width={28} height={28} />
          )}
          <span>
            {acc.name}
            <span className="block text-xs font-semibold text-slate-400">{PLATFORM[acc.platform].name}</span>
          </span>
        </span>
      }
      right={
        acc.link && (
          <a href={acc.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
            Open <ExternalLink size={12} />
          </a>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Followers" value={fmt(acc.followers)} />
        <Stat icon={Heart} label="Likes" value={fmt(acc.totals.likes)} hint={acc.posts.length ? `last ${acc.posts.length} posts` : "no posts yet"} />
        <Stat icon={MessageCircle} label="Comments" value={fmt(acc.totals.comments)} hint={acc.posts.length ? `last ${acc.posts.length} posts` : "no posts yet"} />
        <Stat
          icon={BarChart3}
          label={acc.advanced ? "Reach · 28 days" : "Engagement / post"}
          value={acc.advanced ? fmt(acc.reach28) : fmt(engagementPerPost)}
          hint={acc.advanced ? "people who saw your content" : "likes + comments + shares"}
        />
      </div>

      {!acc.advanced && (
        <a
          href={`/api/${acc.platform}/login?userId=${encodeURIComponent(userId || "")}&automation=1`}
          className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
        >
          <span className="flex items-center gap-2">
            <Lock size={14} /> Allow insights access to see reach and impressions
          </span>
          <span className="font-black">Allow →</span>
        </a>
      )}

      {best && (best.likes || best.comments) ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
          🏆 Best recent post: {fmt(best.likes)} likes, {fmt(best.comments)} comments{best.text ? ` · “${best.text.slice(0, 70)}${best.text.length > 70 ? "…" : ""}”` : ""}
        </p>
      ) : null}

      <h3 className="mb-3 mt-6 text-sm font-black text-slate-900">Recent posts</h3>
      {acc.posts.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {acc.posts.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:ring-amber-300">
              <div className="aspect-square bg-slate-100">
                {p.image ? (
                  <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <p className="line-clamp-6 p-3 text-xs text-slate-600">{p.text || "Post"}</p>
                )}
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {fmt(p.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> {fmt(p.comments)}
                </span>
                {acc.platform === "facebook" && (
                  <span className="flex items-center gap-1">
                    <Share2 size={11} /> {fmt(p.shares)}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Social Insights: followers, likes, comments and reach for each connected account. */
export default function SocialInsightsPage() {
  const [userId, setUserId] = useState(null);
  const [data, setData] = useState({ loading: true, accounts: [], error: "" });

  const load = async () => {
    const uid = getUserId();
    setUserId(uid);
    setData((d) => ({ ...d, loading: true, error: "" }));
    try {
      const d = await fetch(`/api/social/insights?userId=${encodeURIComponent(uid || "")}`, { cache: "no-store" }).then((r) => r.json());
      if (!d.success) throw new Error(d.error);
      setData({ loading: false, accounts: d.accounts, error: "" });
    } catch (err) {
      setData({ loading: false, accounts: [], error: err.message || "Could not load insights." });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (data.loading && !data.accounts.length) return <Loading />;

  return (
    <Shell
      icon={BarChart3}
      title="Insights"
      subtitle="Followers, likes, comments and reach for your Facebook pages and Instagram accounts."
      aside={
        <button
          type="button"
          onClick={load}
          disabled={data.loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={15} className={data.loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {data.error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{data.error}</p>}
      {!data.error && data.accounts.length === 0 && <AccessPanel accounts={[]} feature="insights" userId={userId} />}
      {data.accounts.map((acc) => (
        <AccountInsights key={`${acc.platform}-${acc.id}`} acc={acc} userId={userId} />
      ))}
    </Shell>
  );
}
