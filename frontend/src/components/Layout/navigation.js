// frontend/src/components/Layout/navigation.js
import {
  Home,
  Activity,
  Footprints,
  Moon,
  Target,
  Brain,
  Trophy,
  BarChart3,
  ScanFace,
  User,
  Settings,
  Shield,
} from "lucide-react";

// Single navigation map used by the sidebar (desktop), bottom bar and "More" sheet (mobile).
export const NAV_SECTIONS = [
  {
    title: "Track",
    items: [
      { to: "/dashboard", label: "Home", icon: Home, end: true },
      { to: "/activities", label: "Activities", icon: Activity },
      { to: "/steps", label: "Steps", icon: Footprints },
      { to: "/sleep", label: "Sleep", icon: Moon },
      { to: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    title: "Coach & Play",
    items: [
      { to: "/coach", label: "AI Coach", icon: Brain },
      { to: "/challenges", label: "Challenges", icon: Trophy },
      { to: "/insights", label: "Insights", icon: BarChart3 },
      { to: "/ar-fitness", label: "AR Fitness", icon: ScanFace },
    ],
  },
];

export const ACCOUNT_ITEMS = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const ADMIN_ITEM = { to: "/admin", label: "Admin", icon: Shield };

// Mobile bottom bar: the 4 most-used destinations + "More"
export const BOTTOM_TABS = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/activities", label: "Log", icon: Activity },
  { to: "/coach", label: "Coach", icon: Brain },
  { to: "/challenges", label: "Challenges", icon: Trophy },
];

// app_metadata can only be written by the server (see PUT /api/admin/users/:id/role);
// user_metadata is editable by the user, so it must never grant admin UI.
export const isAdminUser = (user) => user?.app_metadata?.role === "admin";
