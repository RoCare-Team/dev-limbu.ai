import {
  BadgeCheck, BarChart3, BookOpen, Clapperboard, ClipboardList, Coins, Download, Gauge, GraduationCap,
  LayoutTemplate, Link, ListChecks, LogIn, Mail, MessageCircle, MessageSquare, Palette, PenSquare,
  PhoneCall, Plus, QrCode, Rocket, Settings2, Share2, Sparkles, Target, TrendingUp, Type, Upload, Wrench,
  MapPin, Megaphone, Search, Globe, Contact, Smartphone,
} from "lucide-react";

// Icon names used in lib/serviceGuides.js, plus one icon per service key.
const ICONS = {
  BadgeCheck, BarChart3, BookOpen, Clapperboard, ClipboardList, Coins, Download, Gauge, GraduationCap,
  LayoutTemplate, Link, ListChecks, LogIn, Mail, MessageCircle, MessageSquare, Palette, PenSquare,
  PhoneCall, Plus, QrCode, Rocket, Settings2, Share2, Sparkles, Target, TrendingUp, Type, Upload, Wrench,
};

export const SERVICE_ICONS = {
  gmb: MapPin, social: Share2, ai: Sparkles, outreach: Megaphone, seo: Search, web: Globe, ads: Target, crm: Contact, app: Smartphone,
};

export default function GuideIcon({ name, ...props }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon {...props} />;
}
