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
  Sparkles,
  User,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

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

  // System notifications
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Multi-Agent DAG Online",
      description: "5-Agent LangGraph StateGraph engine is ready for JD tailoring.",
      time: "Just now",
      read: false,
      type: "ai",
    },
    {
      id: "2",
      title: "LaTeX ATS Engine Active",
      description: "Deterministic 1-page single-column LaTeX compiler configured.",
      time: "2h ago",
      read: false,
      type: "latex",
    },
    {
      id: "3",
      title: "Supabase Security Verified",
      description: "Row Level Security (RLS) active on all 9 candidate tables.",
      time: "1d ago",
      read: true,
      type: "security",
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

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Candidate";
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1.5 group">
            <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-button transition-transform group-hover:scale-105">
              <Briefcase className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Job<span className="text-indigo-600">Mate</span>
            </span>
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

        {/* Bottom AI Status & Fast Actions */}
        <div className="space-y-2">
          <Link
            to="/builder"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 text-xs font-bold shadow-button transition-colors"
          >
            <Sparkles className="size-3.5" />
            <span>Open AI Studio</span>
          </Link>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Agent DAG</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              0% Hallucination Guardrail
            </p>
          </div>
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
                <Link to="/" onClick={() => setIsMobileDrawerOpen(false)} className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white shadow-button">
                    <Briefcase className="size-4" />
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Job<span className="text-indigo-600">Mate</span>
                  </span>
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
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative grid size-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h4>
                    <button
                      type="button"
                      onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-[10px] text-indigo-600 font-semibold hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="py-2.5 px-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                          <span className="text-[9px] text-slate-400">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{notif.description}</p>
                      </div>
                    ))}
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
                <div className="grid size-8 place-items-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">
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
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
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
                      <span>Live AI Studio</span>
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
