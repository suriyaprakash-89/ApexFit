// frontend/src/components/Layout/AppShell.jsx
import React, { Suspense, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, MoreHorizontal, ChevronDown, User, Settings, WifiOff, RefreshCw } from "lucide-react";
import toast from "@/lib/toast";
import { useAuthStore } from "../../store/authStore";
import { useActivityStore } from "../../store/activityStore";
import { useTrainingStore } from "../../store/trainingStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationCenter from "../Notifications/NotificationCenter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "../UI/Skeleton";
import ErrorBoundary from "../UI/ErrorBoundary";
import { useSyncStore } from "../../store/syncStore";
import { supabase } from "../../lib/supabase";
import { runEngagementCheck, onEngagementUpdate } from "../../lib/engagement";
import {
  NAV_SECTIONS,
  ACCOUNT_ITEMS,
  ADMIN_ITEM,
  BOTTOM_TABS,
  isAdminUser,
} from "./navigation";

const Logo = ({ compact = false }) => (
  <span className="flex items-center gap-2.5">
    <img src="/logo.png" alt="" className="h-9 w-9 rounded-full ring-1 ring-border" />
    {!compact && (
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Ape<span className="text-primary">X</span>fit
      </span>
    )}
  </span>
);

const Avatar = ({ user, size = "w-9 h-9" }) => {
  const [broken, setBroken] = useState(false);
  const photo = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return <InitialAvatar user={user} size={size} />;
};

const InitialAvatar = ({ user, size }) => (
  <span
    className={`${size} shrink-0 rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 flex items-center justify-center font-semibold text-sm`}
    aria-hidden="true"
  >
    {(user?.user_metadata?.name || user?.email || "U").charAt(0).toUpperCase()}
  </span>
);

const sidebarLinkClass = ({ isActive }) =>
  cn(
    "group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-foreground before:absolute before:-left-3 before:top-2.5 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  );

const useSignOut = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  return async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    }
  };
};

/* ------------------------------ Desktop sidebar ----------------------------- */
const Sidebar = ({ user }) => {
  const handleSignOut = useSignOut();
  const accountItems = isAdminUser(user) ? [...ACCOUNT_ITEMS, ADMIN_ITEM] : ACCOUNT_ITEMS;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-border bg-background">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <NavLink to="/dashboard" aria-label="ApeXfit home">
          <Logo />
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="eyebrow px-3 mb-2">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={sidebarLinkClass}>
                    <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow px-3 mb-2">
            Account
          </p>
          <ul className="space-y-1">
            {accountItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={sidebarLinkClass}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.user_metadata?.name || "Athlete"}
            </p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="icon-btn" aria-label="Sign out" title="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

/* --------------------------------- Top bar --------------------------------- */
const ProfileMenu = ({ user }) => {
  const navigate = useNavigate();
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-h-[44px] items-center gap-1.5 rounded-xl p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <Avatar user={user} />
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">{user?.user_metadata?.name || user?.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <User aria-hidden="true" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings aria-hidden="true" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="icon-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

const TopBar = ({ user }) => (
  // z-50 keeps the header's popovers (notifications panel) above the mobile bottom bar (z-40).
  <header className="sticky top-0 z-50 h-16 safe-top box-content bg-background/85 backdrop-blur-xl border-b border-border">
    <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
      <NavLink to="/dashboard" className="lg:hidden" aria-label="ApeXfit home">
        <Logo />
      </NavLink>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-1">
        <NotificationCenter />
        <ThemeToggle />
        <div className="hidden lg:block ml-1">
          <ProfileMenu user={user} />
        </div>
      </div>
    </div>
  </header>
);

/* ------------------------- Mobile bottom bar + sheet ------------------------ */
const MoreSheet = ({ open, onClose, user }) => {
  const handleSignOut = useSignOut();
  const { isDark, toggleTheme } = useTheme();
  const bottomPaths = new Set(BOTTOM_TABS.map((t) => t.to));
  const extra = [
    ...NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !bottomPaths.has(i.to)),
    ...ACCOUNT_ITEMS,
    ...(isAdminUser(user) ? [ADMIN_ITEM] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription className="sr-only">Other pages and account actions</SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
          <Avatar user={user} size="w-10 h-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.user_metadata?.name || "Athlete"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <nav className="grid grid-cols-3 gap-2" aria-label="More pages">
          {extra.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-colors",
                  isActive ? "border-primary/40 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground active:bg-accent"
                )
              }
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={toggleTheme} className="btn-soft">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={() => {
              onClose();
              handleSignOut();
            }}
            className="btn bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const BottomNav = ({ user }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const bottomPaths = BOTTOM_TABS.map((t) => t.to);
  const moreActive = !bottomPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  const tabClass = (active) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border safe-bottom"
        aria-label="Primary"
      >
        <div className="flex max-w-lg mx-auto">
          {BOTTOM_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
              <Icon className="w-6 h-6" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={tabClass(moreActive)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="w-6 h-6" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} user={user} />
    </>
  );
};

/* ------------------------------ Offline banner ------------------------------ */
const OfflineBanner = () => {
  const { online, pending, syncing } = useSyncStore();
  if (online && !pending) return null;

  const message = !online
    ? `You're offline. New logs are saved on this device${pending ? ` (${pending} waiting)` : ""} and sync automatically.`
    : syncing
    ? `Syncing ${pending} offline change${pending > 1 ? "s" : ""}…`
    : `${pending} offline change${pending > 1 ? "s" : ""} waiting to sync.`;

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
        online
          ? "bg-primary/10 text-foreground"
          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
      }`}
    >
      {online ? (
        <RefreshCw className={`w-4 h-4 shrink-0 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />
      ) : (
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
      {online && !syncing && (
        <button
          onClick={() =>
            useSyncStore.getState().flush({ onSynced: () => useActivityStore.getState().fetchDashboardData() })
          }
          className="underline font-semibold"
        >
          Sync now
        </button>
      )}
    </div>
  );
};

/* ---------------------------------- Shell ---------------------------------- */
const AppShell = () => {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const userId = user?.id;

  // Per-user background work lives here so it starts once after sign-in and stops on sign-out.
  useEffect(() => {
    if (!userId) return;
    const notifications = useNotificationStore.getState();
    const activity = useActivityStore.getState();
    notifications.fetchNotifications(userId);
    notifications.startRealtime(userId);
    activity.startRealtime(userId);
    // Catch up on challenges/achievements/goal notifications earned since the last visit
    runEngagementCheck();
    // Goal progress depends on every log, so refresh it after each progress check
    const stopListening = onEngagementUpdate(() => useActivityStore.getState().fetchGoalProgress());
    const firstReminder = setTimeout(() => notifications.checkReminders(userId), 5 * 60 * 1000);
    const interval = setInterval(() => notifications.checkReminders(userId), 60 * 60 * 1000);
    return () => {
      stopListening();
      clearTimeout(firstReminder);
      clearInterval(interval);
      useNotificationStore.getState().stopRealtime();
      useActivityStore.getState().stopRealtime();
      useActivityStore.getState().reset();
      useTrainingStore.getState().reset();
    };
  }, [userId]);

  // Track connectivity and replay offline logs when the connection returns
  useEffect(() => {
    if (!userId) return;
    const sync = useSyncStore.getState();
    const flush = () =>
      sync.flush({ onSynced: () => useActivityStore.getState().fetchDashboardData() });
    const goOnline = () => {
      sync.setOnline(true);
      flush();
    };
    const goOffline = () => sync.setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    flush(); // anything left over from a previous session
    // Retry periodically while changes are waiting (flaky connection / expired session)
    const retry = setInterval(() => useSyncStore.getState().pending && flush(), 60 * 1000);
    // A fresh token after sign-in/refresh is a good moment to retry too
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") flush();
    });
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearInterval(retry);
      subscription.unsubscribe();
    };
  }, [userId]);

  // New page → start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn-primary"
      >
        Skip to content
      </a>
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <TopBar user={user} />
        <OfflineBanner />
        <main id="main-content" className="pb-bottom-nav" tabIndex={-1}>
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav user={user} />
    </div>
  );
};

export default AppShell;
