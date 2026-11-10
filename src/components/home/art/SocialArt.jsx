import Image from "next/image";
import { CheckCheck, Heart, MessageCircle, Send, Sparkles } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Stage, Chip } from "./shared";
import { POST_IMAGES } from "./media";

/* Instagram post made by AI + comment auto-reply */
export default function SocialArt() {
  return (
    <Stage>
      <div className="mx-auto w-[300px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400 p-[2px]">
            <span className="block h-full w-full rounded-full bg-white" />
          </span>
          <span className="text-xs font-bold text-slate-900">yourbusiness</span>
          <FaInstagram size={16} className="ml-auto text-pink-600" />
        </div>
        <div className="relative aspect-square bg-slate-100">
          <Image src={POST_IMAGES.social} alt="" fill sizes="300px" className="object-cover" />
        </div>
        <div className="space-y-1.5 px-3 py-2.5">
          <div className="flex items-center gap-3 text-slate-700">
            <Heart size={16} className="fill-rose-500 text-rose-500" />
            <MessageCircle size={16} />
            <Send size={16} />
            <span className="ml-auto text-[10px] font-bold text-slate-500">1,248 likes</span>
          </div>
          <div className="text-[10px] text-slate-600">
            <span className="font-bold text-slate-900">priya_s</span> Price kya hai?
          </div>
          <div className="text-[10px] text-slate-600">
            <span className="font-bold text-slate-900">yourbusiness</span> Hi Priya! DM sent with
            today&apos;s offer 💛
          </div>
        </div>
      </div>
      <Chip
        className="left-0 top-10"
        icon={Sparkles}
        title="AI wrote the post"
        sub="image + caption"
      />
      <Chip
        className="bottom-12 right-0"
        icon={CheckCheck}
        title="Auto-replied"
        sub="24 comments today"
      />
    </Stage>
  );
}
