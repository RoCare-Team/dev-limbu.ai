import { Activity, FolderKey, Globe, MapPin, PlusSquare, QrCode, SquareChartGantt, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo } from "react";
import { startGmbConnect } from "@/hooks/useGmbConnection";
import MobileFeatureGuide from "./MobileFeatureGuide";

// `tooltip` = hover par dikhne wali one-line explanation: feature kya karta hai
// aur process kaise chalta hai.
const navItems = [
    {
        href: "/competitor-analysis",
        icon: <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Competitor Analysis",
        isFree: true,
        tooltip:
            "See where you rank on Google Maps against your competitors. Enter a keyword + location — we scan a grid of points around your business and show the rank at each point.",
    },
    {
        href: "/gmb-health",
        icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "GMB Health",
        isFree: true,
        tooltip:
            "Full audit of your Google Business Profile. We check categories, hours, photos, services, posts and reviews, then score what's missing with fixes.",
    },
    {
        href: "/gmb-insights",
        icon: <SquareChartGantt className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "GMB Insights",
        isFree: true,
        tooltip:
            "Your profile's real performance — views, searches, calls and direction requests. Pick a date range and we pull the numbers straight from Google.",
    },
    {
        href: "/get-magic-qr",
        icon: <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Magic QR",
        isFree: true,
        tooltip:
            "A QR code that collects reviews for you. Print or share it — customer scans, gives feedback, and happy ones land directly on your Google review page.",
    },

    {
        href: "/review-management",
        icon: <Star className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Review Reply",
        isFree: true,
        tooltip:
            "All your Google reviews in one inbox. AI drafts a reply in your business tone — approve it yourself or let auto-reply handle new reviews.",
    },

    {
        href: "/keyword-planner",
        icon: <FolderKey className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Keyword Planner",
        isFree: true,
        tooltip:
            "Find what customers actually search. Enter a service + city and get search volume, competition and keyword ideas from Google's own data.",
    },
    {
        href: "/build-website",
        icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Website Builder",
        isFree: true,
        tooltip:
            "Turns your Google profile into a live website. Pick a template — services, photos, timings and contact details fill in automatically from your profile.",
    },
    {
        href: "/post-management",
        icon: <PlusSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Create Post",
        tooltip:
            "Publish posts on your Google profile. Write your own or let AI generate the image + copy, then post now or schedule it for later.",
    },
];

const NavLinks = memo(({ isAuthenticated, onGmbInsightsClick }) => {
    const pathname = usePathname();

    return (
        <div className="w-full py-2 px-1 rounded-2xl mb-8">
            {/* Desktop par saare cards ek hi line me (8 columns), sabki height barabar */}
            <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 lg:gap-2.5">
                {navItems.map((item, index) => {
                    // GMB connect na ho tab bhi seedha page par jaana chahiye — is
                    // page ko khud apna keyword + location input chahiye, GMB
                    // account se koi lena-dena nahi. Pehle ye bhi `gmbConnected`
                    // (isAuthenticated) ke peeche gated tha, isliye click karte hi
                    // seedha Google GMB consent screen khul jata tha.
                    const isPublic =
                        item.href === "/post-management" ||
                        item.href === "/wallet" ||
                        item.href === "/competitor-analysis";

                    const isEnabled = isAuthenticated || isPublic;
                    const isKeywordPlanner = item.label === "Keyword Planner";
                    const isGmbInsights = item.label === "GMB Insights";
                    const isActive = pathname === item.href && isAuthenticated;

                    // Kinare wale cards ka tooltip screen se bahar na nikle.
                    const isFirst = index === 0;
                    const isLast = index === navItems.length - 1;
                    const tooltipAlign = isFirst
                        ? "left-0"
                        : isLast
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2";
                    const arrowAlign = isFirst
                        ? "left-6"
                        : isLast
                            ? "right-6"
                            : "left-1/2 -translate-x-1/2";

                    const handleClick = (e) => {
                        if (!isEnabled) {
                            e.preventDefault();
                            return startGmbConnect(item.href).catch((err) => console.error(err));
                        }
                    };

                    const Card = (
                        <div
                            onClick={handleClick}
                            // Mobile tour isi attribute se card dhoondh kar highlight karta hai.
                            data-tour-id={item.href}
                            // h-full + fixed label/footer heights: har card ek jaisa dikhe,
                            // chahe label do line ka ho (Local Rank Tracker) ya usme
                            // "Verified by Google" chip ho (Keyword Planner).
                            className={`group relative flex h-full w-full cursor-pointer flex-col items-center rounded-2xl border px-2 pb-2.5 pt-4 transition-all duration-300
              ${isActive
                                    ? "border-yellow-400 bg-slate-900 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.55)]"
                                    : "border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_12px_26px_-12px_rgba(15,23,42,0.28)]"
                                }
              `}
                        >
                            {/* FREE TAG — card ke andar, taaki row ki height na bigde */}
                            {item.isFree && (
                                <span className="absolute right-1.5 top-1.5 rounded-full bg-yellow-100 px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wider text-yellow-700 ring-1 ring-yellow-200">
                                    Free
                                </span>
                            )}

                            {/* ICON */}
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                ${isActive
                                        ? "bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/30"
                                        : "bg-slate-50 text-slate-400 ring-1 ring-slate-100 group-hover:bg-yellow-50 group-hover:text-yellow-600 group-hover:ring-yellow-200"
                                    }
              `}
                            >
                                {React.cloneElement(item.icon, { size: 18 })}
                            </div>

                            {/* LABEL — do line ki jagah hamesha reserved */}
                            <span
                                className={`mt-2 flex min-h-[26px] items-center justify-center text-center text-[10px] font-bold uppercase leading-[1.15] tracking-tight transition-colors duration-300
                ${isActive ? "text-white" : "text-slate-600 group-hover:text-slate-900"}
              `}
                            >
                                {item.label}
                            </span>

                            {/* Footer slot — sirf Keyword Planner me bharta hai, par jagah
                                sab cards me reserved hai taaki baseline ek rahe */}
                            <div className="mt-1 flex h-[18px] items-end justify-center">
                                {isKeywordPlanner && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-[2px] leading-none shadow-sm shadow-black/5">
                                        <span className="text-[7px] font-semibold tracking-wide text-slate-500">
                                            Verified by
                                        </span>
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                                            alt="Google"
                                            className="h-2 w-auto object-contain"
                                        />
                                    </span>
                                )}
                            </div>

                            {/* HOVER TOOLTIP — feature kya karta hai aur kaise chalta hai */}
                            {item.tooltip && (
                                <div
                                    // Mobile par hover hota hi nahi — wahan tooltip
                                    // atak jata tha, isliye sirf md+ par. Mobile ke
                                    // liye MobileFeatureGuide (step-by-step modal) hai.
                                    className={`pointer-events-none absolute top-full z-40 mt-2 hidden w-56 rounded-xl bg-slate-900 px-3 py-2 text-left text-[10px] font-medium normal-case leading-snug tracking-normal text-slate-200 opacity-0 shadow-xl shadow-slate-900/20 transition-opacity duration-200 group-hover:opacity-100 md:block
                    ${tooltipAlign}`}
                                    role="tooltip"
                                >
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-yellow-300">
                                        {item.label}
                                    </span>
                                    {item.tooltip}
                                    <span
                                        className={`absolute -top-1 h-2 w-2 rotate-45 bg-slate-900 ${arrowAlign}`}
                                    />
                                </div>
                            )}
                        </div>
                    );

                    if (isEnabled) {
                        return (
                            <Link key={item.label} href={item.href} className="block h-full">
                                {Card}
                            </Link>
                        );
                    }

                    return (
                        <div key={item.label} className="h-full">
                            {Card}
                        </div>
                    );
                })}
            </div>

            {/* Mobile: landing par step-by-step feature guide (desktop par tooltips) */}
            <MobileFeatureGuide items={navItems} />
        </div>
    );
});

NavLinks.displayName = "NavLinks";

export default NavLinks;