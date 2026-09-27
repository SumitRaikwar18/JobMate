import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { JobMateLanding } from "@/components/landing/jobmate-landing";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobMate — AI Resume & Job Assistant" },
      { name: "description", content: "Build ATS-friendly resumes, tailor applications, and get job-ready with your AI career assistant." },
      { property: "og:title", content: "JobMate — AI Resume & Job Assistant" },
      { property: "og:description", content: "Build ATS-friendly resumes and get job-ready with JobMate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
