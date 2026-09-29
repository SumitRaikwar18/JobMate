import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
  Loader2,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { JobMateLogo } from "@/components/brand/jobmate-logo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In & Candidate Portal — JobMate AI" },
      { name: "description", content: "Access your JobMate AI resume and career dashboard. Secure authentication with email magic link and Supabase." },
      { name: "keywords", content: "jobmate login, resume builder sign in, candidate auth, career portal" },
      { property: "og:title", content: "Sign In & Candidate Portal — JobMate AI" },
      { property: "og:description", content: "Access your JobMate AI resume assistant and tailored application suites." },
      { property: "og:url", content: "https://jobmate-ebon.vercel.app/login" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sign In & Candidate Portal — JobMate AI" },
      { name: "twitter:description", content: "Sign in to JobMate AI to build ATS-proof resumes and track applications." },
      { name: "twitter:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
    ],
    links: [
      { rel: "canonical", href: "https://jobmate-ebon.vercel.app/login" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, router]);

  const handleSignUp = async () => {
    if (!email || !password || !fullName.trim()) {
      toast.error("Please fill in all fields (Full Name, Email, Password).");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to create account. Please try again.");
        return;
      }

      if (data?.session) {
        toast.success("Account created successfully! Welcome to JobMate.");
        router.navigate({ to: "/dashboard" });
      } else if (data?.user && !data.session) {
        // Confirmation email sent
        setConfirmationNeeded(true);
        toast.success("Account created! Please check your email to confirm your account.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithPassword = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        return;
      }

      if (data?.session) {
        toast.success("Signed in successfully!");
        router.navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: mode === "signup",
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to send magic code.");
        return;
      }

      setOtpSent(true);
      toast.success("Magic sign-in link and OTP sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otpCode) {
      toast.error("Please enter your email and the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });

      if (error) {
        toast.error(error.message || "Invalid or expired OTP code.");
        return;
      }

      if (data?.session) {
        toast.success("Authenticated successfully!");
        router.navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === "otp") {
      if (otpSent) {
        handleVerifyOtp();
      } else {
        handleSendOtp();
      }
    } else {
      if (mode === "signup") {
        handleSignUp();
      } else {
        handleSignInWithPassword();
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Feature Showcase Panel (Desktop only) */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-indigo-600/20 blur-3xl" />

        {/* Top Logo & Platform Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center" aria-label="JobMate Home">
            <JobMateLogo size="md" />
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-primary-hover backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>AI Career Platform</span>
          </span>
        </div>

        {/* Center Value Pillars */}
        <div className="relative z-10 my-auto space-y-7 py-6">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            Build ATS-optimized resumes{" "}
            <span className="block mt-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-primary-hover bg-clip-text text-transparent">
              tailored to your career goals.
            </span>
          </h2>

          <div className="space-y-3.5">
            {[
              {
                icon: ShieldCheck,
                title: "Evidence Grounding Engine",
                desc: "Every generated resume claim is strictly verified against candidate source evidence.",
              },
              {
                icon: Bot,
                title: "GitHub Code Intelligence",
                desc: "Analyzes repositories, frameworks, and architecture to extract verifiable engineering evidence.",
              },
              {
                icon: Zap,
                title: "Deterministic ATS Analysis",
                desc: "Inspects keyword coverage, formatting, and heuristic scoring with explainable rationale.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary-hover">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Authentic Privacy & Architecture Badge */}
        <div className="relative z-10 border-t border-white/10 pt-5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Privacy-First Architecture</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-slate-400" />
            <span>Supabase RLS Protected</span>
          </span>
        </div>
      </aside>

      {/* Right Form Container (Fully responsive across all screen sizes) */}
      <main className="flex flex-1 flex-col justify-between p-5 sm:p-8 md:p-10 lg:p-12 xl:p-14">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Back to home</span>
          </Link>

          <Link to="/" className="inline-flex items-center gap-1.5 lg:hidden">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FileCheck2 className="size-4" />
            </span>
            <span className="font-bold text-foreground">JobMate</span>
          </Link>
        </div>

        {/* Center Auth Card */}
        <div className="mx-auto w-full max-w-md py-6 sm:py-8">
          {/* Sign In vs Sign Up Tab Switcher */}
          <div className="flex rounded-xl bg-section p-1 border border-border/80">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setConfirmationNeeded(false);
              }}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200",
                mode === "signup"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setConfirmationNeeded(false);
              }}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200",
                mode === "signin"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {mode === "signup" ? "Get started with JobMate" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {mode === "signup"
                ? "Start building, tailoring, and optimizing your resumes for free."
                : "Sign in to access your resumes, applications, and AI assistant."}
            </p>
          </div>

          {/* Social / Bot Buttons (Frozen state as requested) */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="relative group">
              <button
                type="button"
                disabled
                className="w-full opacity-60 cursor-not-allowed flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs"
                title="Google OAuth integration coming soon"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>
              <span className="absolute -top-2 right-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                Soon
              </span>
            </div>
          </div>

          <div className="relative my-6 text-center text-xs text-muted-foreground">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border/70" />
            <span className="relative bg-background px-3 text-[11px] uppercase tracking-wider font-semibold text-primary">
              Primary: Email Authentication
            </span>
          </div>

          {confirmationNeeded ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Mail className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Check Your Email</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We've sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Click the link to complete your account setup and access your dashboard.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmationNeeded(false);
                  setMode("signin");
                }}
                className="mt-2 text-xs"
              >
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            /* Credentials Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-foreground">Full Name</label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Jordan"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground">Email Address</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <Mail className="size-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {authMethod === "password" ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-foreground">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setAuthMethod("otp")}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Use OTP / Magic Code
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Lock className="size-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-foreground">One-Time Code (OTP)</label>
                    <button
                      type="button"
                      onClick={() => setAuthMethod("password")}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Use Password instead
                    </button>
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="text"
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="rounded-xl border border-border bg-section px-3 text-xs font-semibold text-primary hover:bg-soft-blue disabled:opacity-50"
                    >
                      {otpSent ? "Resend" : "Get Code"}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="flex items-start gap-2 pt-0.5 text-xs text-muted-foreground">
                  <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-soft-blue text-primary">
                    <Check className="size-2.5 stroke-[2.5]" />
                  </span>
                  <span className="text-[11px] leading-snug">
                    Free plan includes ATS score analyzer, keyword matcher, and resume downloads.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl py-3 text-xs font-bold shadow-button hover:shadow-button-hover"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </span>
                ) : mode === "signup" ? (
                  <span className="flex items-center gap-1.5">
                    Create Free Account <ArrowRight className="size-4" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Sign In <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* Footer Terms */}
          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            By continuing, you agree to JobMate's Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-xs text-muted-foreground">
          © 2026 JobMate. All rights reserved.
        </div>
      </main>
    </div>
  );
}