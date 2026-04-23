import {
    Home, LayoutDashboard, FileText, Star, Wand,
    LucideImage, KeyRound, Package, Activity, User, Settings
} from "lucide-react";

export const MENU_ITEMS = [
    { text: "Home", icon: <Home size={18} />, path: "/" },
    { text: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { text: "Post Management", icon: <FileText size={18} />, path: "/post-management" },
    { text: "Review Management", icon: <Star size={18} />, path: "/review-management" },
    {
        text: "Get Magic QR",
        icon: <Wand size={18} />,
        children: [
            { text: "Get Magic QR", path: "/get-magic-qr" },
            { text: "Get Customer Review", path: "/reviews/get-customer-review" },
        ],
    },
    { text: "Assets Management", icon: <LucideImage size={18} />, path: "/assets-management" },
    { text: "Keyword Management", icon: <KeyRound size={18} />, path: "/keyword-planner" },
    {
        text: "Services & Packages",
        icon: <Package size={18} />,
        children: [
            { text: "Our Services", path: "/#services" },
            { text: "Our Packages", path: "/#subscription-plans" },
        ],
    },
    { text: "GMB Health", icon: <Activity size={18} />, path: "/gmb-health" },
    { text: "User Profile", icon: <User size={18} />, path: "/profile" },
    { text: "Settings", icon: <Settings size={18} />, path: "/user-settings" },
];

export const SETTINGS_PATHS = new Set(["/user-settings", "/user-settings/optimization"]);
export const SETTINGS_NAV_USER_IDS = new Set(["USR1761994068831"]);