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
} from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — JobMate" },
      { name: "description", content: "Access your JobMate AI resume and career dashboard." },
      { property: "og:title", content: "Sign In — JobMate" },
      { property: "og:description", content: "Access your JobMate AI resume assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        router.navigate({ to: "/dashboard" });
      }, 800);
    }, 700);
  };

  const handleSendOtp = () => {
    if (!email) return;
    setOtpSent(true);
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
          <Link to="/" className="inline-flex items-center gap-2.5 text-white" aria-label="JobMate Home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-button">
              <FileCheck2 className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Job<span className="text-primary-hover">Mate</span>
            </span>
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
                title: "ATS Optimization Engine",
                desc: "Machine-readable formats structured to pass screening filters accurately.",
              },
              {
                icon: Bot,
                title: "Web & Telegram Sync",
                desc: "Work on desktop or generate and tailor resumes on mobile via Telegram.",
              },
              {
                icon: Zap,
                title: "1-Click Job Description Matching",
                desc: "Extract essential keywords and generate high-impact achievements instantly.",
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
            <span>Encrypted & Secure</span>
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
                setSubmitted(false);
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
                setSubmitted(false);
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

          {/* Direct OAuth Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.navigate({ to: "/dashboard" })}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-accent"
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

            <a
              href="https://t.me/jobmate_bot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-accent"
            >
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#229ED9] text-white">
                <Send className="size-2.5" />
              </span>
              <span>Telegram</span>
            </a>
          </div>

          <div className="relative my-6 text-center text-xs text-muted-foreground">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border/70" />
            <span className="relative bg-background px-3 text-[11px] uppercase tracking-wider">
              Or continue with email
            </span>
          </div>

          {/* Credentials Form */}
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
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="rounded-xl border border-border bg-section px-3 text-xs font-semibold text-primary hover:bg-soft-blue"
                  >
                    {otpSent ? "Code Sent ✔" : "Get Code"}
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
                  Free forever plan includes ATS tailoring, PDF export, and Telegram AI companion.
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || submitted}
              className="mt-6 w-full rounded-xl py-3 text-xs font-bold shadow-button hover:shadow-button-hover"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : submitted ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Redirecting to Dashboard...
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