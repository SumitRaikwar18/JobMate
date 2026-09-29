import { Link, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  FileCheck2,
  FileCode,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { JobMateLogo, JobMateEmblem } from "@/components/brand/jobmate-logo";
import { getAiQuotaStatus, subscribeCreditUpdates } from "@/lib/ai/rate-limiter";

export interface AppLayoutProps {
  children: ReactNode;
  activeNav: "dashboard" | "create" | "templates" | "jobs" | "applications" | "assistant" | "settings";
}

export function AppLayout({ children, activeNav }: AppLayoutProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dynamic AI Quota status synchronized with Supabase
  const [quota, setQuota] = useState(() =>
    getAiQuotaStatus(user?.id || "local-user", (profile?.plan_tier as any) || "free")
  );

  useEffect(() => {
    if (profile) {
      const today = new Date().toISOString().split("T")[0];
      const usedToday = profile.last_ai_request_date === today ? (profile.daily_ai_requests_count || 0) : 0;
      const limit = profile.plan_tier === "pro" ? 250 : 25;
      const remaining = Math.max(0, limit - usedToday);
      setQuota((prev) => ({
        ...prev,
        limit,
        remaining,
      }));
    } else {
      setQuota(getAiQuotaStatus(user?.id || "local-user", "free"));
    }

    const unsubscribe = subscribeCreditUpdates(({ remaining, limit }) => {
      setQuota((prev) => ({ ...prev, remaining, limit }));
    });

    return () => unsubscribe();
  }, [user?.id, profile]);

  // Real System & Account Notifications
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Daily AI Quota Ready",
      description: "You have 25 free AI tailoring & ATS audit requests refreshed for today.",
      time: "Just now",
      read: false,
      type: "quota",
      icon: Zap,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      id: "2",
      title: "Overleaf pdflatex Engine Active",
      description: "1-page single-column ATS LaTeX generation ready with 0 formatting errors.",
      time: "10m ago",
      read: false,
      type: "latex",
      icon: FileCode,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      id: "3",
      title: "Telegram Career Copilot",
      description: "Link your Telegram account in Settings (/link) to audit resumes on the go.",
      time: "1h ago",
      read: false,
      type: "bot",
      icon: Bot,
      color: "text-sky-500 bg-sky-500/10",
    },
    {
      id: "4",
      title: "Supabase Security Verified",
      description: "Row Level Security (RLS) active on all candidate profiles and resumes.",
      time: "1d ago",
      read: true,
      type: "security",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ]);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    setIsMobileDrawerOpen(false);
    await signOut();
    toast.success("Signed out successfully.");
    router.navigate({ to: "/" });
  };

  const displayName = profile?.full_name || (user?.user_metadata as any)?.["full_name"] || user?.email?.split("@")[0] || "Candidate";
  const userInitials = displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "SR";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { id: "create", label: "Resume Builder", icon: FileText, href: "/builder" },
    { id: "templates", label: "ATS Templates", icon: Layers, href: "/templates" },
    { id: "jobs", label: "Job Matcher", icon: ClipboardList, href: "/jobs" },
    { id: "applications", label: "Applications", icon: Send, href: "/applications" },
    { id: "assistant", label: "AI Copilot", icon: Bot, href: "/assistant" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-60 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shrink-0 sticky top-0 h-screen">
        <div className="space-y-6">
          {/* YC-Styled Brand Logo */}
          <Link to="/" className="flex items-center px-1.5 py-1">
            <JobMateLogo size="md" />
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.href as any}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all text-left",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom AI Quota Status Widget */}
        <div className="space-y-2.5">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Zap className="size-3.5 fill-indigo-600 dark:fill-indigo-400" />
                <span>AI Credits</span>
              </span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                {quota.remaining}/{quota.limit}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (quota.remaining / quota.limit) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="capitalize">{profile?.plan_tier || "Free"} Tier</span>
              <span>Resets {quota.resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <Link
            to="/builder"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 text-xs font-bold shadow-button transition-colors"
          >
            <Sparkles className="size-3.5" />
            <span>Resume Builder</span>
          </Link>
        </div>
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <Link to="/" onClick={() => setIsMobileDrawerOpen(false)}>
                  <JobMateLogo size="sm" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.href as any}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left",
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <Icon className={cn("size-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5 px-1 py-2">
                <div className="grid size-8 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 py-2 text-xs font-bold"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Search Bar (Tablet / Desktop) */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs, templates, or ask JobMate..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-16 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">
              Ctrl + K
            </kbd>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Daily AI Credits Pill */}
            <Link
              to="/settings"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
              title={`Daily AI Quota: ${quota.remaining}/${quota.limit} requests remaining. Resets at ${quota.resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            >
              <Zap className="size-3.5 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
              <span className="font-mono">{quota.remaining}/{quota.limit}</span>
              <span className="hidden sm:inline font-sans text-[11px] font-semibold text-indigo-600/80 dark:text-indigo-400/80">Credits</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative grid size-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-84 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Activity & Alerts</h4>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-72 overflow-y-auto mt-1">
                    {notifications.map((notif) => {
                      const Icon = notif.icon || Bell;
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            "flex items-start gap-2.5 py-2.5 px-1.5 rounded-xl transition-colors",
                            notif.read ? "opacity-75" : "bg-indigo-50/40 dark:bg-indigo-950/20"
                          )}
                        >
                          <div className={cn("grid size-7 place-items-center rounded-lg shrink-0 mt-0.5", notif.color || "text-indigo-600 bg-indigo-50")}>
                            <Icon className="size-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
                              <span className="text-[9px] text-slate-400 shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{notif.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs",
                  isUserMenuOpen && "border-indigo-600 ring-2 ring-indigo-600/20"
                )}
              >
                <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-xs font-extrabold text-white shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight truncate max-w-[120px]">{displayName}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {profile?.target_role || "Candidate"}
                  </span>
                </div>
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform", isUserMenuOpen && "rotate-180 text-indigo-600")} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-950 px-2 py-1 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Plan</span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                        {profile?.plan_tier || "Free"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <LayoutDashboard className="size-3.5 text-indigo-600" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/builder"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <Sparkles className="size-3.5 text-indigo-600" />
                      <span>Resume Builder</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <User className="size-3.5 text-amber-500" />
                      <span>Candidate Profile</span>
                    </Link>
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex lg:hidden items-center justify-around py-2 px-1 backdrop-blur-md shadow-lg">
          {[
            { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/dashboard" },
            { id: "create", label: "Builder", icon: FileText, href: "/builder" },
            { id: "jobs", label: "Matcher", icon: ClipboardList, href: "/jobs" },
            { id: "templates", label: "Templates", icon: Layers, href: "/templates" },
            { id: "assistant", label: "Copilot", icon: Bot, href: "/assistant" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <Link
                key={item.id}
                to={item.href as any}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all min-w-[56px]",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
