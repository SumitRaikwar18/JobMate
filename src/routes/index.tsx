import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { JobMateLanding } from "@/components/landing/jobmate-landing";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { name: "description", content: "Turn real candidate experience into 99%+ ATS-proof single-column resumes. Powered by Multi-Agent LangGraph StateGraph, Evidence RAG, Google XYZ framework, and Overleaf pdflatex compiler." },
      { name: "keywords", content: "ATS resume builder, AI resume tailoring, LaTeX resume, Overleaf resume, Job application tracker, LangGraph, Career Copilot, ATS score checker, Google XYZ resume, Generative Engine Optimization, AEO career agent" },
      { property: "og:title", content: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { property: "og:description", content: "Build 99% ATS-compliant single-column LaTeX resumes in minutes with autonomous multi-agent AI and Overleaf pdflatex compilation." },
      { property: "og:url", content: "https://jobmate-ebon.vercel.app/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JobMate AI — Autonomous Multi-Agent ATS Resume Engineering & LaTeX Platform" },
      { name: "twitter:description", content: "Build 99% ATS-compliant single-column LaTeX resumes with multi-agent LangGraph pipeline and Overleaf pdflatex compiler." },
      { name: "twitter:image", content: "https://jobmate-ebon.vercel.app/og-banner.png" },
    ],
    links: [
      { rel: "canonical", href: "https://jobmate-ebon.vercel.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If the user is authenticated (e.g. active session, email verified),
    // automatically navigate directly to the dashboard
    if (!loading && user) {
      router.navigate({ to: "/dashboard" });
    }
  }, [user, loading, router]);

  return <JobMateLanding />;
}
