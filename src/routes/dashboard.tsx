import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — JobMate" }, { name: "description", content: "Build and tailor your JobMate resume." },
    { property: "og:title", content: "Dashboard — JobMate" }, { property: "og:description", content: "Build and tailor your JobMate resume." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: DashboardPage,
});
function DashboardPage() { return <main className="grid min-h-screen place-items-center bg-section px-4"><div className="w-full max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-card"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><LayoutDashboard /></span><h1 className="mt-5 text-2xl font-bold">Your JobMate Dashboard</h1><p className="mt-2 text-sm text-muted-foreground">The resume builder workspace is ready for its next stage.</p><Link to="/" className={cn(buttonVariants({ variant: "outline" }), "mt-7")}><ArrowLeft className="size-4" />Back home</Link></div></main>; }