/** Icons for home-section tiles: app icon names -> web icons, plus GMB tool icons. */
import {
  Activity, Award, BarChart3, Bot, Box, Camera, ChartColumn, ChartLine,
  ChartNoAxesCombined, ClipboardCheck, Clapperboard, Clock, CreditCard, FileText,
  Globe, Headset, HeartPulse, ImagePlus, Images, KeyRound, LayoutDashboard,
  LayoutGrid, Link2, LocateFixed, Mail, Megaphone, MessageSquare,
  MessageSquareHeart, MessagesSquare, MonitorSmartphone, Network, NotebookPen,
  Palette, QrCode, Search, SearchCheck, Send, Settings, ShoppingCart, Sparkles,
  SquarePen, Star, Store, Swords, Trash2, TrendingUp, UserRound, Video,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

// App icon names (constants.js) -> web icons.
const MATERIAL_ICONS = {
  bar_chart: BarChart3,
  star: Star,
  edit_square: SquarePen,
  chat_bubble_outline: MessageSquare,
  qr_code_2: QrCode,
  language: Globe,
  add_photo_alternate: ImagePlus,
  auto_awesome: Sparkles,
  slideshow: Clapperboard,
  face_retouching_natural: UserRound,
  view_in_ar: Box,
  workspace_premium: Award,
  description: FileText,
  settings: Settings,
  link: Link2,
  key: KeyRound,
  edit_note: NotebookPen,
  location_searching: LocateFixed,
  insights: Activity,
  travel_explore: Search,
  campaign: Megaphone,
  storefront: Store,
  trending_up: TrendingUp,
  photo_camera: Camera,
  videocam: Video,
  schedule: Clock,
  analytics: ChartColumn,
  smart_toy: Bot,
  photo_library: Images,
  query_stats: ChartLine,
  monitor_heart: HeartPulse,
  forum: MessagesSquare,
  send: Send,
  delete_sweep: Trash2,
  mail: Mail,
  shopping_cart: ShoppingCart,
  palette: Palette,
  dashboard: LayoutDashboard,
  payments: CreditCard,
  support_agent: Headset,
  fact_check: ClipboardCheck,
  hub: Network,
};

const BRAND_ICONS = {
  google: { Icon: FcGoogle },
  facebook: { Icon: FaFacebook, color: "#1877F2" },
  instagram: { Icon: FaInstagram, color: "#E4405F" },
  youtube: { Icon: FaYoutube, color: "#FF0000" },
  linkedin: { Icon: FaLinkedin, color: "#0A66C2" },
  pinterest: { Icon: FaPinterest, color: "#E60023" },
  whatsapp: { Icon: FaWhatsapp, color: "#25D366" },
};

// Google Business Profile tools get a more specific icon than the app's
// generic one, all in the brand yellow. Keyed by item.key.
export const FEATURE_ICONS = {
  gbp_insight: ChartNoAxesCombined,
  health_score: HeartPulse,
  gbp_create_post: Megaphone,
  review_reply: MessageSquareHeart,
  magic_qr: QrCode,
  assets_management: Images,
  keyword_planner: SearchCheck,
  competitor_analysis: Swords,
  website_builder: MonitorSmartphone,
};

export function FeatureIcon({ Icon }) {
  return (
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#fef9c3] text-slate-900 ring-1 ring-[#fde68a] transition-all duration-300 ease-out group-hover:bg-[#facc15] group-hover:ring-[#facc15]">
      <Icon size={20} strokeWidth={2} />
    </span>
  );
}

export function TileIcon({ icon, size, className = "text-slate-800" }) {
  if (icon?.type === "brand" && BRAND_ICONS[icon.value]) {
    const { Icon, color } = BRAND_ICONS[icon.value];
    return <Icon size={size} style={color ? { color } : undefined} />;
  }
  if (icon?.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon.value} alt="" width={size} height={size} className="object-contain" />;
  }
  const Icon = MATERIAL_ICONS[icon?.value] || LayoutGrid;
  return <Icon size={size} strokeWidth={2.2} className={className} />;
}
