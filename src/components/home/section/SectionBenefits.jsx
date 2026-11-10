import { Clock, MessageCircleHeart, TrendingUp, Users } from "lucide-react";

const ICONS = { reach: Users, time: Clock, sales: MessageCircleHeart, growth: TrendingUp };

/** What the business gains, as one row of short chips (sectionCopy `benefits`). */
export default function SectionBenefits({ benefits }) {
  if (!benefits?.length) return null;
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {benefits.map(({ icon, title }) => {
        const Icon = ICONS[icon] || TrendingUp;
        return (
          <li
            key={title}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#fef9c3] px-3 py-1.5 text-xs font-bold text-slate-800 ring-1 ring-[#fde68a]"
          >
            <Icon size={13} strokeWidth={2.4} />
            {title}
          </li>
        );
      })}
    </ul>
  );
}
