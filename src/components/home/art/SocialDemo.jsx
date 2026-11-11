"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCheck, Heart, MessageCircle, Send, Sparkles, TrendingUp, Users } from "lucide-react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { POST_IMAGES } from "./media";

/**
 * A light, code-only "video" of the Social Media tools: five short scenes that
 * loop inside a phone frame (no video file to download). Plays only while on
 * screen; with reduced motion it shows the finished post instead.
 */
export const SOCIAL_SCENES = [
  { key: "idea", label: "Type your idea" },
  { key: "create", label: "AI creates the post" },
  { key: "publish", label: "Publish everywhere" },
  { key: "reply", label: "Auto-reply to comments" },
  { key: "grow", label: "Watch your audience grow" },
];

const SCENE_MS = 3200;
const PROMPT = "Summer offer on cold drinks, 20% off this week";
const CAPTION = "Beat the heat! 🥤 20% off all cold drinks this week only. #SummerSale #ColdDrinks";

/** Types `text` out while `active`, in `ms` total. */
function useTyped(text, active, ms = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return setCount(0);
    setCount(0);
    const step = Math.max(12, Math.floor(ms / text.length));
    const t = setInterval(() => setCount((c) => (c >= text.length ? c : c + 1)), step);
    return () => clearInterval(t);
  }, [text, active, ms]);
  return text.slice(0, count);
}

function IdeaScene({ active }) {
  const typed = useTyped(PROMPT, active);
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Create a post</p>
      <div className="min-h-[64px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] font-semibold text-slate-800">
        {typed}
        <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-slate-900" />
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#facc15] px-3 py-2 text-[11px] font-black text-black">
        <Sparkles size={13} /> Generate with AI
      </span>
    </div>
  );
}

function PostCard({ caption, children }) {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400 p-[2px]">
          <span className="block h-full w-full rounded-full bg-white" />
        </span>
        <span className="text-[11px] font-bold text-slate-900">yourbusiness</span>
        <FaInstagram size={14} className="ml-auto text-pink-600" />
      </div>
      <div className="relative aspect-square bg-slate-100">
        <Image src={POST_IMAGES.social} alt="" fill sizes="260px" className="object-cover" />
      </div>
      {caption !== undefined && <p className="px-3 pt-2 text-[10px] leading-snug text-slate-600">{caption}</p>}
      {children}
    </div>
  );
}

function CreateScene({ active }) {
  const caption = useTyped(CAPTION, active, 1800);
  return (
    <div className="relative h-full">
      <PostCard caption={caption} />
      <span className="absolute right-2 top-11 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[9px] font-black text-slate-900 shadow">
        <Sparkles size={10} className="text-amber-500" /> AI image + caption
      </span>
    </div>
  );
}

function PublishScene({ active }) {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Publishing</p>
      {[
        { Icon: FaInstagram, name: "Instagram", color: "text-pink-600" },
        { Icon: FaFacebook, name: "Facebook", color: "text-[#1877F2]" },
      ].map(({ Icon, name, color }, i) => (
        <div
          key={name}
          className={`flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-all duration-500 ${
            active ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          }`}
          style={{ transitionDelay: `${active ? 300 + i * 500 : 0}ms` }}
        >
          <Icon size={18} className={color} />
          <span className="text-[12px] font-bold text-slate-800">{name}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
            <CheckCheck size={11} /> Posted
          </span>
        </div>
      ))}
    </div>
  );
}

function ReplyScene({ active }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return setStep(0);
    const a = setTimeout(() => setStep(1), 500);
    const b = setTimeout(() => setStep(2), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [active]);
  return (
    <PostCard>
      <div className="space-y-1.5 px-3 py-2">
        <div className="flex items-center gap-3 text-slate-700">
          <Heart size={14} className="fill-rose-500 text-rose-500" />
          <MessageCircle size={14} />
          <Send size={14} />
          <span className="ml-auto text-[10px] font-bold text-slate-500">1,248 likes</span>
        </div>
        <p className={`text-[10px] text-slate-600 transition-opacity duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`}>
          <span className="font-bold text-slate-900">priya_s</span> Price kya hai?
        </p>
        <p className={`text-[10px] text-slate-600 transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}>
          <span className="font-bold text-slate-900">yourbusiness</span> Hi Priya! DM sent with today&apos;s offer 💛
          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 text-[8px] font-black text-amber-700">
            <Sparkles size={8} /> AI
          </span>
        </p>
      </div>
    </PostCard>
  );
}

function GrowScene({ active }) {
  const stats = [
    { Icon: TrendingUp, label: "Reach", value: "+2.4k", width: "85%" },
    { Icon: Users, label: "New followers", value: "+126", width: "60%" },
    { Icon: MessageCircle, label: "DMs answered", value: "48", width: "72%" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">This week</p>
      {stats.map(({ Icon, label, value, width }, i) => (
        <div key={label}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Icon size={13} className="text-amber-600" /> {label}
            <span className="ml-auto font-black text-slate-900">{value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#facc15] to-amber-500 transition-[width] duration-1000 ease-out"
              style={{ width: active ? width : "0%", transitionDelay: `${i * 200}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const SCENE_VIEWS = { idea: IdeaScene, create: CreateScene, publish: PublishScene, reply: ReplyScene, grow: GrowScene };

/** The looping demo. `large` is the bigger player used in the video modal. */
export default function SocialDemo({ large = false }) {
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    const t = setInterval(() => setScene((s) => (s + 1) % SOCIAL_SCENES.length), SCENE_MS);
    return () => clearInterval(t);
  }, [visible, reduced]);

  const shown = reduced ? 3 : scene; // reduced motion: the finished post with its reply

  return (
    <div ref={ref} className="mx-auto" style={{ width: large ? 320 : 280 }} aria-label="Social media tools demo" role="img">
      <div className="overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="relative" style={{ height: large ? 440 : 380 }}>
          {SOCIAL_SCENES.map(({ key }, i) => {
            const View = SCENE_VIEWS[key];
            return (
              <div
                key={key}
                className={`absolute inset-0 bg-white transition-all duration-500 ${i === shown ? "z-10 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
                aria-hidden={i !== shown}
              >
                <View active={i === shown && visible} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene progress: done scenes full, current one filling, next ones empty */}
      <div className="mt-3 flex gap-1.5">
        {SOCIAL_SCENES.map(({ key }, i) => {
          const playing = i === shown && visible && !reduced;
          return (
            <span key={key} className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
              <span
                key={playing ? `${key}-${scene}` : key}
                className="block h-full rounded-full bg-[#facc15]"
                style={playing ? { animation: `scene-fill ${SCENE_MS}ms linear forwards` } : { width: i <= shown ? "100%" : "0%" }}
              />
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs font-bold text-slate-600">
        {shown + 1}. {SOCIAL_SCENES[shown].label}
      </p>
      <style>{`@keyframes scene-fill { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
