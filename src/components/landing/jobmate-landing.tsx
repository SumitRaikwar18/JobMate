import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  Palette,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const telegramUrl = "https://t.me/jobmate_bot";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex shrink-0 items-center gap-2" aria-label="JobMate home">
      <span className={cn("grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-button", compact ? "size-8" : "size-9")}>
        <FileCheck2 className={compact ? "size-4" : "size-5"} />
      </span>
      <span className="text-lg font-bold text-foreground">Job<span className="text-primary">Mate</span></span>
    </Link>
  );
}

const navItems = [
  { label: "Home", to: "/" as const },
  { label: "Templates", to: "/templates" as const },
  { label: "Features", to: "/" as const, hash: "features" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <nav className="page-shell flex h-17 items-center justify-between" aria-label="Main navigation">
        <Logo />
        <div className="hidden items-stretch gap-8 self-stretch md:flex">
          {navItems.map((item, index) => (
            <Link key={item.label} to={item.to} {...(item.hash ? { hash: item.hash } : {})} className={cn("relative flex items-center text-sm font-medium transition-colors hover:text-primary", index === 0 ? "text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground")}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className={cn(buttonVariants({ variant: "pill", size: "sm" }), "shadow-xs font-semibold px-4")}
          >
            Get Started Free
          </Link>
        </div>
        <Button
          variant="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>
      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                {...(item.hash ? { hash: item.hash } : {})}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-border/70">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "primary" }), "w-full justify-center")}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-14 lg:pb-24">
      {/* Background Soft Ambient Light */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full bg-soft-blue/60 blur-[110px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 size-[450px] rounded-full bg-soft-purple/40 blur-[130px]" />

      <div className="page-shell relative z-10 mx-auto max-w-4xl text-center">
        {/* Top Floating Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-soft-blue/80 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs backdrop-blur-sm">
          <Sparkles className="size-3.5 text-primary" />
          <span>AI-Powered Career & Resume Platform</span>
        </div>

        {/* Catchy Centered Headline */}
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl sm:leading-[1.12]">
          Build Your ATS-Optimized Resume{" "}
          <span className="block mt-1.5 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tailored to Any Job in Minutes
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Transform your career journey with AI. Instantly match job descriptions, optimize ATS keywords, and create recruiter-approved resumes through our web dashboard or mobile Telegram bot.
        </p>

        {/* Action Buttons */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          <Link
            to="/dashboard"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto shadow-button hover:shadow-button-hover")}
          >
            Start Building Free <ArrowRight className="size-4" />
          </Link>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
          >
            <Send className="size-4 text-[#229ED9]" /> Try on Telegram
          </a>
        </div>

        {/* Trust & Highlight Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground sm:text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-4 text-primary" /> 99% ATS Pass Rate
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="size-4 text-primary" /> 100% Free to Start
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Bot className="size-4 text-primary" /> Web & Telegram Sync
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock3 className="size-4 text-primary" /> Ready in 2 Minutes
          </span>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Target,
    badge: "AI Matching",
    title: "AI-Powered & Smart",
    description: "Get tailored bullet points and keyword recommendations customized for your target job description and skill profile.",
    perk: "Smart keyword auto-extraction",
  },
  {
    icon: ShieldCheck,
    badge: "99% ATS Pass",
    title: "ATS Optimized",
    description: "Clean, machine-readable structures formatted to breeze through Applicant Tracking Systems like Greenhouse, Lever & Workday.",
    perk: "Zero formatting or parse errors",
  },
  {
    icon: MessageCircle,
    badge: "Web & Telegram",
    title: "Chat With JobMate",
    description: "Create, revise, and polish your resume seamlessly through natural chat on our web dashboard or mobile Telegram bot.",
    perk: "24/7 AI Career Assistant",
  },
  {
    icon: CheckCircle2,
    badge: "Real-Time Audit",
    title: "Live ATS Scoring",
    description: "Instant score breakdown analyzing keyword density, action verbs, and formatting health before submitting your application.",
    perk: "Instant actionable score report",
  },
  {
    icon: BriefcaseBusiness,
    badge: "Recruiter Approved",
    title: "Professional Templates",
    description: "Choose from Modern, Classic, Minimal, Executive, and Tech formats designed by hiring managers for real jobs.",
    perk: "1-Click layout switching",
  },
  {
    icon: Zap,
    badge: "Zero Commitment",
    title: "Free to Start",
    description: "Start building, tailoring, and exporting your first resume completely free. No credit card, watermarks, or hidden paywalls.",
    perk: "Instant PDF & DOCX export",
  },
];

function SectionIntro({
  badge,
  title,
  children,
}: {
  badge?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {badge && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Sparkles className="size-3.5" />
          {badge}
        </div>
      )}
      <h2 className="section-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </p>
    </div>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="page-shell">
        <SectionIntro
          badge="Next-Gen Career Tools"
          title="Why Choose JobMate?"
        >
          Everything you need to build an ATS-compliant resume, optimize for target roles, and get interview-ready faster.
        </SectionIntro>

        {/* Perfectly Balanced 6-Card Grid (3x2 on desktop, 2x3 on tablet, 1x6 on mobile) */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, badge, title, description, perk }) => (
            <article
              key={title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-background p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-card-hover"
            >
              {/* Subtle card top glow */}
              <div className="absolute -top-10 left-1/2 size-24 -translate-x-1/2 rounded-full bg-primary/5 blur-xl transition-all duration-300 group-hover:bg-primary/10" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-soft-blue text-primary shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-section px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 text-xs font-semibold text-primary">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <span>{perk}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const templatesData = [
  {
    name: "Modern",
    tag: "Most Popular",
    render: () => (
      <div className="h-full space-y-2 p-3 text-[7px] leading-tight select-none bg-background">
        {/* Modern Top Header Accent */}
        <div className="border-b border-border/80 pb-1.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-foreground leading-none">Alex Jordan</h4>
              <p className="mt-0.5 text-[7.5px] font-semibold text-primary">Senior Frontend Engineer</p>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[6.5px] font-bold text-primary">99% ATS</span>
          </div>
          <p className="mt-1 text-[6px] text-muted-foreground">San Francisco, CA • alex@jobmate.ai • github.com/alexj</p>
        </div>

        {/* Professional Summary */}
        <div>
          <p className="font-bold uppercase tracking-wider text-[6px] text-primary">Summary</p>
          <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
            Frontend Engineer with 6+ years building high-throughput web apps, performant design systems, and seamless checkout experiences.
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <p className="font-bold uppercase tracking-wider text-[6px] text-primary">Experience</p>
          <div>
            <div className="flex justify-between font-semibold text-foreground text-[7px]">
              <span>Lead Frontend Engineer · Stripe</span>
              <span className="text-muted-foreground text-[6px]">2022 — Present</span>
            </div>
            <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
              • Led checkout UI revamp, improving conversion rates by 18% across 1.2M daily transactions.
            </p>
            <p className="text-[6px] text-muted-foreground leading-snug">
              • Reduced core web vitals LCP by 42% via lazy asset loading.
            </p>
          </div>
          <div>
            <div className="flex justify-between font-semibold text-foreground text-[7px]">
              <span>Software Engineer · Vercel</span>
              <span className="text-muted-foreground text-[6px]">2020 — 2022</span>
            </div>
            <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
              • Built reusable dashboard components and trimmed CI/CD build times by 35%.
            </p>
          </div>
        </div>

        {/* Skills Chips */}
        <div>
          <p className="font-bold uppercase tracking-wider text-[6px] text-primary">Core Skills</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {["React 19", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL", "Jest"].map((skill) => (
              <span key={skill} className="rounded bg-section px-1.5 py-0.5 text-[5.5px] font-medium text-foreground border border-border/50">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="border-t border-border/60 pt-1 flex justify-between text-[6px]">
          <span className="font-semibold text-foreground">B.S. Computer Science · UC Berkeley</span>
          <span className="text-muted-foreground">GPA 3.9 · Honors</span>
        </div>
      </div>
    ),
  },
  {
    name: "Classic",
    tag: "ATS Standard",
    render: () => (
      <div className="h-full space-y-2 p-3 text-[7px] leading-tight select-none font-serif bg-background">
        {/* Centered Classic Header */}
        <div className="text-center border-b border-foreground/30 pb-1.5">
          <h4 className="text-[11px] font-bold tracking-widest text-foreground uppercase">Alex Jordan</h4>
          <p className="text-[6.5px] text-muted-foreground font-sans mt-0.5">
            alex@jobmate.ai | (555) 382-9102 | New York, NY | linkedin.com/in/alexj
          </p>
        </div>

        {/* Summary */}
        <div className="font-sans">
          <p className="font-serif font-bold text-[6.5px] uppercase tracking-wider border-b border-border/70 pb-0.5 text-foreground">
            Professional Summary
          </p>
          <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
            Strategic Product Manager with 6+ years delivering high-impact SaaS growth, cross-functional roadmap execution, and enterprise customer satisfaction.
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1.5 font-sans">
          <p className="font-serif font-bold text-[6.5px] uppercase tracking-wider border-b border-border/70 pb-0.5 text-foreground">
            Professional Experience
          </p>
          <div>
            <div className="flex justify-between text-[7px] font-bold text-foreground">
              <span>Senior Product Manager — Microsoft</span>
              <span className="text-[6px] font-normal text-muted-foreground">2021 – Present</span>
            </div>
            <p className="text-[6px] text-muted-foreground mt-0.5 leading-snug">
              • Spearheaded enterprise cloud adoption, generating $14M in net-new ARR.
            </p>
            <p className="text-[6px] text-muted-foreground leading-snug">
              • Managed 18-person sprint team across engineering, design, and QA.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[7px] font-bold text-foreground">
              <span>Associate PM — Atlassian</span>
              <span className="text-[6px] font-normal text-muted-foreground">2018 – 2021</span>
            </div>
            <p className="text-[6px] text-muted-foreground mt-0.5 leading-snug">
              • Launched Jira integrations used by over 350k active organizations worldwide.
            </p>
          </div>
        </div>

        {/* Skills */}
        <div className="font-sans">
          <p className="font-serif font-bold text-[6.5px] uppercase tracking-wider border-b border-border/70 pb-0.5 text-foreground">
            Key Competencies
          </p>
          <p className="mt-0.5 text-[6px] text-muted-foreground">
            Product Strategy • Roadmapping • Agile Scrum • User Discovery • SQL & Data Analytics
          </p>
        </div>

        {/* Education */}
        <div className="font-sans border-t border-border/70 pt-1 flex justify-between text-[6px]">
          <span className="font-bold text-foreground">B.A. Economics — Columbia University</span>
          <span className="text-muted-foreground">Magna Cum Laude</span>
        </div>
      </div>
    ),
  },
  {
    name: "Minimal",
    tag: "Clean & Simple",
    render: () => (
      <div className="h-full space-y-2 p-3 text-[7px] leading-tight select-none bg-background">
        {/* Minimal Swiss Header */}
        <div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-[11px] font-black tracking-tight text-foreground">Alex Jordan</h4>
            <span className="text-[6px] font-mono text-muted-foreground">01 / RESUME</span>
          </div>
          <p className="text-[7px] font-medium text-muted-foreground mt-0.5">Senior Product Designer · San Francisco</p>
          <div className="mt-1 h-[1px] w-full bg-foreground/15" />
        </div>

        {/* Profile */}
        <div>
          <p className="font-mono text-[6px] uppercase text-muted-foreground">02 / PROFILE</p>
          <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
            Specializing in scalable design systems, micro-interactions, and complex enterprise software workflows.
          </p>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <p className="font-mono text-[6px] uppercase text-muted-foreground">03 / EXPERIENCE</p>
          <div>
            <div className="flex justify-between text-[7px] font-bold text-foreground">
              <span>Lead Designer · Figma</span>
              <span className="text-[6px] font-mono text-muted-foreground">2023 — NOW</span>
            </div>
            <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
              • Redesigned real-time canvas tools used by 4M+ daily creators worldwide.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[7px] font-bold text-foreground">
              <span>Product Designer · Linear</span>
              <span className="text-[6px] font-mono text-muted-foreground">2021 — 2023</span>
            </div>
            <p className="mt-0.5 text-[6px] text-muted-foreground leading-snug">
              • Built keyboard-first issue workflow, cutting ticket triage time by 40%.
            </p>
          </div>
        </div>

        {/* Expertise Grid */}
        <div>
          <p className="font-mono text-[6px] uppercase text-muted-foreground">04 / EXPERTISE</p>
          <p className="mt-0.5 text-[6px] font-medium text-foreground">
            Design Systems • User Research • Rapid Prototyping • React & CSS
          </p>
        </div>

        {/* Education */}
        <div className="border-t border-border/60 pt-1 flex justify-between text-[6px]">
          <span className="font-bold text-foreground">B.Des Interactive Media</span>
          <span className="text-muted-foreground font-mono">RISD · 2021</span>
        </div>
      </div>
    ),
  },
  {
    name: "Professional",
    tag: "Executive",
    render: () => (
      <div className="grid h-full grid-cols-[32%_68%] overflow-hidden text-[7px] select-none bg-background">
        {/* Left Dark Sidebar */}
        <div className="flex flex-col justify-between bg-slate-900 p-2.5 text-white">
          <div className="space-y-2">
            <div>
              <div className="grid size-6 place-items-center rounded-full bg-white/20 font-bold text-[8px]">AJ</div>
              <h4 className="mt-1.5 text-[8px] font-bold leading-none text-white">Alex Jordan</h4>
              <p className="text-[5.5px] text-slate-300 mt-0.5">VP of Marketing</p>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/10">
              <p className="text-[5.5px] font-bold uppercase text-blue-400">Contact</p>
              <p className="text-[5px] text-slate-300">alex@jobmate.ai</p>
              <p className="text-[5px] text-slate-300">(555) 234-8901</p>
              <p className="text-[5px] text-slate-300">New York, NY</p>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/10">
              <p className="text-[5.5px] font-bold uppercase text-blue-400">Core Skills</p>
              <div className="space-y-0.5 text-[5px] text-slate-300">
                <p>• Growth Strategy</p>
                <p>• Brand Positioning</p>
                <p>• Demand Gen & P&L</p>
                <p>• Global Expansion</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-1 text-[5px] text-slate-400">
            MBA · Wharton School
          </div>
        </div>

        {/* Right Content */}
        <div className="flex flex-col justify-between p-2.5 text-foreground space-y-1.5">
          <div>
            <p className="text-[6px] font-bold uppercase tracking-wider text-primary">Executive Summary</p>
            <p className="mt-0.5 text-[5.5px] text-muted-foreground leading-snug">
              Visionary marketing executive with 10+ years driving global market expansion and scaling ARR from $12M to $90M+.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[6px] font-bold uppercase tracking-wider text-primary">Leadership History</p>
            <div>
              <div className="flex justify-between text-[6.5px] font-bold text-foreground">
                <span>VP of Growth · Datadog</span>
                <span className="text-[5.5px] text-muted-foreground font-normal">2021—Now</span>
              </div>
              <p className="text-[5.5px] text-muted-foreground leading-snug mt-0.5">
                • Built 40-person marketing unit, delivering 120% YoY organic customer growth.
              </p>
              <p className="text-[5.5px] text-muted-foreground leading-snug">
                • Decreased blended customer acquisition cost (CAC) by 27%.
              </p>
            </div>
            <div>
              <div className="flex justify-between text-[6.5px] font-bold text-foreground">
                <span>Head of Marketing · Segment</span>
                <span className="text-[5.5px] text-muted-foreground font-normal">2017—2021</span>
              </div>
              <p className="text-[5.5px] text-muted-foreground leading-snug mt-0.5">
                • Executed PLG motions generating $26M in pipeline.
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 pt-1 flex justify-between text-[5.5px] text-muted-foreground">
            <span>ATS Compliant Format</span>
            <span>B.A. Economics · Harvard</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: "Creative",
    tag: "Tech & AI",
    render: () => (
      <div className="h-full space-y-2 p-3 text-[7px] leading-tight select-none bg-background">
        {/* Creative Top Gradient Bar */}
        <div>
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mb-1.5" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black text-foreground leading-none">Alex Jordan</h4>
              <p className="text-[7px] font-semibold text-indigo-600 mt-0.5">AI & Machine Learning Engineer</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[6px] font-bold text-indigo-600 border border-indigo-200">
              Verified
            </span>
          </div>
          <p className="text-[5.5px] text-muted-foreground mt-0.5">alex@jobmate.ai • github.com/alex-ml • San Francisco</p>
        </div>

        {/* Featured Projects */}
        <div className="space-y-1">
          <p className="text-[6px] font-bold uppercase tracking-wider text-indigo-600">Featured Projects</p>
          <div className="rounded bg-section p-1.5 border border-indigo-100">
            <div className="flex justify-between text-[6.5px] font-bold text-foreground">
              <span>Autonomous LLM Agent Framework</span>
              <span className="text-[5.5px] text-indigo-600 font-semibold">14k ★ GitHub</span>
            </div>
            <p className="text-[5.5px] text-muted-foreground mt-0.5 leading-snug">
              • Engineered parallel agent pipeline, slashing inference latency by 45%.
            </p>
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-1">
          <p className="text-[6px] font-bold uppercase tracking-wider text-indigo-600">Work Experience</p>
          <div>
            <div className="flex justify-between text-[6.5px] font-bold text-foreground">
              <span>Senior AI Engineer · Anthropic</span>
              <span className="text-[5.5px] text-muted-foreground">2023 — Now</span>
            </div>
            <p className="text-[5.5px] text-muted-foreground leading-snug mt-0.5">
              • Fine-tuned multi-modal LLMs achieving 99.1% benchmark precision.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[6.5px] font-bold text-foreground">
              <span>ML Engineer · DeepMind</span>
              <span className="text-[5.5px] text-muted-foreground">2020 — 2023</span>
            </div>
            <p className="text-[5.5px] text-muted-foreground leading-snug mt-0.5">
              • Deployed transformer inference engine scaling to 50M requests/day.
            </p>
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div>
          <p className="text-[6px] font-bold uppercase tracking-wider text-indigo-600">Tech Stack</p>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {["Python", "PyTorch", "CUDA", "FastAPI", "Docker", "vLLM"].map((tech) => (
              <span key={tech} className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[5.5px] font-semibold text-indigo-600">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="border-t border-border/60 pt-1 flex justify-between text-[5.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">M.S. Artificial Intelligence · Stanford University</span>
          <span>GPA 4.0</span>
        </div>
      </div>
    ),
  },
];

function TemplatesSection() {
  return (
    <section className="bg-section py-20 lg:py-24">
      <div className="page-shell">
        <SectionIntro title="Beautiful Resume Templates">
          Choose from professional, meticulously crafted templates designed to pass ATS filters and impress recruiters.
        </SectionIntro>

        <div className="-mx-4 mt-12 flex snap-x gap-5 overflow-x-auto px-4 pb-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
          {templatesData.map(({ name, tag, render: TemplateView }) => (
            <article key={name} className="group w-[230px] shrink-0 snap-center sm:w-auto">
              {/* Resume Card Container */}
              <div className="relative aspect-[0.73] overflow-hidden rounded-xl border border-border bg-background shadow-card transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-primary/40 group-hover:shadow-card-hover">
                {/* Template Render */}
                <TemplateView />

                {/* Subtle Hover Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                  <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-button">
                    Use Template
                  </span>
                </div>
              </div>

              {/* Template Label & Tag */}
              <div className="mt-3 flex items-center justify-between px-1">
                <p className="text-xs font-bold text-foreground">{name}</p>
                <span className="rounded bg-soft-blue px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {tag}
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ✨ Every template strictly follows ATS standards with clean formatting and customizable sections.
        </p>
      </div>
    </section>
  );
}

function AccessCard({ type }: { type: "dashboard" | "telegram" }) {
  const dashboard = type === "dashboard";
  const bullets = dashboard
    ? [
        "Interactive resume editor with live split-view preview",
        "1-Click job description tailoring & keyword matching",
        "Download ATS-optimized PDF & DOCX formats",
        "Application tracking & multi-version management",
      ]
    : [
        "Quick login with seamless phone OTP verification",
        "Chat directly with JobMate AI assistant on mobile",
        "Upload current resume or paste job descriptions",
        "Instant ATS suggestions & tailored resume generation",
      ];

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-card-hover">
      <div className="grid sm:grid-cols-12">
        {/* Left Content Column */}
        <div className="flex flex-col justify-between p-6 sm:col-span-6 sm:p-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-11 place-items-center rounded-xl bg-soft-blue text-primary shadow-xs">
                {dashboard ? <LayoutDashboard className="size-5" /> : <Send className="size-5" />}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-soft-blue/80 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Sparkles className="size-3" />
                {dashboard ? "Web Platform" : "Telegram Bot"}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">
              {dashboard ? "Web Dashboard" : "Telegram Assistant"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {dashboard
                ? "Full control with a clean, powerful and minimal interface."
                : "Chat with JobMate anytime, anywhere right from Telegram."}
            </p>

            <ul className="mt-5 space-y-2">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-soft-blue text-primary">
                    <Check className="size-2.5 stroke-[2.5]" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-1">
            {dashboard ? (
              <Link to="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "w-full justify-center sm:w-auto")}>
                Go to Dashboard <ArrowRight className="size-4" />
              </Link>
            ) : (
              <a href={telegramUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "primary" }), "w-full justify-center sm:w-auto")}>
                Start on Telegram <ArrowRight className="size-4" />
              </a>
            )}
          </div>
        </div>

        {/* Right Visual Column (Clean Minimalist Native UI Mockup) */}
        <div className="flex items-center justify-center bg-section/70 p-5 sm:col-span-6 sm:p-6">
          {dashboard ? (
            /* Minimalist Dashboard Preview */
            <div className="w-full space-y-2.5 rounded-xl border border-border bg-background p-4 shadow-sm select-none">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-bold text-foreground">AI Resume Editor</span>
                </div>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  98% ATS Match
                </span>
              </div>

              {/* Progress & Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-section p-2">
                  <p className="text-[8px] text-muted-foreground">Target Role</p>
                  <p className="text-[10px] font-bold text-foreground truncate">Senior Software Eng</p>
                </div>
                <div className="rounded-lg bg-soft-blue/60 p-2">
                  <p className="text-[8px] text-primary">Keywords Matched</p>
                  <p className="text-[10px] font-bold text-primary">18 / 18 Found</p>
                </div>
              </div>

              {/* Real-time AI Suggestion */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-[9px] text-primary">
                <div className="flex items-center gap-1 font-semibold">
                  <Sparkles className="size-3" />
                  <span>AI Recommendation Applied</span>
                </div>
                <p className="mt-0.5 text-[8px] text-muted-foreground leading-snug">
                  Added high-impact action verbs and quantified accomplishments for 25% higher callback rate.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[8px] text-muted-foreground">Version: v2.4 (Saved)</span>
                <span className="rounded-md bg-primary px-2 py-1 text-[8px] font-semibold text-primary-foreground">
                  1-Click Tailor
                </span>
              </div>
            </div>
          ) : (
            /* Minimalist Telegram Bot Chat Widget */
            <div className="w-full space-y-2.5 rounded-xl border border-border bg-background p-4 shadow-sm select-none">
              {/* Telegram Header */}
              <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                <span className="grid size-6 place-items-center rounded-full bg-[#229ED9] text-white">
                  <Send className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-foreground">JobMate AI Bot</p>
                  <p className="text-[7.5px] text-success flex items-center gap-1">
                    <span className="size-1 rounded-full bg-success" /> online
                  </p>
                </div>
              </div>

              {/* Chat Bubble: User */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg rounded-br-none bg-primary px-2.5 py-1.5 text-[8.5px] leading-relaxed text-primary-foreground">
                  Tailor my resume for Product Manager at Stripe 🚀
                </div>
              </div>

              {/* Chat Bubble: Bot Response */}
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-lg rounded-bl-none bg-section px-2.5 py-1.5 text-[8.5px] leading-relaxed text-foreground shadow-xs">
                  <p className="font-semibold text-primary text-[8px] flex items-center gap-1">
                    <Sparkles className="size-2.5" /> Optimization Complete!
                  </p>
                  <p className="mt-0.5 text-[8px] text-muted-foreground">
                    ATS Score boosted to <span className="font-bold text-foreground">97%</span>. Tailored 4 key achievements.
                  </p>
                  <div className="mt-1.5 flex items-center justify-between rounded bg-background p-1.5 border border-border">
                    <span className="text-[7.5px] font-semibold text-foreground truncate">📄 Resume_Stripe_PM.pdf</span>
                    <span className="text-[7.5px] font-bold text-primary">Download</span>
                  </div>
                </div>
              </div>

              {/* Mini Input Box */}
              <div className="flex items-center gap-1.5 rounded-md bg-section px-2 py-1 text-[8px] text-muted-foreground border border-border/60">
                <span className="flex-1 truncate">Type a message or upload JD...</span>
                <Send className="size-2.5 text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AccessSection() {
  return (
    <section className="bg-background py-20 lg:py-24">
      <div className="page-shell">
        <SectionIntro title="Access JobMate Your Way">
          Get started the way you prefer — use our web dashboard or simply chat with JobMate on Telegram.
        </SectionIntro>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AccessCard type="dashboard" />
          <AccessCard type="telegram" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return <footer className="border-t border-border bg-background py-8"><div className="page-shell flex flex-col items-center gap-6 text-center md:flex-row md:text-left"><Logo compact /><nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 md:ml-auto">{navItems.map((item) => <Link key={item.label} to={item.to} {...(item.hash ? { hash: item.hash } : {})} className="text-xs text-muted-foreground hover:text-primary">{item.label}</Link>)}</nav><p className="text-xs text-muted-foreground md:ml-auto">© 2026 JobMate. All rights reserved.</p></div></footer>;
}

export function JobMateLanding() {
  return <><Navbar /><main><Hero /><FeatureSection /><TemplatesSection /><AccessSection /></main><Footer /></>;
}