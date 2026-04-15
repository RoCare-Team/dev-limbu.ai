import { Activity, FolderKey, Globe, PlusSquare, QrCode, SquareChartGantt, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";



const navItems = [
    {
        href: "/gmb-insights",
        icon: <SquareChartGantt className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "GMB Insights",
        isFree: true,
    },
    {
        href: "/gmb-health",
        icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "GMB Health",
        isFree: true,
    },
    {
        href: "/get-magic-qr",
        icon: <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Magic QR",
        isFree: true,
    },

    {
        href: "/review-management",
        icon: <Star className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Review Reply",
        isFree: true,
    },

    {
        href: "/keyword-planner",
        icon: <FolderKey className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Keyword Planner",
        isFree: true,
    },
    {
        href: "/build-website",
        icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Website Builder",
        isFree: true,
        //  specialTag: "Launched Today",
    },
    {
        href: "/post-management",
        icon: <PlusSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Create Post",
    },
];

const NavLinks = ({ isAuthenticated, onGmbInsightsClick }) => {
    const pathname = usePathname();
    return (
        <div className="w-full py-2 px-3  rounded-2xl  mb-8">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-5">
                {navItems.map((item) => {
                    const isPublic =
                        item.href === "/post-management" || item.href === "/wallet";

                    const isEnabled = isAuthenticated || isPublic;
                    const isKeywordPlanner = item.label === "Keyword Planner";
                    const isGmbInsights = item.label === "GMB Insights";
                    const isActive = pathname === item.href && isAuthenticated;

                    const handleClick = () => {
                        if (!isEnabled) {
                            return signIn("google", { callbackUrl: item.href });
                        }
                        if (isGmbInsights) {
                            return onGmbInsightsClick();
                        }
                    };

                    const Card = (
                        <div
                            onClick={handleClick}
                            className={`group relative flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-300 cursor-pointer border-2 w-full aspect-square
              
              ${isActive
                                    ? "bg-slate-900 border-yellow-400 shadow-lg scale-105"
                                    : "bg-white border-slate-100 hover:border-yellow-300 hover:shadow-lg hover:scale-105"
                                }
              `}
                        >


                            {/* ICON */}
                            <div
                                className={`mb-3 p-3 rounded-2xl transition-colors
                ${isActive
                                        ? "bg-yellow-50 text-yellow-600"
                                        : "bg-slate-50 text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600"
                                    }
              `}
                            >
                                {React.cloneElement(item.icon, { size: 24 })}
                            </div>

                            {/* LABEL */}
                            <span
                                className={`text-[11px] font-bold uppercase tracking-tight text-center leading-tight transition-colors duration-300
                ${isActive
                                        ? "text-white"
                                        : "text-slate-600 group-hover:text-black font-extrabold"
                                    }
              `}
                            >
                                {item.label}
                            </span>

                            {/* Verified by Google */}
                            {isKeywordPlanner && (
                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-black/10 px-2 py-0.5 rounded-full shadow-sm text-[7px] text-slate-500 font-bold whitespace-nowrap uppercase tracking-tighter">
                                    <span>Verified by</span>
                                    <img
                                        src="https://1000logos.net/wp-content/uploads/2021/05/Google-logo.png"
                                        alt="Google"
                                        className="h-2 w-auto grayscale opacity-70"
                                    />
                                </span>
                            )}
                        </div>
                    );

                    if (isEnabled) {
                        return (
                            <Link key={item.label} href={item.href}>
                                {Card}
                            </Link>
                        );
                    }

                    return <div key={item.label}>{Card}</div>;
                })}
            </div>
        </div>
    );
};


export default NavLinks;