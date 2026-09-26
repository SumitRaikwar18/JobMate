import { createFileRoute } from "@tanstack/react-router";
import { JobMateLanding } from "@/components/landing/jobmate-landing";

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
  return <JobMateLanding />;
}
