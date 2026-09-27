import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileCode,
  FilePlus2,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase, type UserProfile, type Resume, type Job } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { analyzeJobDescriptionWithAI } from "@/lib/ai/resume-agent";
import { generateLatexResumeSource } from "@/lib/latex/latex-generator";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — JobMate AI" },
      { name: "description", content: "Build, tailor, and optimize your ATS resumes with AI." },
      { property: "og:title", content: "Dashboard — JobMate AI" },
      { property: "og:description", content: "Manage your resumes, track match scores, and sync with Telegram." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"resumes" | "jobs" | "profile" | "telegram">("resumes");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // User Dropdown Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // New Resume Modal State
  const [isCreateResumeOpen, setIsCreateResumeOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [newResumeRole, setNewResumeRole] = useState("");
  const [newResumeCompany, setNewResumeCompany] = useState("");
  const [newResumeTemplate, setNewResumeTemplate] = useState("modern-clean");
  const [creatingResume, setCreatingResume] = useState(false);

  // Job Matcher State
  const [jdTitle, setJdTitle] = useState("");
  const [jdCompany, setJdCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [analyzingJd, setAnalyzingJd] = useState(false);

  // Profile Edit State
  const [editFullName, setEditFullName] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editTargetRole, setEditTargetRole] = useState("");
  const [editExperience, setEditExperience] = useState<number | "">("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Close User Menu on Outside Click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Resumes and Jobs from Supabase
  const fetchData = async (userId: string) => {
    setLoadingData(true);
    try {
      const [resumesRes, jobsRes] = await Promise.all([
        supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (resumesRes.data) {
        setResumes(resumesRes.data as Resume[]);
      }
      if (jobsRes.data) {
        setJobs(jobsRes.data as Job[]);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditFullName(profile.full_name || "");
      setEditHeadline(profile.headline || "");
      setEditTargetRole(profile.target_role || "");
      setEditExperience(profile.years_of_experience ?? "");
      setEditGithub(profile.github_url || "");
      setEditLinkedin(profile.linkedin_url || "");
      setEditTelegram(profile.telegram_handle || "");
    }
  }, [profile]);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    toast.success("Signed out successfully.");
    router.navigate({ to: "/" });
  };

  // Create Resume in Supabase
  const handleCreateResume = async (e?: React.FormEvent, customData?: { title: string; role: string; summary: string; skills: any; experiences: any[] }) => {
    if (e) e.preventDefault();
    if (!user) return;

    const title = customData?.title || newResumeTitle.trim();
    const role = customData?.role || newResumeRole.trim() || profile?.target_role || "Software Engineer";
    const company = newResumeCompany.trim() || null;

    if (!title) {
      toast.error("Please provide a resume title.");
      return;
    }

    setCreatingResume(true);
    try {
      const initialScore = 88;
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title,
          target_role: role,
          target_company: company,
          template_id: newResumeTemplate,
          ats_score: initialScore,
          is_primary: resumes.length === 0,
          resume_data: {
            personal: {
              name: profile?.full_name || user.email?.split("@")[0] || "Candidate",
              email: user.email,
              role,
              github: profile?.github_url || "https://github.com",
              linkedin: profile?.linkedin_url || "https://linkedin.com",
            },
            summary: customData?.summary || "Results-driven engineer focused on building scalable, performant web applications and high-impact software solutions.",
            skills: customData?.skills || {
              languages: ["TypeScript", "JavaScript", "Python", "SQL"],
              frameworks: ["React 19", "Next.js", "Node.js", "FastAPI"],
              tools: ["Git", "Docker", "PostgreSQL", "Supabase"],
              softSkills: ["System Design", "Agile Execution", "Mentorship"],
            },
            experiences: customData?.experiences || [
              {
                id: "1",
                role: role,
                company: company || "Tech Innovations Inc.",
                location: "Remote",
                startDate: "2023",
                endDate: "Present",
                current: true,
                bullets: [
                  "Architected core modules processing high-throughput requests with 99.9% uptime.",
                  "Reduced latency by 35% through query caching, indexing, and connection pooling.",
                  "Collaborated with cross-functional squads to deliver client-facing features on schedule.",
                ],
              },
            ],
            projects: [
              {
                id: "p1",
                name: "AI Evidence Agent",
                technologies: "Python, FastAPI, TypeScript, PostgreSQL",
                link: "https://github.com",
                bullets: [
                  "Engineered an automated agent pipeline with structured outputs and deterministic guardrails.",
                  "Added regression test suites achieving 90%+ branch coverage.",
                ],
              },
            ],
            education: [
              {
                id: "e1",
                degree: "B.Tech in Computer Science & Engineering",
                institution: "Institute of Engineering & Technology",
                location: "India",
                startDate: "2022",
                endDate: "2026",
                score: "GPA: 8.8 / 10",
              },
            ],
          },
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create resume: " + error.message);
        return;
      }

      if (data) {
        setResumes([data as Resume, ...resumes]);
        toast.success(`Resume "${title}" created! Opening builder...`);
        setIsCreateResumeOpen(false);
        setNewResumeTitle("");
        setNewResumeRole("");
        setNewResumeCompany("");
        router.navigate({ to: "/builder", search: { resumeId: data.id } as any });
      }
    } catch (err: any) {
      toast.error("Error creating resume: " + err.message);
    } finally {
      setCreatingResume(false);
    }
  };

  // Quick Starter Templates
  const handleQuickTemplate = (type: "ai" | "fullstack" | "backend") => {
    if (type === "ai") {
      handleCreateResume(undefined, {
        title: "AI Engineer & Agentic Systems",
        role: "Applied AI Engineer",
        summary: "Applied AI Engineer building production-grade LLM applications, multi-agent workflows, and deterministic guardrails using Python, FastAPI, LangGraph, and TypeScript.",
        skills: {
          languages: ["Python", "TypeScript", "SQL"],
          frameworks: ["LangGraph", "LangChain", "FastAPI", "React", "Next.js"],
          tools: ["Docker", "PostgreSQL", "Supabase", "OpenRouter", "Git"],
          softSkills: ["AI Reliability", "System Architecture", "Adversarial Testing"],
        },
        experiences: [
          {
            id: "1",
            role: "Applied AI Developer",
            company: "Agentic Systems Lab",
            location: "Remote",
            startDate: "2024",
            endDate: "Present",
            current: true,
            bullets: [
              "Built server-side agent workflows with structured outputs, schema validation, and deterministic fallbacks.",
              "Implemented prompt-injection guardrails and anti-hallucination verification loops, reducing output error rate by 42%.",
              "Integrated async vector retrieval and PostgreSQL analytics across full-stack Next.js applications.",
            ],
          },
        ],
      });
    } else if (type === "fullstack") {
      handleCreateResume(undefined, {
        title: "Full-Stack Web Developer",
        role: "Full Stack Engineer",
        summary: "Full Stack Developer with experience in React 19, TypeScript, Node.js, and PostgreSQL. Proven track record in shipping accessible UI systems and scalable REST APIs.",
        skills: {
          languages: ["TypeScript", "JavaScript", "SQL", "HTML/CSS"],
          frameworks: ["React 19", "Next.js", "Node.js", "Express", "Tailwind CSS"],
          tools: ["PostgreSQL", "Supabase", "Git", "Docker", "Vite"],
          softSkills: ["Clean Architecture", "Code Reviews", "Agile Execution"],
        },
        experiences: [
          {
            id: "1",
            role: "Full Stack Developer",
            company: "WebScale Solutions",
            location: "Remote",
            startDate: "2023",
            endDate: "Present",
            current: true,
            bullets: [
              "Architected responsive dashboard modules with React and Tailwind CSS, improving Core Web Vitals by 30%.",
              "Engineered authenticated REST microservices backed by PostgreSQL with Row Level Security (RLS).",
              "Implemented CI/CD automated test suites covering unit and end-to-end integration flows.",
            ],
          },
        ],
      });
    } else {
      handleCreateResume(undefined, {
        title: "Backend Distributed Systems",
        role: "Backend Engineer",
        summary: "Backend Engineer specialized in high-throughput architectures, microservices, and database optimization using Go, Python, Kafka, and PostgreSQL.",
        skills: {
          languages: ["Go", "Python", "SQL", "C++"],
          frameworks: ["FastAPI", "Gin", "gRPC", "Kafka"],
          tools: ["PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS"],
          softSkills: ["Distributed Consensus", "High Availability", "Performance Tuning"],
        },
        experiences: [
          {
            id: "1",
            role: "Backend Engineer",
            company: "CloudScale Infra",
            location: "Remote",
            startDate: "2023",
            endDate: "Present",
            current: true,
            bullets: [
              "Engineered event-driven pipeline processing 200k events/sec with Go and Apache Kafka.",
              "Optimized database connection pools and caching layers, cutting query latency by 45%.",
              "Containerized microservices with Docker and deployed resilient zero-downtime rolling updates.",
            ],
          },
        ],
      });
    }
  };

  // Delete Resume
  const handleDeleteResume = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete resume: " + error.message);
        return;
      }
      setResumes(resumes.filter((r) => r.id !== id));
      toast.success("Resume deleted.");
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  // Export & Download LaTeX Source
  const handleDownloadResumeLatex = (resume: Resume) => {
    try {
      const data = (resume.resume_data || {}) as any;
      const latex = generateLatexResumeSource({
        personal: {
          name: data.personal?.name || profile?.full_name || user?.email?.split("@")[0] || "Candidate",
          headline: resume.target_role || data.personal?.role,
          email: data.personal?.email || user?.email || "",
          phone: data.personal?.phone || "",
          location: data.personal?.location || "",
          linkedin: data.personal?.linkedin || profile?.linkedin_url,
          github: data.personal?.github || profile?.github_url,
          portfolio: data.personal?.portfolio,
        },
        summary: data.summary,
        skills: data.skills || {},
        experiences: data.experiences || [],
        projects: data.projects || [],
        education: data.education || [],
      });

      const blob = new Blob([latex], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resume.title.toLowerCase().replace(/\s+/g, "_")}_ats.tex`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ATS LaTeX (.tex) for "${resume.title}"!`);
    } catch (err: any) {
      toast.error("Failed to export LaTeX: " + err.message);
    }
  };

  // Analyze Job Description with AI
  const handleAnalyzeJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!jdTitle.trim() || !jdText.trim()) {
      toast.error("Please enter job title and job description.");
      return;
    }

    setAnalyzingJd(true);
    try {
      const primaryResume = resumes.find((r) => r.is_primary) || resumes[0];
      const resumeSkills: string[] = primaryResume?.resume_data?.skills
        ? [
            ...(primaryResume.resume_data.skills.languages || []),
            ...(primaryResume.resume_data.skills.frameworks || []),
            ...(primaryResume.resume_data.skills.tools || []),
          ]
        : ["React", "TypeScript", "Node.js", "SQL", "Git", "REST APIs"];

      const aiAnalysis = await analyzeJobDescriptionWithAI(jdText.trim(), resumeSkills);

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          title: jdTitle.trim() || aiAnalysis.roleTitle,
          company: jdCompany.trim() || aiAnalysis.company || "Target Employer",
          description: jdText.trim(),
          required_skills: aiAnalysis.extractedSkills,
          match_score: aiAnalysis.matchScore,
          match_details: {
            matching_skills: aiAnalysis.matchedSkills,
            missing_skills: aiAnalysis.missingSkills,
            recommendations: aiAnalysis.atsRecommendations,
            responsibilities: aiAnalysis.keyResponsibilities,
          },
          status: "saved",
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to save analyzed job: " + error.message);
        return;
      }

      if (data) {
        setJobs([data as Job, ...jobs]);
        toast.success(`AI Job Analysis Complete! Match Score: ${aiAnalysis.matchScore}%`);
        setJdTitle("");
        setJdCompany("");
        setJdText("");
      }
    } catch (err: any) {
      toast.error("Error analyzing JD: " + err.message);
    } finally {
      setAnalyzingJd(false);
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editFullName.trim(),
          headline: editHeadline.trim(),
          target_role: editTargetRole.trim(),
          years_of_experience: editExperience === "" ? null : Number(editExperience),
          github_url: editGithub.trim(),
          linkedin_url: editLinkedin.trim(),
          telegram_handle: editTelegram.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to update profile: " + error.message);
        return;
      }

      await refreshProfile();
      toast.success("Candidate Profile updated successfully!");
    } catch (err: any) {
      toast.error("Error saving profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Loading State Screen
  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-3 border-primary border-t-transparent shadow-xs" />
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">
            Loading your JobMate workspace...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Fallback
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-card">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-foreground">Sign In to JobMate</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Please log in with your email to view your resumes, track job matches, and use the AI resume generator.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "default" }), "w-full rounded-xl py-2.5 text-xs font-bold")}
            >
              Sign In / Create Account
            </Link>
            <Link
              to="/"
              className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-xl py-2.5 text-xs font-semibold")}
            >
              <ArrowLeft className="size-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="JobMate Home">
              <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-primary-foreground shadow-button transition-transform group-hover:scale-105">
                <FileCheck2 className="size-4.5" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Job<span className="text-primary">Mate</span>
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace</span>
            </span>
          </div>

          {/* Right Action Bar & User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/builder"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "hidden sm:inline-flex h-8 gap-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-button"
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Live AI Studio</span>
            </Link>

            {/* Interactive User Profile Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-border/80 bg-background p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isUserMenuOpen && "border-primary ring-2 ring-primary/20 bg-muted/60"
                )}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-tr from-indigo-500 to-primary text-[11px] font-extrabold text-white shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight truncate max-w-[130px]">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">{user.email}</span>
                </div>
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isUserMenuOpen && "rotate-180 text-primary")} />
              </button>

              {/* Dropdown Content */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-background p-1.5 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* Dropdown User Info Header */}
                  <div className="px-3 py-2.5 border-b border-border/60 bg-muted/30 rounded-xl mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-tr from-indigo-500 to-primary text-xs font-extrabold text-white">
                        {userInitials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {profile?.target_role && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Target className="size-2.5" />
                        <span className="truncate">{profile.target_role}</span>
                      </span>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("resumes");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="size-3.5 text-indigo-500" />
                        <span>My Resumes</span>
                      </span>
                      <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.2 font-bold">{resumes.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("jobs");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase className="size-3.5 text-emerald-500" />
                        <span>JD Matcher</span>
                      </span>
                      <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.2 font-bold">{jobs.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("profile");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <User className="size-3.5 text-amber-500" />
                      <span>Candidate Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("telegram");
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Send className="size-3.5 text-sky-500" />
                      <span>Telegram Assistant</span>
                    </button>

                    <Link
                      to="/builder"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="size-3.5 text-primary" />
                        <span>Live AI Studio</span>
                      </span>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </Link>
                  </div>

                  {/* Divider & Sign Out */}
                  <div className="mt-1 pt-1 border-t border-border/60">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Banner with Glassmorphism & Action Hub */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-indigo-500/10 via-background to-primary/10 p-5 sm:p-7 shadow-xs">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Welcome back, {displayName}!
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Multi-Agent Engine Online
                </span>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
                {profile?.target_role
                  ? `Positioning candidate for ${profile.target_role}. Evidence-grounded tailoring with zero hallucination guarantee.`
                  : "Optimize your ATS score, tailor resumes to exact job postings, and export single-column LaTeX."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/builder"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-xl gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-button px-4 py-2"
                )}
              >
                <Sparkles className="size-4" />
                <span>Live AI Studio</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateResumeOpen(true)}
                className="rounded-xl gap-1.5 text-xs font-semibold bg-background/80 hover:bg-background shadow-xs h-9 px-3.5"
              >
                <Plus className="size-4 text-primary" />
                <span>New Resume</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("jobs")}
                className="rounded-xl gap-1.5 text-xs font-semibold bg-background/80 hover:bg-background shadow-xs h-9 px-3.5"
              >
                <Wand2 className="size-3.5 text-indigo-500" />
                <span>Tailor to JD</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-border/60 pt-5">
            <div className="rounded-2xl bg-background/90 p-3.5 border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold">Total Resumes</span>
                <FileText className="size-3.5 text-indigo-500" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-foreground">{resumes.length}</p>
              <span className="text-[10px] text-muted-foreground">Active in Supabase</span>
            </div>

            <div className="rounded-2xl bg-background/90 p-3.5 border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold">Avg ATS Score</span>
                <ShieldCheck className="size-3.5 text-emerald-500" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {resumes.length > 0
                  ? Math.round(resumes.reduce((acc, r) => acc + (r.ats_score || 0), 0) / resumes.length)
                  : 88}%
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Workday / Lever Ready</span>
            </div>

            <div className="rounded-2xl bg-background/90 p-3.5 border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold">Tracked Jobs</span>
                <Briefcase className="size-3.5 text-amber-500" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-foreground">{jobs.length}</p>
              <span className="text-[10px] text-muted-foreground">JDs Analyzed</span>
            </div>

            <div className="rounded-2xl bg-background/90 p-3.5 border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold">LaTeX Engine</span>
                <FileCode className="size-3.5 text-sky-500" />
              </div>
              <p className="mt-1 text-xs font-extrabold text-foreground flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" /> Overleaf Compatible
              </p>
              <span className="text-[10px] text-muted-foreground">1-Page Single Column</span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Segmented Tabs */}
        <div className="flex overflow-x-auto border-b border-border pb-px gap-2">
          {[
            { id: "resumes", label: "My Resumes", icon: FileText, count: resumes.length },
            { id: "jobs", label: "JD Matcher & Jobs", icon: Briefcase, count: jobs.length },
            { id: "profile", label: "Candidate Profile", icon: User },
            { id: "telegram", label: "Telegram Assistant", icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className={cn(
                    "rounded-full px-2 py-0.2 text-[10px] font-bold",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Resumes */}
        {activeTab === "resumes" && (
          <div className="space-y-6">
            {/* Create Resume Modal / Drawer */}
            {isCreateResumeOpen && (
              <div className="rounded-3xl border border-primary/30 bg-background p-5 sm:p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FilePlus2 className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Create New ATS-Optimized Resume</h3>
                      <p className="text-[11px] text-muted-foreground">Select a role and template to start tailoring.</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateResumeOpen(false)}
                    className="size-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </Button>
                </div>

                <form onSubmit={handleCreateResume} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground">Resume Title</label>
                    <input
                      type="text"
                      required
                      value={newResumeTitle}
                      onChange={(e) => setNewResumeTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer - 2026"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Target Role</label>
                    <input
                      type="text"
                      value={newResumeRole}
                      onChange={(e) => setNewResumeRole(e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Target Company (Optional)</label>
                    <input
                      type="text"
                      value={newResumeCompany}
                      onChange={(e) => setNewResumeCompany(e.target.value)}
                      placeholder="e.g. Stripe, Google, TechCorp"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Template Format</label>
                    <select
                      value={newResumeTemplate}
                      onChange={(e) => setNewResumeTemplate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="modern-clean">Modern Clean ATS (Single Column, High Impact)</option>
                      <option value="tech-minimalist">Tech Minimalist (Code & Metric Heavy)</option>
                      <option value="executive-pro">Executive Pro (Leadership & Systems)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateResumeOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingResume}
                      size="sm"
                      className="gap-1.5 text-xs font-bold shadow-button bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {creatingResume ? "Generating..." : "Save & Open Builder"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Resumes Grid / Rich Empty State */}
            {resumes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-background p-8 sm:p-12 text-center shadow-xs">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileText className="size-7" />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-foreground">No Resumes Created Yet</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                  Pick a starter template below to spin up an ATS-optimized resume tailored with AI in seconds.
                </p>

                {/* Instant Starter Templates */}
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-3xl mx-auto text-left">
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate("ai")}
                    disabled={creatingResume}
                    className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-indigo-500/50 hover:shadow-card focus:outline-none"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Cpu className="size-4" />
                    </span>
                    <h4 className="mt-3 text-xs font-bold text-foreground">Applied AI Engineer</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      LangGraph, LLMs, structured outputs, prompt evaluation & guardrails.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Launch Template</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickTemplate("fullstack")}
                    disabled={creatingResume}
                    className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-emerald-500/50 hover:shadow-card focus:outline-none"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Layers className="size-4" />
                    </span>
                    <h4 className="mt-3 text-xs font-bold text-foreground">Full Stack Developer</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      React 19, TypeScript, Next.js, Node.js, and PostgreSQL.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Launch Template</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickTemplate("backend")}
                    disabled={creatingResume}
                    className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-sky-500/50 hover:shadow-card focus:outline-none"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <Code2 className="size-4" />
                    </span>
                    <h4 className="mt-3 text-xs font-bold text-foreground">Backend & Cloud</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      Go, Python, Kafka, microservices, Docker, and distributed APIs.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      <span>Launch Template</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => setIsCreateResumeOpen(true)}
                    className="rounded-xl gap-2 text-xs font-bold shadow-button px-5 py-2.5"
                  >
                    <Plus className="size-4" /> Create Custom Resume
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-card"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {resume.template_id || "ATS Single Column"}
                          </span>
                          <h4 className="mt-2.5 text-sm font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {resume.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {resume.target_role || "General Profile"}
                            {resume.target_company && ` • ${resume.target_company}`}
                          </p>
                        </div>

                        {/* ATS Score Badge */}
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-medium text-muted-foreground">ATS Score</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {resume.ats_score || 88}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>ATS Single-Column & Overleaf LaTeX Ready</span>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        <Link
                          to="/builder"
                          search={{ resumeId: resume.id } as any}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-7 px-2 text-xs text-primary hover:bg-primary/10"
                          )}
                          title="Edit in Live AI Studio"
                        >
                          <Sparkles className="size-3.5" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadResumeLatex(resume)}
                          className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                          title="Export ATS LaTeX (.tex)"
                        >
                          <FileCode className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success(`Exporting "${resume.title}" as PDF...`)}
                          className="h-7 px-2 text-xs hover:bg-muted"
                          title="Download PDF"
                        >
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResume(resume.id, resume.title)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          title="Delete Resume"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Job Description Matcher */}
        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Input Form Column */}
            <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Wand2 className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">AI Job Description Matcher</h3>
                  <p className="text-[11px] text-muted-foreground">Extract technical taxonomies and calculate honest match scores.</p>
                </div>
              </div>

              <form onSubmit={handleAnalyzeJob} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground">Target Role Title</label>
                  <input
                    type="text"
                    required
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Company Name</label>
                  <input
                    type="text"
                    value={jdCompany}
                    onChange={(e) => setJdCompany(e.target.value)}
                    placeholder="e.g. Stripe, Google, Linear"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Paste Full Job Description</label>
                  <textarea
                    rows={7}
                    required
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the target job description requirements here..."
                    className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={analyzingJd}
                  className="w-full gap-2 rounded-xl text-xs font-bold shadow-button bg-indigo-600 hover:bg-indigo-700 text-white py-2.5"
                >
                  <Sparkles className="size-4" />
                  <span>{analyzingJd ? "Analyzing with GPT-4o-mini..." : "Run AI Semantic Analysis"}</span>
                </Button>
              </form>
            </div>

            {/* Analyzed Jobs List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Tracked Job Postings</span>
                  <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] font-bold text-muted-foreground">{jobs.length}</span>
                </h3>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-center">
                  <Briefcase className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 text-xs font-semibold text-foreground">No Job Postings Analyzed Yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Paste any job description on the left to extract keywords and calculate matching fit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{job.title}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{job.company}</p>
                        </div>
                        <span className="rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {job.match_score || 85}% Match
                        </span>
                      </div>

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.required_skills.slice(0, 8).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        <Link
                          to="/builder"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs text-primary gap-1")}
                        >
                          <span>Tailor in Builder</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Candidate Profile */}
        {activeTab === "profile" && (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <User className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Candidate Ground-Truth Profile</h3>
                <p className="text-xs text-muted-foreground">
                  The Multi-Agent AI system uses this evidence to formulate 100% defensible resume claims.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Target Role / Specialization</label>
                  <input
                    type="text"
                    value={editTargetRole}
                    onChange={(e) => setEditTargetRole(e.target.value)}
                    placeholder="e.g. Applied AI Engineer"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Professional Headline</label>
                  <input
                    type="text"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    placeholder="e.g. AI Engineer | RAG & Agentic Systems"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">Years of Experience</label>
                  <input
                    type="number"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 2"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="https://github.com/yourhandle"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourhandle"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground">Telegram Handle (For Bot Sync)</label>
                  <input
                    type="text"
                    value={editTelegram}
                    onChange={(e) => setEditTelegram(e.target.value)}
                    placeholder="@yourhandle"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl text-xs font-bold shadow-button px-5 py-2.5"
                >
                  {savingProfile ? "Saving Profile..." : "Save Ground-Truth Profile"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Telegram Assistant */}
        {activeTab === "telegram" && (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <span className="grid size-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600">
                <Send className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-foreground">JobMate Telegram Career Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Connect your account to tailor resumes and receive ATS audits on mobile via Telegram.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                  Step 1: Open Bot
                </span>
                <h4 className="text-xs font-bold text-foreground">Start JobMate Bot</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Search for <strong className="text-foreground">@JobMateAIBot</strong> in Telegram and send <code className="text-primary font-mono">/start</code>.
                </p>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs gap-1.5 rounded-xl")}
                >
                  <span>Open Telegram Bot</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Step 2: Sync Token
                </span>
                <h4 className="text-xs font-bold text-foreground">Link Your Account</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Use your registered account email <strong className="text-foreground">{user.email}</strong> to verify your account in chat.
                </p>
                <Button
                  size="sm"
                  onClick={() => toast.success("Telegram Account Linking Token generated!")}
                  className="w-full text-xs gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <QrCode className="size-3.5" />
                  <span>Generate Link Code</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}