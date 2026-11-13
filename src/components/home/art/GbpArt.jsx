import Image from "next/image";
import { MessageSquareReply, Sparkles, TrendingUp } from "lucide-react";
import { Stage, Chip } from "./shared";

/* Owner checking their Google Business Profile growth, with what the AI did today */
export default function GbpArt() {
  return (
    <Stage>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border-[6px] border-white bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.3)]">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 520px, 90vw"
          className="object-cover"
        />
      </div>
      <Chip
        className="left-0 top-5 sm:-left-1 sm:top-8"
        icon={Sparkles}
        title="AI post published"
        sub="Today, 10:00 AM"
      />
      <Chip
        className="right-0 top-1/2 sm:-right-1"
        icon={MessageSquareReply}
        title="Review replied"
        sub="in 2 seconds"
      />
      <Chip
        className="bottom-1 left-4 sm:left-8"
        icon={TrendingUp}
        title="+320% profile views"
        sub="in 3 months"
      />
    </Stage>
  );
}
