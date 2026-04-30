import { Activity, FolderKey, Globe, PlusSquare, QrCode, SquareChartGantt, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo } from "react";
import { signIn } from "next-auth/react";

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
    },
    {
        href: "/post-management",
        icon: <PlusSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
        label: "Create Post",
    },
];

const NavLinks = memo(({ isAuthenticated, onGmbInsightsClick }) => {
    const pathname = usePathname();

    return (
        <div className="w-full py-2 px-1 rounded-2xl mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                {navItems.map((item) => {
                    const isPublic =
                        item.href === "/post-management" || item.href === "/wallet";

                    const isEnabled = isAuthenticated || isPublic;
                    const isKeywordPlanner = item.label === "Keyword Planner";
                    const isGmbInsights = item.label === "GMB Insights";
                    const isActive = pathname === item.href && isAuthenticated;

                    const handleClick = (e) => {
                        if (!isEnabled) {
                            e.preventDefault();
                            return signIn("google", { callbackUrl: item.href });
                        }
                    };

                    const Card = (
                        <div
                            onClick={handleClick}
                            className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer border-2 w-full shadow-sm
              ${isActive
                                    ? "bg-slate-900 border-yellow-400 shadow-xl shadow-slate-300"
                                    : "bg-white border-slate-200 hover:border-yellow-400 hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-1"
                                }
              `}
                        >
                            {/* FREE TAG */}
                            {item.isFree && (
                                <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-yellow-200 shadow-sm uppercase tracking-widest z-10">
                                    Free
                                </div>
                            )}

                            {/* ICON */}
                            <div
                                className={`mb-2 p-2.5 rounded-xl transition-colors
                ${isActive
                                        ? "bg-yellow-50 text-yellow-600"
                                        : "bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-yellow-50 group-hover:text-yellow-600"
                                    }
              `}
                            >
                                {React.cloneElement(item.icon, { size: 18 })}
                            </div>

                            {/* LABEL */}
                            <span
                                className={`text-[10px] font-bold uppercase tracking-tight text-center leading-tight transition-colors duration-300
                ${isActive
                                        ? "text-white"
                                        : "text-slate-600 group-hover:text-black"
                                    }
              `}
                            >
                                {item.label}
                            </span>

                            {/* Verified by Google */}
                            {isKeywordPlanner && (
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">

                                    <div className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-md border border-slate-200 px-2 py-1 rounded-lg shadow-sm shadow-black/5">

                                        {/* Text */}
                                        <span className="text-[7px] text-slate-500 font-semibold tracking-wide leading-none whitespace-nowrap">
                                            Verified by
                                        </span>

                                        {/* Logo */}
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                                            alt="Google"
                                            className="mt-0.5 h-2.5 w-auto object-contain"
                                        />

                                    </div>

                                </div>
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
});

NavLinks.displayName = "NavLinks";

export default NavLinks;