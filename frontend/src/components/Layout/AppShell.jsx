// frontend/src/components/Layout/AppShell.jsx
import React, { Suspense, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, MoreHorizontal, ChevronDown, User, Settings, WifiOff, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useActivityStore } from "../../store/activityStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationCenter from "../Notifications/NotificationCenter";
import Modal from "../UI/Modal";
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
    <img src="/logo.png" alt="" className="w-9 h-9 rounded-full shadow-sm" />
    {!compact && (
      <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
        Ape<span className="text-primary-600 dark:text-primary-400">X</span>fit
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
    className={`${size} shrink-0 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-semibold text-sm`}
    aria-hidden="true"
  >
    {(user?.user_metadata?.name || user?.email || "U").charAt(0).toUpperCase()}
  </span>
);

const sidebarLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
  }`;

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
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <NavLink to="/dashboard" aria-label="ApeXfit home">
          <Logo />
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={sidebarLinkClass}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const handleSignOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { label: "Profile", icon: User, onClick: () => navigate("/profile") },
    { label: "Settings", icon: Settings, onClick: () => navigate("/settings") },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar user={user} />
        <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in"
        >
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.user_metadata?.name || user?.email}
            </p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          {items.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
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
  // Solid background on purpose: backdrop-filter would trap the full-screen
  // mobile notification panel (position: fixed) inside the header.
  // z-50 keeps the header's popovers (notifications panel) above the mobile bottom bar (z-40).
  <header className="sticky top-0 z-50 h-16 safe-top box-content bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
    <Modal isOpen={open} onClose={onClose} title="More">
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <Avatar user={user} size="w-10 h-10" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user?.user_metadata?.name || "Athlete"}
          </p>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
      </div>
      <nav className="grid grid-cols-3 gap-2" aria-label="More pages">
        {extra.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-xl text-xs font-medium ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200"
              }`
            }
          >
            <Icon className="w-6 h-6" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={toggleTheme} className="btn-soft">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={() => {
            onClose();
            handleSignOut();
          }}
          className="btn bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </Modal>
  );
};

const BottomNav = ({ user }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const bottomPaths = BOTTOM_TABS.map((t) => t.to);
  const moreActive = !bottomPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  const tabClass = (active) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors ${
      active ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
    }`;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 safe-bottom"
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
          ? "bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
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
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
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
